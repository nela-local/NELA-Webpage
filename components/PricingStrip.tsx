'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { trackClientEvent } from '@/lib/analytics-client';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';

export default function PricingStrip() {
  return (
    <section className="relative py-20 px-6 z-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto rounded-[2rem] border p-8 md:p-12 backdrop-blur-xl text-center"
        style={{
          background: 'var(--bg-overlay)',
          borderColor: 'var(--border-primary)',
          boxShadow: '0 0 24px var(--accent-glow)',
        }}
      >
        <p
          className="font-mono text-xs uppercase tracking-wider mb-4"
          style={{ color: 'var(--accent)' }}
        >
          Simple INR pricing
        </p>
        <h2
          className="font-space text-3xl md:text-5xl font-bold tracking-tight mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Cloud from ₹399 · Tally Early Access ₹299
        </h2>
        <p
          className="text-base md:text-lg max-w-2xl mx-auto mb-8 font-light"
          style={{ color: 'var(--text-secondary)' }}
        >
          Free Private on your PC. Cloud Starter and Pro for credits. Tally Connector Early Access — ₹299/mo or ₹2,999/yr — billing opens soon; connect in the desktop app today.
        </p>
        <Link
          href="/pricing"
          onClick={() => {
            trackClientEvent(ANALYTICS_EVENTS.NavClick, {
              source: 'home_pricing_strip',
              destination: 'pricing',
            });
          }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-transform hover:scale-105"
          style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
        >
          See full pricing
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </section>
  );
}
