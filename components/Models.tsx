'use client';

import { motion } from 'motion/react';
import { TbDownload, TbFileUpload, TbMessageChatbot, TbArrowBadgeRightFilled } from 'react-icons/tb';
import { useRef } from 'react';
import { trackClientEvent } from '@/lib/analytics-client';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';

const steps = [
  {
    step: '01',
    title: 'Install NELA',
    description:
      'Download the desktop app and load local GGUF models — or sign in later for optional NELA Cloud Fast / Smart / Deep.',
    icon: TbDownload,
    tags: ['Download NELA', 'Local GGUF', 'Optional Cloud'],
  },
  {
    step: '02',
    title: 'Add your data',
    description:
      'Feed in PDFs, PowerPoints, Word docs, audio, and more. The document library indexes on this device; Cloud chat attachments are disclosed when you send them.',
    icon: TbFileUpload,
    tags: ['PDFs', 'PPTs', 'Docs', 'Audio', 'Any Format'],
  },
  {
    step: '03',
    title: 'Get intelligent responses',
    description:
      'Chat, mindmaps, podcasts, and artifacts — powered by your local models in Private mode, or NELA Cloud when you switch.',
    icon: TbMessageChatbot,
    tags: ['Interactive Chats', 'Mindmaps', 'Cloud tiers'],
  },
];

export default function Models() {
  const seenSteps = useRef(new Set<string>());

  return (
    <section className="relative py-32 px-6 z-10 backdrop-blur-3xl border-y-2"
      style={{ 
        background: 'var(--bg-overlay)', 
        borderColor: 'var(--accent)',
        boxShadow: '0 0 30px var(--accent-glow)'
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-space text-5xl md:text-7xl font-bold tracking-tighter mb-6"
          >
            Local models &amp; NELA Cloud
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl max-w-2xl mx-auto font-light"
            style={{ color: 'var(--text-secondary)' }}
          >
            Three simple steps to a local-first workspace — with optional Cloud when you need it.
          </motion.p>
        </div>

        {/* Desktop: horizontal flow with arrows */}
        <div className="hidden md:flex items-stretch gap-0">
          {steps.map((item, index) => (
            <div key={index} className="flex items-stretch flex-1">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                onViewportEnter={() => {
                  if (seenSteps.current.has(item.step)) return;
                  seenSteps.current.add(item.step);

                  trackClientEvent(ANALYTICS_EVENTS.FeatureInteraction, {
                    source: 'home_models_flow',
                    feature: item.title,
                    step: item.step,
                    action: 'impression',
                  });
                }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative flex-1 p-8 rounded-[2.5rem] border overflow-hidden flex flex-col"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--accent)' }}
              >
                {/* Large background icon */}
                <div className="absolute top-4 right-4 opacity-[0.05]">
                  <item.icon className="w-36 h-36" />
                </div>

                <div className="relative z-10 flex flex-col flex-1">
                  <span
                    className="font-mono text-sm font-bold tracking-widest mb-6"
                    style={{ color: 'var(--accent)' }}
                  >
                    STEP {item.step}
                  </span>

                  <h3 className="font-space text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                    {item.title}
                  </h3>
                  <p className="leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                    {item.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-auto">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-xs font-mono border"
                        style={{
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-tertiary)',
                          background: 'var(--bg-overlay)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>

              {index < steps.length - 1 && (
                <div className="flex items-center px-3">
                  <TbArrowBadgeRightFilled className="w-8 h-8" style={{ color: 'var(--accent)' }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: vertical flow with arrows */}
        <div className="flex md:hidden flex-col items-stretch gap-0">
          {steps.map((item, index) => (
            <div key={index} className="flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                onViewportEnter={() => {
                  if (seenSteps.current.has(`mobile-${item.step}`)) return;
                  seenSteps.current.add(`mobile-${item.step}`);

                  trackClientEvent(ANALYTICS_EVENTS.FeatureInteraction, {
                    source: 'home_models_flow_mobile',
                    feature: item.title,
                    step: item.step,
                    action: 'impression',
                  });
                }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative w-full p-8 rounded-[2.5rem] border overflow-hidden flex flex-col"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--accent)' }}
              >
                <div className="absolute top-4 right-4 opacity-[0.05]">
                  <item.icon className="w-36 h-36" />
                </div>

                <div className="relative z-10 flex flex-col">
                  <span
                    className="font-mono text-sm font-bold tracking-widest mb-6"
                    style={{ color: 'var(--accent)' }}
                  >
                    STEP {item.step}
                  </span>

                  <h3 className="font-space text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                    {item.title}
                  </h3>
                  <p className="leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                    {item.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-auto">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-xs font-mono border"
                        style={{
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-tertiary)',
                          background: 'var(--bg-overlay)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>

              {index < steps.length - 1 && (
                <div className="flex items-center justify-center py-3 rotate-90">
                  <TbArrowBadgeRightFilled className="w-8 h-8" style={{ color: 'var(--accent)' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
