'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Mic2, FileSearch2, ArrowRight } from 'lucide-react';
import { useRef } from 'react';
import { trackClientEvent } from '@/lib/analytics-client';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';

const workflows = [
  {
    id: 'podcast_generation',
    title: 'Podcast Generation Workflow',
    summary:
      'Turn rough notes, long research docs, or meeting transcripts into polished multi-speaker podcast episodes — indexed and synthesized in Private mode on your machine.',
    icon: Mic2,
    outcomes: ['Structured script', 'Multi-speaker audio', 'Export-ready episode'],
    steps: [
      'Upload notes, PDFs, links, or transcripts into NELA.',
      'Generate a draft script with speaker roles and segment flow.',
      'Refine tone, duration, and speaking style for each segment.',
      'Render local text-to-speech output and export your final episode.',
    ],
  },
  {
    id: 'document_intelligence',
    title: 'Document Intelligence Workflow',
    summary:
      'Build a private knowledge layer from your files so teams can ask precise questions, compare documents, and extract actionable answers instantly.',
    icon: FileSearch2,
    outcomes: ['Context-grounded Q&A', 'Fast summaries', 'Actionable insights'],
    steps: [
      'Drop in PDFs, slides, docs, and reference material.',
      'Let NELA index and embed your content locally for retrieval.',
      'Ask natural-language questions and get grounded responses.',
      'Create summaries, decisions, and next-step outputs from your sources.',
    ],
  },
] as const;

export default function UseCases() {
  const seenCards = useRef(new Set<string>());

  return (
    <section className="relative py-28 px-6 z-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 1, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-space text-5xl md:text-7xl font-bold tracking-tighter mb-5"
            style={{ color: 'var(--text-primary)' }}
          >
            What can NELA do for you?
          </motion.h2>
          <motion.p
            initial={{ opacity: 1, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-lg md:text-xl max-w-3xl mx-auto font-light"
            style={{ color: 'var(--text-secondary)' }}
          >
            Explore high-impact workflows — local-first by default, with optional NELA Cloud when you want hosted tiers.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 1, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="grid lg:grid-cols-[1fr_1.2fr] gap-6 rounded-[2rem] border p-6 md:p-8 mb-10 backdrop-blur-xl"
          style={{
            background: 'var(--bg-overlay)',
            borderColor: 'var(--border-primary)',
            boxShadow: '0 0 24px var(--accent-glow)',
          }}
        >
          <div className="space-y-4 flex flex-col justify-center">
            <span
              className="inline-flex items-center w-fit px-3 py-1 rounded-full text-xs font-mono tracking-wider border"
              style={{
                color: 'var(--accent)',
                borderColor: 'var(--accent)',
                background: 'var(--bg-overlay)',
              }}
            >
              Real Interface Preview
            </span>
            <h3 className="font-space text-3xl md:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              See how the workflow looks in NELA
            </h3>
            <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              This is the actual desktop interface users work with while generating podcasts and running document intelligence tasks.
            </p>
            <Link
              href="/download"
              onClick={() => {
                trackClientEvent(ANALYTICS_EVENTS.DownloadClick, {
                  source: 'home_use_cases_preview',
                  action: 'open_download',
                });
              }}
              className="inline-flex items-center gap-2 w-fit px-5 py-3 rounded-full font-semibold transition-transform hover:scale-105"
              style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
            >
              Download and Try It
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <Image
              src="/nela_homepage.png"
              alt="NELA desktop interface preview"
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover"
            />
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {workflows.map((workflow, index) => (
            <motion.article
              key={workflow.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-70px' }}
              onViewportEnter={() => {
                if (seenCards.current.has(workflow.id)) return;
                seenCards.current.add(workflow.id);

                trackClientEvent(ANALYTICS_EVENTS.FeatureInteraction, {
                  source: 'home_use_cases',
                  feature: workflow.id,
                  action: 'impression',
                });
              }}
              transition={{ duration: 0.6, delay: index * 0.12 }}
              className="rounded-3xl border p-6 md:p-7 flex flex-col backdrop-blur-xl"
              style={{
                background: 'var(--bg-overlay)',
                borderColor: 'var(--border-primary)',
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl border flex items-center justify-center"
                  style={{
                    borderColor: 'var(--accent)',
                    background: 'var(--bg-overlay)',
                  }}
                >
                  <workflow.icon className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                </div>
                <h3 className="font-space text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {workflow.title}
                </h3>
              </div>

              <p className="leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
                {workflow.summary}
              </p>

              <div className="flex flex-wrap gap-2 mb-5">
                {workflow.outcomes.map((outcome) => (
                  <span
                    key={outcome}
                    className="px-3 py-1 rounded-full text-xs font-mono border"
                    style={{
                      color: 'var(--text-tertiary)',
                      borderColor: 'var(--border-subtle)',
                      background: 'var(--bg-overlay)',
                    }}
                  >
                    {outcome}
                  </span>
                ))}
              </div>

              <ol className="space-y-3 mb-7">
                {workflow.steps.map((step, stepIndex) => (
                  <li key={step} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono"
                      style={{
                        background: 'var(--accent)',
                        color: 'var(--bg-primary)',
                      }}
                    >
                      {stepIndex + 1}
                    </span>
                    <span className="text-sm md:text-base" style={{ color: 'var(--text-secondary)' }}>
                      {step}
                    </span>
                  </li>
                ))}
              </ol>

              <Link
                href="/download"
                onClick={() => {
                  trackClientEvent(ANALYTICS_EVENTS.DownloadClick, {
                    source: 'home_use_cases_workflow',
                    workflow: workflow.id,
                  });
                }}
                className="inline-flex items-center gap-2 mt-auto font-semibold"
                style={{ color: 'var(--accent)' }}
              >
                Start this workflow
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
