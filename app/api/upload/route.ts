import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSupabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase-server';

const ALLOWED_TYPES: Record<string, 'image' | 'video'> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/heic': 'image',
  'image/heif': 'image',
  'video/mp4': 'video',
  'video/quicktime': 'video',
  'video/webm': 'video',
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_FILES = 20;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const eventId = formData.get('eventId');
    const guestName = (formData.get('guestName') || '').toString().trim().slice(0, 60) || null;
    const files = formData.getAll('files').filter((f): f is File => f instanceof File);

    if (!eventId || typeof eventId !== 'string') {
      return NextResponse.json({ error: 'Falta el identificador del evento.' }, { status: 400 });
    }
    if (files.length === 0) {
      return NextResponse.json({ error: 'No se seleccionaron archivos.' }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Solo puedes subir hasta ${MAX_FILES} archivos a la vez.` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, upload_enabled')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Este evento no existe.' }, { status: 404 });
    }
    if (!event.upload_enabled) {
      return NextResponse.json(
        { error: 'Este evento ya no está aceptando fotos nuevas.' },
        { status: 403 }
      );
    }

    let uploaded = 0;
    const errors: string[] = [];

    for (const file of files) {
      const mediaType = ALLOWED_TYPES[file.type];
      if (!mediaType) {
        errors.push(`${file.name}: tipo de archivo no permitido.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: el archivo es demasiado grande (máx. 25MB).`);
        continue;
      }

      const extension = file.type.split('/')[1] || 'bin';
      const path = `${eventId}/${randomUUID()}.${extension}`;

      let bytes: ArrayBuffer;
      try {
        bytes = await file.arrayBuffer();
      } catch {
        errors.push(`${file.name}: no se pudo leer el archivo.`);
        continue;
      }

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, Buffer.from(bytes), { contentType: file.type, upsert: false });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        errors.push(`${file.name}: no se pudo subir.`);
        continue;
      }

      const { error: insertError } = await supabase.from('media').insert({
        event_id: eventId,
        storage_path: path,
        guest_name: guestName,
        media_type: mediaType,
      });

      if (insertError) {
        console.error('DB insert error:', insertError);
        errors.push(`${file.name}: se subió pero no se pudo registrar.`);
        continue;
      }

      uploaded++;
    }

    return NextResponse.json({ uploaded, total: files.length, errors });
  } catch (err) {
    console.error('Error in upload route:', err);
    return NextResponse.json(
      { error: 'Tu conexión se interrumpió. Tus fotos siguen a salvo en tu teléfono — intenta de nuevo.' },
      { status: 500 }
    );
  }
}
