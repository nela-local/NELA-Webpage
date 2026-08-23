// Server Component — no 'use client' directive.
// Data is fetched at render time on the server; the page arrives pre-populated.
import { getReleasesServerSide } from '@/lib/releases';
import DownloadInstaller from '@/components/DownloadInstaller';

export default async function DownloadPage() {
  // Fetch is cached server-side via unstable_cache — no round-trip from the browser.
  const data = await getReleasesServerSide();

  return (
    <main className="relative min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-20">
          <h1
            className="font-space inline-block overflow-visible px-[0.06em] pb-[0.08em] text-5xl md:text-7xl font-bold tracking-tight mb-4 bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to bottom, var(--gradient-text-from), var(--gradient-text-to))' }}
          >
            Downloads
          </h1>
          <p className="text-lg font-light max-w-md mx-auto" style={{ color: 'var(--text-tertiary)' }}>
            Everything you need to run NELA on your machine — with optional NELA Cloud after you sign in.
          </p>
        </div>

        {/* ── Installer Section ── */}
        <section>
          <DownloadInstaller data={data} />
        </section>

      </div>
    </main>
  );
}
