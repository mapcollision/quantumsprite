import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase-server';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { token: string; mediaId: string } }
) {
  const supabase = getSupabaseAdmin();

  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('admin_token', params.token)
    .single();

  if (!event) {
    return NextResponse.json({ error: 'Enlace de administrador inválido.' }, { status: 404 });
  }

  const { data: mediaItem } = await supabase
    .from('media')
    .select('id, storage_path, event_id')
    .eq('id', params.mediaId)
    .single();

  if (!mediaItem || mediaItem.event_id !== event.id) {
    return NextResponse.json({ error: 'Foto no encontrada.' }, { status: 404 });
  }

  await supabase.storage.from(STORAGE_BUCKET).remove([mediaItem.storage_path]);
  const { error } = await supabase.from('media').delete().eq('id', mediaItem.id);

  if (error) {
    return NextResponse.json({ error: 'No se pudo eliminar la foto.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
