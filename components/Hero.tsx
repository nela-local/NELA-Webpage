'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { Download, Terminal, Loader2, Cloud } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTheme } from './ThemeProvider';
import { trackClientEvent } from '@/lib/analytics-client';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';
import { buildInstallerDownloadLink } from '@/lib/download-links';
import {
  fetchReleases,
  detectClientPlatform,
  latestAssetForPlatform,
  type PlatformName,
  formatBytes,
  type ReleaseAsset,
  type ReleasesData,
  assetTypeLabel,
} from '@/lib/releases';

// Start the fetch the instant this module is loaded — before React even mounts.
// By the time useEffect fires, the response is likely already in-flight or done.
const releasesPreload = fetchReleases().catch(() => null);

export default function Hero() {
  const { theme } = useTheme();
  const [asset, setAsset] = useState<ReleaseAsset | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformName>('Windows');
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    releasesPreload.then((data: ReleasesData | null) => {
      if (data) {
        const platform = detectClientPlatform(window.navigator.userAgent);
        setSelectedPlatform(platform);

        const latestForPlatform = latestAssetForPlatform(data, platform);
        if (latestForPlatform) {
          setAsset(latestForPlatform.asset);
          setSelectedVersion(latestForPlatform.version);
        } else {
          setAsset(null);
          setSelectedVersion(null);
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleDownload = () => {
    if (!asset) return;
    if (!selectedVersion) return;

    trackClientEvent(ANALYTICS_EVENTS.DownloadClick, {
      source: 'hero_primary',
      platform: selectedPlatform,
      version: selectedVersion,
      asset_name: asset.name,
      asset_type: asset.type,
      asset_size_bytes: asset.size,
    });

    const downloadUrl = buildInstallerDownloadLink({
      version: selectedVersion,
      platform: selectedPlatform,
      assetName: asset.name,
      source: 'hero_primary',
    });

    window.location.assign(downloadUrl);
  };

  const platformLabel = selectedPlatform === 'macOS' ? 'macOS' : selectedPlatform;
  const fileLabel = asset ? assetTypeLabel(asset.type) : '';

  return (
    <section className="relative flex min-h-screen items-center justify-center px-4 pb-32 pt-24 sm:px-6 sm:pt-28">
      <div className="z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center">

        {/* Dorky Terminal Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md mb-8 border transition-colors duration-300"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
        >
          <Terminal className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
            Local-first · optional Cloud
          </span>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, type: 'spring', bounce: 0.3 }}
          className="mb-8"
        >
          <Image
            src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
            alt="NELA Logo"
            width={250}
            height={250}
            priority
            className="transition-opacity duration-300"
          />
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, type: 'spring', bounce: 0.4 }}
          className="font-space inline-block overflow-visible px-[0.06em] pb-[0.08em] text-7xl md:text-9xl font-bold tracking-tight mb-6 bg-clip-text text-transparent"
          style={{ backgroundImage: 'linear-gradient(to bottom, var(--gradient-text-from), var(--gradient-text-to))' }}
        >
          NELA
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-3xl max-w-2xl mb-4 font-light"
          style={{ color: 'var(--text-secondary)' }}
        >
          Neural Engine for Local Analysis.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-base md:text-lg max-w-xl mb-12 font-light"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Your private AI workspace on desktop — run models on this device, or sign in for optional NELA Cloud.
        </motion.p>

        {/* Download Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading || !asset}
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-bold text-lg overflow-hidden transition-transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
            >
              <div className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" style={{ background: 'var(--accent)' }} />
              <span className="relative z-10 flex items-center gap-2">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                {loading ? 'Loading...' : `Download for ${platformLabel}`}
              </span>
            </button>

            <Link
              href="/try"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-lg border transition-transform hover:scale-105 active:scale-95"
              style={{
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)',
                background: 'var(--bg-card)',
              }}
            >
              <Cloud className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              Try Cloud in browser
            </Link>
          </div>

          <span className="font-mono text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {loading
              ? 'Fetching latest release...'
              : asset
              ? `${selectedVersion} • ${formatBytes(asset.size)} • ${fileLabel}`
              : `No ${platformLabel} release found`}
          </span>
        </motion.div>

      </div>
    </section>
  );
}
