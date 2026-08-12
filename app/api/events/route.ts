import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body?.name || '').toString().trim();
    const eventDate = body?.eventDate || null;

    if (!name) {
      return NextResponse.json({ error: 'El nombre del evento es requerido.' }, { status: 400 });
    }
    if (name.length > 120) {
      return NextResponse.json({ error: 'El nombre del evento es demasiado largo.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('events')
      .insert({ name, event_date: eventDate })
      .select('id, admin_token')
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id, adminToken: data.admin_token });
  } catch (err) {
    console.error('Error creating event:', err);
    return NextResponse.json(
      { error: 'No se pudo crear el evento. Intenta de nuevo.' },
      { status: 500 }
    );
  }
}
