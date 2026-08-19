import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

interface CompletedUpload {
  path: string;
  mediaType: 'image' | 'video';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventId = body?.eventId;
    const guestName = (body?.guestName || '').toString().trim().slice(0, 60) || null;
    const uploaded: CompletedUpload[] = Array.isArray(body?.uploaded) ? body.uploaded : [];

    if (!eventId || typeof eventId !== 'string') {
      return NextResponse.json({ error: 'Missing event ID.' }, { status: 400 });
    }
    if (uploaded.length === 0) {
      return NextResponse.json({ error: 'No files to register.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'This event does not exist.' }, { status: 404 });
    }

    const rows = uploaded
      .filter((u) => typeof u.path === 'string' && u.path.startsWith(`${eventId}/`))
      .map((u) => ({
        event_id: eventId,
        storage_path: u.path,
        guest_name: guestName,
        media_type: u.mediaType === 'video' ? 'video' : 'image',
      }));

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid files to register.' }, { status: 400 });
    }

    const { error } = await supabase.from('media').insert(rows);

    if (error) {
      console.error('Error inserting media rows:', error);
      return NextResponse.json({ error: 'Could not register the upload.' }, { status: 500 });
    }

    return NextResponse.json({ saved: rows.length });
  } catch (err) {
    console.error('Error in upload/complete route:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
