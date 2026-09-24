'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Wallet,
  UserRoundSearch,
  TrendingUp,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';
import { useRef } from 'react';
import { trackClientEvent } from '@/lib/analytics-client';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';

const jobs = [
  {
    id: 'cash_bank',
    title: 'How much cash today?',
    summary:
      'Ask in plain language — NELA reads cash and bank ledgers from TallyPrime and answers without you digging through reports.',
    icon: Wallet,
    outcome: 'Cash & bank clarity',
  },
  {
    id: 'outstanding',
    title: 'Who owes me?',
    summary:
      'Surface debtors and creditors outstanding so you know who to follow up — without waiting on WhatsApp or the CA.',
    icon: UserRoundSearch,
    outcome: 'Overdue & receivables',
  },
  {
    id: 'sales',
    title: 'What did we sell?',
    summary:
      'Week or month sales in words you understand — not a maze of Tally screens — so you know if the business is theek hai.',
    icon: TrendingUp,
    outcome: 'Sales at a glance',
  },
  {
    id: 'ca_excel',
    title: 'Give my CA a clean Excel',
    summary:
      'With Cloud, export a tidy spreadsheet summary your accountant can use — less manual pack prep, same books in Tally.',
    icon: FileSpreadsheet,
    outcome: 'CA-ready export',
  },
] as const;

export default function OwnerJobs() {
  const seenCards = useRef(new Set<string>());

  return (
    <section className="relative py-28 px-6 z-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-space text-5xl md:text-7xl font-bold tracking-tighter mb-5"
            style={{ color: 'var(--text-primary)' }}
          >
            The questions owners ask every day
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-lg md:text-xl max-w-3xl mx-auto font-light"
            style={{ color: 'var(--text-secondary)' }}
          >
            NELA does not replace Tally. It turns live books into answers — so you stop relying only on staff, WhatsApp, or the CA for kitna cash / kaun overdue.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
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
              Desktop · Tally connected
            </span>
            <h3 className="font-space text-3xl md:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Ask your books — get plain answers
            </h3>
            <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Connect TallyPrime over its local HTTP Server. NELA reads ledgers and reports only — it never writes vouchers.
            </p>
            <Link
              href="/download"
              onClick={() => {
                trackClientEvent(ANALYTICS_EVENTS.DownloadClick, {
                  source: 'home_owner_jobs_preview',
                  action: 'open_download',
                });
              }}
              className="inline-flex items-center gap-2 w-fit px-5 py-3 rounded-full font-semibold transition-transform hover:scale-105"
              style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
            >
              Download and connect Tally
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div
            className="relative aspect-[16/10] rounded-2xl overflow-hidden border"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-secondary)' }}
          >
            <Image
              src="/app-cloud-mode.png"
              alt="NELA Settings — connect TallyPrime and other services read-only"
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-contain object-top"
              priority
            />
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6">
          {jobs.map((job, index) => (
            <motion.article
              key={job.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-70px' }}
              onViewportEnter={() => {
                if (seenCards.current.has(job.id)) return;
                seenCards.current.add(job.id);

                trackClientEvent(ANALYTICS_EVENTS.FeatureInteraction, {
                  source: 'home_owner_jobs',
                  feature: job.id,
                  action: 'impression',
                });
              }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="rounded-3xl border p-6 md:p-7 flex flex-col backdrop-blur-xl"
              style={{
                background: 'var(--bg-overlay)',
                borderColor: 'var(--border-primary)',
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0"
                  style={{
                    borderColor: 'var(--accent)',
                    background: 'var(--bg-overlay)',
                  }}
                >
                  <job.icon className="w-6 h-6" style={{ color: 'var(--accent)' }} />
                </div>
                <h3 className="font-space text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {job.title}
                </h3>
              </div>

              <p className="leading-relaxed mb-5 flex-1" style={{ color: 'var(--text-secondary)' }}>
                {job.summary}
              </p>

              <span
                className="px-3 py-1 rounded-full text-xs font-mono border w-fit"
                style={{
                  color: 'var(--text-tertiary)',
                  borderColor: 'var(--border-subtle)',
                  background: 'var(--bg-overlay)',
                }}
              >
                {job.outcome}
              </span>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
