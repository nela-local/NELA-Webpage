'use client';

import { motion } from 'motion/react';
import {
  TbDownload,
  TbPlugConnected,
  TbMessageChatbot,
  TbArrowBadgeRightFilled,
} from 'react-icons/tb';
import { useRef } from 'react';
import { trackClientEvent } from '@/lib/analytics-client';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';

const steps = [
  {
    step: '01',
    title: 'Install NELA',
    description:
      'Download the desktop app for Windows. Use Private mode on-device for free, or sign in later for optional NELA Cloud.',
    icon: TbDownload,
    tags: ['Desktop app', 'Private free', 'Optional Cloud'],
  },
  {
    step: '02',
    title: 'Connect TallyPrime',
    description:
      'Enable HTTP Server in TallyPrime (usually 127.0.0.1:9000) with your company open. NELA connects read-only — it never writes vouchers.',
    icon: TbPlugConnected,
    tags: ['HTTP Server', 'Read-only', 'Local books'],
  },
  {
    step: '03',
    title: 'Ask · dashboard · Excel',
    description:
      'Ask cash, overdue, and sales in plain language. On Cloud, open a live HTML dashboard or export Excel for your CA.',
    icon: TbMessageChatbot,
    tags: ['Plain answers', 'Live dashboard', 'Excel export'],
  },
];

export default function HowItWorks() {
  const seenSteps = useRef(new Set<string>());

  return (
    <section
      className="relative py-32 px-6 z-10 backdrop-blur-3xl border-y-2"
      style={{
        background: 'var(--bg-overlay)',
        borderColor: 'var(--accent)',
        boxShadow: '0 0 30px var(--accent-glow)',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-space text-5xl md:text-7xl font-bold tracking-tighter mb-6"
            style={{ color: 'var(--text-primary)' }}
          >
            From install to first money answer
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl max-w-2xl mx-auto font-light"
            style={{ color: 'var(--text-secondary)' }}
          >
            Three steps. Your books stay in Tally — NELA sits next to them.
          </motion.p>
        </div>

        <div className="hidden md:flex items-stretch gap-0">
          {steps.map((item, index) => (
            <div key={item.step} className="flex items-stretch flex-1">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                onViewportEnter={() => {
                  if (seenSteps.current.has(item.step)) return;
                  seenSteps.current.add(item.step);

                  trackClientEvent(ANALYTICS_EVENTS.FeatureInteraction, {
                    source: 'home_how_it_works',
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

        <div className="flex md:hidden flex-col items-stretch gap-0">
          {steps.map((item, index) => (
            <div key={item.step} className="flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                onViewportEnter={() => {
                  if (seenSteps.current.has(`mobile-${item.step}`)) return;
                  seenSteps.current.add(`mobile-${item.step}`);

                  trackClientEvent(ANALYTICS_EVENTS.FeatureInteraction, {
                    source: 'home_how_it_works_mobile',
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
