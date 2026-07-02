export function Navbar() {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 px-5 py-5 md:px-10">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-black/25 px-5 py-3 text-white shadow-2xl shadow-black/20 backdrop-blur-xl">
        <a href="#top" className="text-sm font-semibold tracking-[-0.02em]" aria-label="Dream to Home homepage">
          Dream to Home
        </a>
        <div className="hidden items-center gap-8 text-xs uppercase tracking-[0.24em] text-white/55 md:flex">
          <a className="transition hover:text-white" href="#story">Story</a>
          <a className="transition hover:text-white" href="#reveal">Reveal</a>
          <a className="transition hover:text-white" href="#contact">Contact</a>
        </div>
        <a
          href="#contact"
          className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-white/85"
        >
          Start
        </a>
      </nav>
    </header>
  );
}
