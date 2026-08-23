"use client";

import Image from 'next/image';
import { motion } from 'motion/react';
import { TbShieldLock, TbBrain, TbCloud } from 'react-icons/tb';
import { useRef } from 'react';
import { trackClientEvent } from '@/lib/analytics-client';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';

const features = [
  {
    title: 'Local-first privacy',
    description:
      'Private mode keeps chat and document inference on your machine. Your library is indexed locally. Switch to Cloud only when you choose — prompts and chat attachments then use NELA Cloud.',
    icon: TbShieldLock,
    color: 'var(--accent)',
    align: 'left',
    imageKey: 'privacy',
  },
  {
    title: 'Open models, your way',
    description:
      'Load open-source GGUF models on-device, or use NELA Cloud Fast / Smart / Deep when you want hosted quality tiers without downloading a large local model.',
    icon: TbBrain,
    color: 'var(--accent)',
    align: 'right',
    imageKey: 'uncensored',
  },
  {
    title: 'Private or Cloud — you choose',
    description:
      'Work offline-capable in Private mode after models are installed. Sign in for optional NELA Cloud when you need internet-backed tiers, credits, and richer artifact generation.',
    icon: TbCloud,
    color: 'var(--accent)',
    align: 'left',
    imageKey: 'offline',
  },
];

export default function Features() {
  const seenFeatures = useRef(new Set<string>());

  return (
    <section className="relative py-32 px-6 z-10">
      <div className="max-w-6xl mx-auto space-y-32">
        {features.map((feature, index) => (
          <motion.div
            key={index}
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
            {/* Text Content */}
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl backdrop-blur-md border"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
              >
                <feature.icon className="w-8 h-8" style={{ color: feature.color }} />
              </div>
              <h2 className="font-space text-4xl md:text-6xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {feature.title}
              </h2>
              <p className="text-xl font-light leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {feature.description}
              </p>
            </div>

            {/* Illustrative Placeholder */}
            <div className="flex-1 w-full">
              <div className="aspect-square md:aspect-[4/3] rounded-[3rem] border backdrop-blur-xl flex items-center justify-center p-8 relative overflow-hidden group"
                style={{
                  background: 'var(--feature-frame-bg)',
                  borderColor: 'var(--border-primary)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-20 transition-opacity duration-500 group-hover:opacity-40" />

                {feature.imageKey === 'privacy' ? (
                  <div className="relative w-full h-full rounded-[2rem] overflow-hidden">
                    <Image
                      src="/data_privacy.png"
                      alt="Data privacy"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ) : feature.imageKey === 'uncensored' ? (
                  <div className="relative w-full h-full rounded-[2rem] overflow-hidden">
                    <Image
                      src="/uncensored_int.png"
                      alt="Open models"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ) : feature.imageKey === 'offline' ? (
                  <div className="relative w-full h-full rounded-[2rem] overflow-hidden">
                    <Image
                      src="/offline.png"
                      alt="Private or Cloud"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  // Dorky UI Element Placeholder
                  <div className="w-full h-full border rounded-[2rem] flex flex-col p-6 relative z-10"
                    style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-overlay)' }}
                  >
                    <div className="flex gap-2 mb-6">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                      <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                    <div className="flex-1 font-mono text-sm space-y-2" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                      <p>{'>'} Initializing {feature.title.toLowerCase().replace(' ', '_')} module...</p>
                      <p>{'>'} Status: ONLINE</p>
                      <p className="animate-pulse">{'>'} _</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
