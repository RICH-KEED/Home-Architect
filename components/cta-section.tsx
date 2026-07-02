export function CTASection() {
  return (
    <section id="contact" className="grid min-h-screen place-items-center bg-neutral-950 px-6 text-center text-white">
      <div>
        <p className="mb-5 text-xs uppercase tracking-[0.45em] text-white/45">Dream to Home</p>
        <h2 className="mx-auto max-w-4xl text-5xl font-semibold tracking-[-0.06em] md:text-8xl">
          Let&apos;s Build Something Extraordinary
        </h2>
        <a
          href="mailto:hello@example.com?subject=Start%20Your%20Project"
          className="mt-10 inline-flex rounded-full border border-white/20 px-7 py-4 text-sm font-medium uppercase tracking-[0.25em] text-white transition hover:border-white hover:bg-white hover:text-black"
        >
          Start Your Project
        </a>
      </div>
    </section>
  );
}
