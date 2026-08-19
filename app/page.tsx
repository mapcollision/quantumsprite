import CreateEventForm from '@/components/CreateEventForm';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 via-cream to-cream">
      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-16 pt-20 text-center sm:pt-28">
        <span className="mb-4 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
          For weddings, birthdays, quinceañeras & more
        </span>
        <h1 className="font-display text-4xl font-bold leading-tight text-ink sm:text-6xl">
          Everyone took a photo.
          <br /> Now everyone can share it.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink/60">
          One QR code. Hundreds of memories. One beautiful gallery that brings all of your
          guests&apos; photos together in one place.
        </p>

        <div className="mt-10 flex w-full justify-center">
          <CreateEventForm />
        </div>

        <p className="mt-6 text-sm text-ink/40">
          Free · No sign-up for guests · Ready in 30 seconds
        </p>
        <p className="mt-2 max-w-md text-xs text-ink/35">
          Photos are available for 48 hours after your event is created — download them before
          then, as they can&apos;t be recovered afterward.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          <StepCard number="1" title="Create your event" text="Enter a name and you're done — get your QR code instantly." />
          <StepCard number="2" title="Place it on the tables" text="Download and print the QR. Your guests scan it with their phone." />
          <StepCard number="3" title="Receive the photos" text="Every photo your guests take shows up in your private gallery." />
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
