'use client';

import { useEffect, useRef, useState } from 'react';

interface EventInfo {
  id: string;
  name: string;
  event_date: string | null;
  upload_enabled: boolean;
}

export default function GuestUpload({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [guestName, setGuestName] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [progressText, setProgressText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then(setEvent)
      .catch(() => setNotFound(true));
  }, [eventId]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected].slice(0, 20));
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    if (files.length === 0) return;
    setStatus('uploading');
    setErrorMsg('');
    setProgressText(`Subiendo ${files.length} archivo${files.length > 1 ? 's' : ''}...`);

    try {
      const formData = new FormData();
      formData.append('eventId', eventId);
      formData.append('guestName', guestName);
      files.forEach((f) => formData.append('files', f));

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'No se pudo subir.');

      if (data.uploaded > 0) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(data.errors?.[0] || 'No se pudo subir ningún archivo.');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(
        err.message ||
          'Tu conexión se interrumpió. Tus fotos siguen a salvo en tu teléfono — intenta de nuevo.'
      );
    }
  }

  if (notFound) {
    return (
      <Centered>
        <p className="text-lg font-medium text-ink">
          Este evento no existe o el enlace es incorrecto.
        </p>
      </Centered>
    );
  }

  if (!event) {
    return (
      <Centered>
        <p className="text-ink/50">Cargando...</p>
      </Centered>
    );
  }

  if (!event.upload_enabled) {
    return (
      <Centered>
        <h1 className="font-display text-2xl font-bold text-ink">{event.name}</h1>
        <p className="mt-3 text-ink/60">
          Este evento ya no está aceptando fotos nuevas. ¡Gracias por tu interés!
        </p>
      </Centered>
    );
  }

  if (status === 'success') {
    return (
      <Centered>
        <div className="mb-4 text-5xl">❤️</div>
        <h1 className="font-display text-2xl font-bold text-ink">¡Gracias!</h1>
        <p className="mt-3 text-ink/60">Tus recuerdos ya son parte de la celebración.</p>
        <button
          onClick={() => {
            setFiles([]);
            setGuestName('');
            setStatus('idle');
          }}
          className="mt-6 rounded-xl bg-accent px-6 py-3 font-semibold text-white"
        >
          Subir más fotos
        </button>
      </Centered>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-5 py-10">
      <div className="mx-auto max-w-md">
        <h1 className="text-center font-display text-2xl font-bold text-ink">{event.name}</h1>
        <p className="mt-1 text-center text-sm text-ink/50">
          Comparte tus fotos de la celebración
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
        />

        {files.length === 0 ? (
          <label
            htmlFor="file-input"
            className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-accent/30 bg-white py-14 text-center transition active:scale-[0.99]"
          >
            <span className="text-4xl">📸</span>
            <span className="mt-3 font-semibold text-ink">Agregar tus fotos</span>
            <span className="mt-1 text-sm text-ink/40">Toca para elegir de tu galería</span>
          </label>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-3 gap-2">
              {files.map((file, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-black/5">
                  {file.type.startsWith('image/') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl">🎥</div>
                  )}
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                    aria-label="Quitar"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <label
                htmlFor="file-input"
                className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-ink/15 text-2xl text-ink/30"
              >
                +
              </label>
            </div>

            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Tu nombre (opcional)"
              maxLength={60}
              className="mt-6 w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent/40"
            />

            {status === 'error' && <p className="mt-3 text-sm text-red-600">{errorMsg}</p>}

            <button
              onClick={handleUpload}
              disabled={status === 'uploading'}
              className="mt-4 w-full rounded-xl bg-accent px-6 py-3.5 font-semibold text-white shadow-lg shadow-accent/30 disabled:opacity-60"
            >
              {status === 'uploading' ? progressText : `Subir recuerdos ❤️ (${files.length})`}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-center">
      {children}
    </main>
  );
}
