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

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_FILES = 20;

interface IncomingFile {
  name: string;
  type: string;
  size: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventId = body?.eventId;
    const files: IncomingFile[] = Array.isArray(body?.files) ? body.files : [];

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

    const uploads: Array<{
      index: number;
      path: string;
      token: string;
      mediaType: 'image' | 'video';
    }> = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
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

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUploadUrl(path);

      if (error || !data) {
        console.error('Error creating signed upload URL:', error);
        errors.push(`${file.name}: no se pudo preparar la subida.`);
        continue;
      }

      uploads.push({ index: i, path, token: data.token, mediaType });
    }

    return NextResponse.json({ uploads, errors });
  } catch (err) {
    console.error('Error in upload/init route:', err);
    return NextResponse.json({ error: 'Algo salió mal. Intenta de nuevo.' }, { status: 500 });
  }
}
