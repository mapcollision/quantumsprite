import { createClient } from '@supabase/supabase-js';

// Este cliente SOLO se usa dentro de rutas de API (servidor).
// Nunca se importa desde un componente 'use client'.
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Faltan las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export const STORAGE_BUCKET = 'event-photos';
