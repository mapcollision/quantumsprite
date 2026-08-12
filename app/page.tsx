import CreateEventForm from '@/components/CreateEventForm';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 via-cream to-cream">
      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-16 pt-20 text-center sm:pt-28">
        <span className="mb-4 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
          Para bodas, cumpleaños, XV años y más
        </span>
        <h1 className="font-display text-4xl font-bold leading-tight text-ink sm:text-6xl">
          Todos tomaron una foto.
          <br /> Ahora todos pueden compartirla.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink/60">
          Un código QR. Cientos de recuerdos. Una galería hermosa que reúne todas
          las fotos de tus invitados en un solo lugar.
        </p>

        <div className="mt-10 flex w-full justify-center">
          <CreateEventForm />
        </div>

        <p className="mt-6 text-sm text-ink/40">
          Gratis · Sin registro para tus invitados · Listo en 30 segundos
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          <StepCard number="1" title="Crea tu evento" text="Escribe el nombre y listo — obtienes tu código QR al instante." />
          <StepCard number="2" title="Colócalo en las mesas" text="Descarga e imprime el QR. Tus invitados lo escanean con su celular." />
          <StepCard number="3" title="Recibe las fotos" text="Cada foto que tomen tus invitados aparece en tu galería privada." />
        </div>
      </section>
    </main>
  );
}

function StepCard({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-ink/5 bg-white p-6 text-left shadow-sm">
      <span className="font-display text-3xl font-bold text-accent">{number}</span>
      <h3 className="mt-3 font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm text-ink/60">{text}</p>
    </div>
  );
}
