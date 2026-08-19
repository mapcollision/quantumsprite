'use client';

import { useEffect, useRef, useState } from 'react';
import { getSupabaseBrowser, STORAGE_BUCKET } from '@/lib/supabase-browser';

interface EventInfo {
  id: string;
  name: string;
  event_date: string | null;
  upload_enabled: boolean;
  expired: boolean;
}

interface InitUpload {
  index: number;
  path: string;
  token: string;
  mediaType: 'image' | 'video';
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
    setProgressText('Preparing...');

    try {
      const initRes = await fetch('/api/upload/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          files: files.map((f) => ({ name: f.name, type: f.type, size: f.size })),
        }),
      });
      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.error || 'Could not start the upload.');

      const uploads: InitUpload[] = initData.uploads || [];

      if (uploads.length === 0) {
        setStatus('error');
        setErrorMsg(initData.errors?.[0] || 'Could not upload any files.');
        return;
      }

      const supabase = getSupabaseBrowser();
      const completed: Array<{ path: string; mediaType: 'image' | 'video' }> = [];

      for (let i = 0; i < uploads.length; i++) {
        const u = uploads[i];
        setProgressText(`Uploading ${i + 1} of ${uploads.length}...`);
        const file = files[u.index];

        const { error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .uploadToSignedUrl(u.path, u.token, file);

        if (!error) {
          completed.push({ path: u.path, mediaType: u.mediaType });
        }
      }

      if (completed.length === 0) {
        setStatus('error');
        setErrorMsg(
          'Your connection dropped. Your photos are still safe on your phone — try again.'
        );
        return;
      }

      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, guestName, uploaded: completed }),
      });

      if (!completeRes.ok) {
        const data = await completeRes.json().catch(() => ({}));
        throw new Error(data.error || 'Could not register your upload.');
      }

      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(
        err.message ||
          'Your connection dropped. Your photos are still safe on your phone — try again.'
      );
    }
  }

  if (notFound) {
    return (
      <Centered>
        <p className="text-lg font-medium text-ink">
          This event doesn&apos;t exist, or the link is incorrect.
        </p>
      </Centered>
    );
  }

  if (!event) {
    return (
      <Centered>
        <p className="text-ink/50">Loading...</p>
      </Centered>
    );
  }

  if (event.expired) {
    return (
      <Centered>
        <div className="mb-4 text-4xl">⏳</div>
        <h1 className="font-display text-2xl font-bold text-ink">{event.name}</h1>
        <p className="mt-3 text-ink/60">
          This event has expired — photos are only available for 48 hours after the event was
          created. Thanks for stopping by!
        </p>
      </Centered>
    );
  }

  if (!event.upload_enabled) {
    return (
      <Centered>
        <h1 className="font-display text-2xl font-bold text-ink">{event.name}</h1>
        <p className="mt-3 text-ink/60">
          This event is no longer accepting new photos. Thanks for your interest!
        </p>
      </Centered>
    );
  }

  if (status === 'success') {
    return (
      <Centered>
        <div className="mb-4 text-5xl">❤️</div>
        <h1 className="font-display text-2xl font-bold text-ink">Thank you!</h1>
        <p className="mt-3 text-ink/60">Your memories are now part of the celebration.</p>
        <button
          onClick={() => {
            setFiles([]);
            setGuestName('');
            setStatus('idle');
          }}
          className="mt-6 rounded-xl bg-accent px-6 py-3 font-semibold text-white"
        >
          Upload more photos
        </button>
      </Centered>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-5 py-10">
      <div className="mx-auto max-w-md">
        <h1 className="text-center font-display text-2xl font-bold text-ink">{event.name}</h1>
        <p className="mt-1 text-center text-sm text-ink/50">
          Share your photos from the celebration
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
            <span className="mt-3 font-semibold text-ink">Add your photos</span>
            <span className="mt-1 text-sm text-ink/40">Tap to choose from your gallery</span>
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
                    aria-label="Remove"
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
              placeholder="Your name (optional)"
              maxLength={60}
              className="mt-6 w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent/40"
            />

            {status === 'error' && <p className="mt-3 text-sm text-red-600">{errorMsg}</p>}

            <button
              onClick={handleUpload}
              disabled={status === 'uploading'}
              className="mt-4 w-full rounded-xl bg-accent px-6 py-3.5 font-semibold text-white shadow-lg shadow-accent/30 disabled:opacity-60"
            >
              {status === 'uploading' ? progressText : `Upload memories ❤️ (${files.length})`}
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
