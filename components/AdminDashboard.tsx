'use client';

import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface EventInfo {
  id: string;
  name: string;
  event_date: string | null;
  upload_enabled: boolean;
  expired: boolean;
  created_at: string;
}

interface MediaItem {
  id: string;
  storage_path: string;
  guest_name: string | null;
  media_type: 'image' | 'video';
  created_at: string;
  url: string;
}

export default function AdminDashboard({ token }: { token: string }) {
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [guestLink, setGuestLink] = useState('');
  const [adminLink, setAdminLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [adminCopied, setAdminCopied] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [hoursLeft, setHoursLeft] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/${token}`);
    if (!res.ok) {
      setNotFound(true);
      return;
    }
    const data = await res.json();
    setEvent(data.event);
    setMedia(data.media);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!event) return;
    const link = `${window.location.origin}/e/${event.id}`;
    setGuestLink(link);
    setAdminLink(`${window.location.origin}/admin/${token}`);
    QRCode.toDataURL(link, {
      width: 600,
      margin: 2,
      color: { dark: '#26221E', light: '#FBF7F2' },
    })
      .then(setQrDataUrl)
      .catch(() => {});

    const expiresAt = new Date(event.created_at).getTime() + 48 * 60 * 60 * 1000;
    const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / (60 * 60 * 1000)));
    setHoursLeft(remaining);
  }, [event, token]);

  async function toggleUploads() {
    if (!event) return;
    const next = !event.upload_enabled;
    setEvent({ ...event, upload_enabled: next });
    await fetch(`/api/admin/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadEnabled: next }),
    });
  }

  async function deleteMedia(id: string) {
    if (!confirm('Delete this photo? This cannot be undone.')) return;
    setMedia((prev) => prev.filter((m) => m.id !== id));
    await fetch(`/api/admin/${token}/media/${id}`, { method: 'DELETE' });
  }

  function copyLink() {
    navigator.clipboard.writeText(guestLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyAdminLink() {
    navigator.clipboard.writeText(adminLink);
    setAdminCopied(true);
    setTimeout(() => setAdminCopied(false), 2000);
  }

  function downloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-${event?.name?.replace(/\s+/g, '-').toLowerCase() || 'event'}.png`;
    a.click();
  }

  async function downloadAll() {
    if (media.length === 0) return;
    setZipping(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (const item of media) {
        const res = await fetch(item.url);
        const blob = await res.blob();
        const ext = item.storage_path.split('.').pop();
        const label = item.guest_name ? item.guest_name.replace(/\s+/g, '-') : 'guest';
        zip.file(`${label}-${item.id.slice(0, 8)}.${ext}`, blob);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photos-${event?.name?.replace(/\s+/g, '-').toLowerCase() || 'event'}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setZipping(false);
    }
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
        <p className="text-ink/70">This admin link isn&apos;t valid.</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-ink/40">Loading...</p>
      </main>
    );
  }

  const photoCount = media.filter((m) => m.media_type === 'image').length;
  const videoCount = media.filter((m) => m.media_type === 'video').length;
  const contributors = new Set(media.map((m) => m.guest_name).filter(Boolean)).size;

  return (
    <main className="min-h-screen bg-cream pb-20">
      <header className="border-b border-ink/5 bg-white px-6 py-6">
        <h1 className="font-display text-2xl font-bold text-ink">{event.name}</h1>
        {event.event_date && <p className="text-sm text-ink/50">{event.event_date}</p>}
      </header>

      <section className="mx-auto max-w-3xl px-6 py-8">
        {event.expired ? (
          <div className="rounded-3xl border-2 border-red-300 bg-red-50 p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <h2 className="font-semibold text-red-700">This event has expired</h2>
            </div>
            <p className="mt-1 text-sm text-red-700/80">
              Photos are only available for 48 hours after an event is created. All photos and
              videos for this event have been permanently deleted and cannot be recovered.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            ⏳ <b>{hoursLeft ?? '—'} hours left</b> to download your photos — they are
            permanently deleted 48 hours after this event was created and cannot be recovered
            afterward.
          </div>
        )}

        {/* Admin link — clearly separated from the guest-sharing card below */}
        <div className="mt-6 rounded-3xl border-2 border-accent/40 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔑</span>
            <h2 className="font-semibold text-ink">Your admin link — save this</h2>
          </div>
          <p className="mt-1 text-sm text-ink/50">
            This page is yours alone. It&apos;s not the same as the guest link below — save it
            before closing this tab, it&apos;s your only way back in.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-ink/10 bg-cream px-3 py-2">
            <span className="flex-1 truncate text-sm text-ink/70">{adminLink}</span>
            <button
              onClick={copyAdminLink}
              className="shrink-0 text-sm font-medium text-accent"
            >
              {adminCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <Stat label="Photos" value={photoCount} />
          <Stat label="Videos" value={videoCount} />
          <Stat label="Guests" value={contributors} />
        </div>

        <div className="mt-6 rounded-3xl border border-ink/5 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-ink">Share with your guests</h2>
          <p className="mt-1 text-sm text-ink/50">
            <span className="font-medium text-ink/70">This link is for guests only</span> —
            print this QR and place it on the tables. It is not your admin link.
          </p>
          <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="QR code"
                className="h-40 w-40 rounded-xl border border-ink/10"
              />
            )}
            <div className="w-full flex-1 space-y-2">
              <div className="flex items-center gap-2 rounded-xl border border-ink/10 bg-cream px-3 py-2">
                <span className="flex-1 truncate text-sm text-ink/70">{guestLink}</span>
                <button onClick={copyLink} className="shrink-0 text-sm font-medium text-accent">
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <button
                onClick={downloadQr}
                className="w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white"
              >
                Download QR (PNG)
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-medium text-ink">Receive new photos</p>
            <p className="text-xs text-ink/40">
              {event.upload_enabled
                ? 'Active — guests can upload photos'
                : 'Closed — no longer accepting new photos'}
            </p>
          </div>
          <button
            onClick={toggleUploads}
            disabled={event.expired}
            className={`relative h-7 w-12 rounded-full transition disabled:opacity-40 ${
              event.upload_enabled ? 'bg-accent' : 'bg-ink/15'
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                event.upload_enabled ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="font-semibold text-ink">Gallery ({media.length})</h2>
          {media.length > 0 && (
            <button
              onClick={downloadAll}
              disabled={zipping}
              className="text-sm font-medium text-accent disabled:opacity-50"
            >
              {zipping ? 'Preparing ZIP...' : 'Download all'}
            </button>
          )}
        </div>

        {media.length === 0 ? (
          <p className="mt-6 text-center text-sm text-ink/40">
            {event.expired
              ? 'Photos were permanently deleted when this event expired.'
              : 'No photos yet. Share your QR!'}
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {media.map((item) => (
              <div key={item.id} className="group relative aspect-square overflow-hidden rounded-xl bg-black/5">
                {item.media_type === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <video src={item.url} className="h-full w-full object-cover" muted />
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                  <span className="truncate text-[11px] text-white/90">
                    {item.guest_name || 'Guest'}
                  </span>
                  <div className="flex gap-1.5">
                    <a href={item.url} download className="text-xs text-white" aria-label="Download">
                      ⬇
                    </a>
                    <button
                      onClick={() => deleteMedia(item.id)}
                      className="text-xs text-white"
                      aria-label="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
      <p className="font-display text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs text-ink/50">{label}</p>
    </div>
  );
}
