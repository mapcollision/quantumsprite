'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateEventForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Escribe el nombre de tu evento.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), eventDate: eventDate || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Algo salió mal.');
      router.push(`/admin/${data.adminToken}`);
    } catch (err: any) {
      setError(err.message || 'No se pudo crear el evento. Intenta de nuevo.');
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-4 rounded-3xl border border-rose-900/5 bg-white/80 p-6 shadow-xl shadow-rose-900/5 backdrop-blur sm:p-8"
    >
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink/70">Nombre del evento</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Boda de Sarah & John"
          maxLength={120}
          className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink/70">Fecha (opcional)</label>
        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-accent px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-accent/30 transition hover:bg-accent/90 disabled:opacity-60"
      >
        {loading ? 'Creando...' : 'Crear mi evento'}
      </button>
    </form>
  );
}
