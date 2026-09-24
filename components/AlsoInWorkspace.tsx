'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import {
  FileSearch2,
  Presentation,
  Mail,
  HardDrive,
  MessageCircle,
  MousePointerClick,
} from 'lucide-react';

const extras = [
  {
    title: 'Documents & files',
    description: 'Local RAG over your library and File Indexer — grounded answers with citations.',
    icon: FileSearch2,
  },
  {
    title: 'Artifacts',
    description: 'On Cloud: presentations, spreadsheets, and HTML you can preview on device.',
    icon: Presentation,
  },
  {
    title: 'Gmail',
    description: 'Send and read with per-action approval — secrets stay in NELA Cloud OAuth.',
    icon: Mail,
  },
  {
    title: 'Google Drive',
    description: 'Sync into Search my files; search and summarize Docs/Sheets with approval.',
    icon: HardDrive,
  },
  {
    title: 'Telegram',
    description: 'Send and read messages you approve — phone session stays on your machine.',
    icon: MessageCircle,
  },
  {
    title: 'Computer Use',
    description: 'Optional: let NELA operate browser and desktop for concrete goals you approve.',
    icon: MousePointerClick,
  },
] as const;

export default function AlsoInWorkspace() {
  return (
    <section className="relative py-28 px-6 z-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-space text-4xl md:text-6xl font-bold tracking-tighter mb-5"
            style={{ color: 'var(--text-primary)' }}
          >
            Also in the workspace
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl max-w-2xl mx-auto font-light"
            style={{ color: 'var(--text-secondary)' }}
          >
            Beyond Tally — a full local-first desktop AI when you need docs, artifacts, or approved connectors.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mb-10 aspect-[16/9] max-w-4xl mx-auto rounded-2xl overflow-hidden border"
          style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-secondary)' }}
        >
          <Image
            src="/app-playground.png"
            alt="NELA Playground — agentic pipelines on device"
            fill
            sizes="(max-width: 1024px) 100vw, 896px"
            className="object-contain object-top"
          />
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {extras.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
              className="rounded-2xl border p-5 backdrop-blur-xl"
              style={{
                background: 'var(--bg-overlay)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <item.icon className="w-6 h-6 mb-3" style={{ color: 'var(--accent)' }} />
              <h3 className="font-space text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
