import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase-server';

async function getEventByToken(token: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('events')
    .select('id, name, event_date, upload_enabled, created_at')
    .eq('admin_token', token)
    .single();
  if (error || !data) return null;
  return data;
}

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const event = await getEventByToken(params.token);
  if (!event) {
    return NextResponse.json({ error: 'Enlace de administrador inválido.' }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const { data: media, error } = await supabase
    .from('media')
    .select('id, storage_path, guest_name, media_type, created_at')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'No se pudo cargar la galería.' }, { status: 500 });
  }

  const mediaWithUrls = (media || []).map((m) => ({
    ...m,
    url: supabase.storage.from(STORAGE_BUCKET).getPublicUrl(m.storage_path).data.publicUrl,
  }));

  return NextResponse.json({ event, media: mediaWithUrls });
}

export async function PATCH(req: NextRequest, { params }: { params: { token: string } }) {
  const event = await getEventByToken(params.token);
  if (!event) {
    return NextResponse.json({ error: 'Enlace de administrador inválido.' }, { status: 404 });
  }

  const body = await req.json();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('events')
    .update({ upload_enabled: !!body.uploadEnabled })
    .eq('id', event.id);

  if (error) {
    return NextResponse.json({ error: 'No se pudo actualizar el evento.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
