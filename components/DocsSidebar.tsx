'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './DocsStyles.module.css';
import { trackClientEvent } from '@/lib/analytics-client';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';

type NavItem = { href: string; label: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Start',
    items: [
      { href: '/docs/what-is-it', label: 'Welcome' },
      { href: '/docs/installation', label: 'Get started' },
      { href: '/docs/features/private-vs-cloud', label: 'Private vs Cloud' },
    ],
  },
  {
    label: 'Your work',
    items: [
      { href: '/docs/features/file-indexer', label: 'File Indexer' },
      { href: '/docs/features/local-indexing', label: 'Document library' },
      { href: '/docs/features/artifacts', label: 'Create files' },
      { href: '/docs/features/modes', label: 'Modes' },
    ],
  },
  {
    label: 'Setup',
    items: [
      { href: '/docs/models', label: 'Models & quality' },
      { href: '/docs/features', label: 'Features overview' },
      { href: '/docs/trouble-shooting', label: 'Fix problems' },
    ],
  },
  {
    label: 'More',
    items: [
      { href: '/docs/architecture', label: 'How it fits together' },
      { href: '/docs/history', label: 'History' },
    ],
  },
];

export default function DocsSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const trackDocsNav = (target: string) => {
    trackClientEvent(ANALYTICS_EVENTS.DocsNavigationClick, {
      source: 'docs_sidebar',
      target,
    });
  };

  return (
    <aside className={`hidden md:block w-64 lg:w-72 ${styles.docsSidebar}`}>
      <div className={`${styles.docsSidebarPanel} sticky top-24`}>
        <div className={styles.docsSidebarMeta}>
          <p className={styles.docsSidebarEyebrow}>NELA Docs</p>
          <p className={styles.docsSidebarCaption}>
            Local-first workspace, optional Cloud — practical guides
          </p>
        </div>

        <nav className="bg-transparent">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <p className={styles.docsSidebarEyebrow} style={{ marginBottom: '0.45rem' }}>
                {group.label}
              </p>
              <ul className="space-y-1.5 text-sm">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => trackDocsNav(item.href)}
                      className={`${styles.docsSidebarLink} ${
                        isActive(item.href) ? styles.docsSidebarLinkActive : ''
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
