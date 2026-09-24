'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { TbShieldLock, TbPlugConnected, TbCloud } from 'react-icons/tb';
import { useRef } from 'react';
import { trackClientEvent } from '@/lib/analytics-client';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';

const features = [
  {
    title: 'Tally-native, not a replacement',
    description:
      'NELA meets you where the books already are. Connect TallyPrime for live read-only ledgers, outstanding, sales, and cash — then ask in plain language. We never write vouchers or replace your accounting software.',
    icon: TbPlugConnected,
    color: 'var(--accent)',
    align: 'left',
    imageSrc: '/app-settings-connections.png',
    imageAlt: 'NELA Settings — Connections including Tally, Drive, and Gmail',
  },
  {
    title: 'Local-first privacy',
    description:
      'Private mode keeps chat and document inference on your machine. Your library is indexed locally. Switch to Cloud only when you choose — prompts and chat attachments then use NELA Cloud.',
    icon: TbShieldLock,
    color: 'var(--accent)',
    align: 'right',
    imageSrc: '/app-private-mode.png',
    imageAlt: 'NELA desktop in Private mode — runs on this device',
  },
  {
    title: 'Private or Cloud — you choose',
    description:
      'Text answers from Tally can stay on-device. Sign in for Cloud Fast / Smart / Deep when you want stronger reasoning, live dashboards, and Excel exports — with credits on Starter or Pro.',
    icon: TbCloud,
    color: 'var(--accent)',
    align: 'left',
    imageSrc: '/app-cloud-mode.png',
    imageAlt: 'NELA desktop in Cloud mode with Smart quality tier',
  },
];

export default function Features() {
  const seenFeatures = useRef(new Set<string>());

  return (
    <section className="relative py-32 px-6 z-10">
      <div className="max-w-6xl mx-auto space-y-32">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            onViewportEnter={() => {
              if (seenFeatures.current.has(feature.title)) return;
              seenFeatures.current.add(feature.title);

              trackClientEvent(ANALYTICS_EVENTS.FeatureInteraction, {
                source: 'home_features',
                feature: feature.title,
                action: 'impression',
              });
            }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`flex flex-col md:flex-row gap-12 items-center ${
              feature.align === 'right' ? 'md:flex-row-reverse' : ''
            }`}
          >
            <div className="flex-1 space-y-6">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl backdrop-blur-md border"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
              >
                <feature.icon className="w-8 h-8" style={{ color: feature.color }} />
              </div>
              <h2
                className="font-space text-4xl md:text-6xl font-bold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {feature.title}
              </h2>
              <p className="text-xl font-light leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {feature.description}
              </p>
            </div>

            <div className="flex-1 w-full">
              <div
                className="aspect-[16/10] md:aspect-[4/3] rounded-[2rem] border backdrop-blur-xl flex items-center justify-center p-3 md:p-4 relative overflow-hidden group"
                style={{
                  background: 'var(--feature-frame-bg)',
                  borderColor: 'var(--border-primary)',
                }}
              >
                <div className="relative w-full h-full rounded-[1.25rem] overflow-hidden border"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <Image
                    src={feature.imageSrc}
                    alt={feature.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain object-top bg-[var(--bg-secondary)]"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
