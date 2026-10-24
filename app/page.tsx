import { PingButton } from '@/components/ping-button';
import { apiBaseUrl } from '@/lib/env';

export default function Home() {
  const mock = apiBaseUrl() === null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 md:px-12">
      <main className="grid flex-1 content-center items-center gap-12 py-16 md:grid-cols-[1fr_auto] md:gap-16 md:py-24">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-5">
            <h1 className="font-display text-[clamp(3.75rem,13vw,6rem)] leading-[0.92] tracking-[-0.02em] text-balance">
              My App
            </h1>
            <p className="max-w-[36ch] text-lg leading-relaxed text-ink-muted text-pretty">
              A short tagline that says what this app does.
            </p>
          </div>
          <PingButton />
        </div>

        <div
          aria-hidden
          className="order-first size-28 justify-self-end rounded-full bg-accent md:order-none md:size-[min(36vw,26rem)]"
        />
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-rule py-6 text-sm text-ink-muted">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className={`size-2 rounded-full ${mock ? 'bg-accent' : 'bg-success'}`} />
          {mock ? 'Mock API. Set API_URL to call your backend.' : 'Live API'}
        </span>
      </footer>
    </div>
  );
}
