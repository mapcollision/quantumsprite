import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase-server';

export const maxDuration = 10;

// Runs once a day (see vercel.json). Permanently deletes all photos/videos
// for events older than 48 hours, and marks the event as expired.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: expiredEvents, error } = await supabase
    .from('events')
    .select('id')
    .eq('expired', false)
    .lt('created_at', cutoff)
    .limit(20);

  if (error) {
    console.error('Cron cleanup: failed to fetch expired events', error);
    return NextResponse.json({ error: 'Failed to fetch expired events' }, { status: 500 });
  }

  let cleanedEvents = 0;
  let deletedFiles = 0;

  for (const ev of expiredEvents || []) {
    const { data: mediaRows } = await supabase
      .from('media')
      .select('id, storage_path')
      .eq('event_id', ev.id);

    if (mediaRows && mediaRows.length > 0) {
      const paths = mediaRows.map((m) => m.storage_path);
      await supabase.storage.from(STORAGE_BUCKET).remove(paths);
      await supabase.from('media').delete().eq('event_id', ev.id);
      deletedFiles += paths.length;
    }

    await supabase
      .from('events')
      .update({ expired: true, upload_enabled: false })
      .eq('id', ev.id);

    cleanedEvents++;
  }

  return NextResponse.json({ cleanedEvents, deletedFiles });
}
