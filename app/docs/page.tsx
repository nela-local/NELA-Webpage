import styles from '../../components/DocsStyles.module.css';
import TrackedDocLink from '@/components/TrackedDocLink';

const quickStartLinks = [
  {
    href: '/docs/installation',
    title: 'Install & open a workspace',
    description: 'Download NELA, create a project, and send your first message.',
  },
  {
    href: '/docs/features/tally',
    title: 'Connect TallyPrime',
    description: 'Read-only books → plain-language cash, overdue, and sales answers.',
  },
  {
    href: '/docs/features/private-vs-cloud',
    title: 'Private or Cloud',
    description: 'Choose on-device models or optional NELA Cloud when you need it.',
  },
];

const topicSections = [
  {
    title: 'Essentials',
    cards: [
      {
        href: '/docs/what-is-it',
        title: 'Welcome',
        description: 'Private AI next to Tally — local-first desktop with optional Cloud.',
      },
      {
        href: '/docs/installation',
        title: 'Get started',
        description: 'Install, first workspace, and a simple checklist.',
      },
      {
        href: '/docs/features/tally',
        title: 'Tally connector',
        description: 'HTTP Server, read-only tools, Cloud dashboard and Excel.',
        featured: true,
      },
      {
        href: '/docs/features/private-vs-cloud',
        title: 'Private vs Cloud',
        description: 'When work stays on this device — and when it uses the internet.',
      },
    ],
  },
  {
    title: 'Your files & creation',
    cards: [
      {
        href: '/docs/features/file-indexer',
        title: 'File Indexer',
        description:
          'State-of-the-art folder search: keywords + meaning, structured for better answers.',
      },
      {
        href: '/docs/features/local-indexing',
        title: 'Document library',
        description: 'Add PDFs and docs, then ask questions with sources cited.',
      },
      {
        href: '/docs/features/artifacts',
        title: 'Create files',
        description: 'Presentations, spreadsheets, HTML, and Word from chat.',
      },
      {
        href: '/docs/features/modes',
        title: 'Modes',
        description: 'Chat, Vision, Audio, Podcast, and Mindmap — when to use each.',
      },
    ],
  },
  {
    title: 'Setup & help',
    cards: [
      {
        href: '/docs/models',
        title: 'Models & quality',
        description: 'Fast / Smart / Deep on device or in Cloud.',
      },
      {
        href: '/docs/features',
        title: 'Features overview',
        description: 'Map of everything NELA can do, with links into each guide.',
      },
      {
        href: '/docs/trouble-shooting',
        title: 'Fix problems',
        description: 'Indexing, downloads, and common “why isn’t this working?” tips.',
      },
      {
        href: '/docs/architecture',
        title: 'How it fits together',
        description: 'A light picture of Private, Cloud, and your files — no deep dive required.',
      },
    ],
  },
];

export default function DocsPage() {
  return (
    <section>
      <div className={styles.docsHero}>
        <p className={styles.docsHeroBadge}>NELA Documentation</p>
        <h1 className={styles.docsHeroHeading}>Docs</h1>
        <p className={styles.docsHeroBody}>
          Private AI next to Tally — local-first on your PC, with optional NELA Cloud for stronger
          answers, live dashboards, and Excel. Start with install, then connect TallyPrime.
        </p>

        <div className={styles.docsHeroQuickGrid}>
          {quickStartLinks.map((link) => (
            <TrackedDocLink
              key={link.href}
              href={link.href}
              source="docs_landing_quickstart"
              className={styles.docsHeroQuickLink}
            >
              <h2 className="text-base font-semibold mb-1">{link.title}</h2>
              <p className="text-sm">{link.description}</p>
            </TrackedDocLink>
          ))}
        </div>
      </div>

      {topicSections.map((section) => (
        <div key={section.title} className="mt-10">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">{section.title}</h2>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {section.cards.map((card) => (
              <TrackedDocLink
                key={card.href}
                href={card.href}
                source="docs_landing"
                className={`${styles.docsCard} p-5`}
              >
                {'featured' in card && card.featured ? (
                  <p
                    className="mb-2 text-[0.7rem] font-mono uppercase tracking-wider"
                    style={{ color: 'var(--accent)' }}
                  >
                    Flagship
                  </p>
                ) : null}
                <h2 className="text-xl font-semibold mb-1">{card.title}</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {card.description}
                </p>
              </TrackedDocLink>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
