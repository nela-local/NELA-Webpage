'use client';

import { motion } from 'motion/react';
import { Download, Github, Mail } from 'lucide-react';
import Link from 'next/link';
import { trackClientEvent } from '@/lib/analytics-client';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';

export default function Footer() {
  const handleDownloadCtaClick = () => {
    trackClientEvent(ANALYTICS_EVENTS.NavClick, {
      source: 'footer',
      destination: 'download',
    });

    trackClientEvent(ANALYTICS_EVENTS.DownloadClick, {
      source: 'footer_cta',
      destination: '/download',
    });
  };

  return (
    <footer className="relative py-32 px-6 z-10 border-t"
      style={{ background: 'var(--bg-overlay-heavy)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-space inline-block overflow-visible px-[0.06em] pb-[0.08em] text-5xl md:text-8xl font-bold tracking-tight mb-8 bg-clip-text text-transparent"
          style={{ backgroundImage: 'linear-gradient(to bottom, var(--gradient-text-from), var(--gradient-text-to))' }}
        >
          Ready for your workspace?
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-xl max-w-2xl mb-16 font-light"
          style={{ color: 'var(--text-secondary)' }}
        >
          Download NELA for Private on-device AI. Sign in after install when you want optional NELA Cloud.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, type: 'spring', bounce: 0.5 }}
          className="mb-32"
        >
          <Link
            href="/download"
            onClick={handleDownloadCtaClick}
            className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full font-bold text-xl overflow-hidden transition-transform hover:scale-105 active:scale-95"
            style={{
              background: 'var(--accent)',
              color: 'var(--bg-primary)',
              boxShadow: `0 0 40px var(--accent-glow)`,
            }}
          >
            <div className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"
              style={{ background: 'var(--text-primary)' }}
            />
            <span className="relative z-10 flex items-center gap-2">
              <Download className="w-6 h-6" />
              Download NELA
            </span>
          </Link>
        </motion.div>

        <div className="w-full border-t pt-12 flex flex-col md:flex-row items-center justify-between gap-6"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <div className="font-space text-2xl font-bold tracking-tighter" style={{ color: 'var(--text-primary)' }}>NELA</div>
          
          <div className="flex gap-6 items-center" style={{ color: 'var(--text-tertiary)' }}>
            <Link href="/privacy" className="text-sm hover:opacity-80 transition-opacity">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm hover:opacity-80 transition-opacity">
              Terms
            </Link>
            <a
              href="https://github.com/nela-local/nela"
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-80 transition-opacity"
              aria-label="NELA GitHub"
              onClick={() => {
                trackClientEvent(ANALYTICS_EVENTS.FeatureInteraction, {
                  source: 'footer',
                  action: 'external_link_click',
                  target: 'github',
                });
              }}
            >
              <Github className="w-6 h-6" />
            </a>
            <a
              href="mailto:nelalocal.official@gmail.com"
              target="_blank"
              className="hover:opacity-80 transition-opacity"
              aria-label="Email NELA"
              onClick={() => {
                trackClientEvent(ANALYTICS_EVENTS.FeatureInteraction, {
                  source: 'footer',
                  action: 'external_link_click',
                  target: 'mailto',
                });
              }}
            >
              <Mail className="w-6 h-6" />
            </a>
          </div>
          
          <div className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} NELA Intelligence. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
