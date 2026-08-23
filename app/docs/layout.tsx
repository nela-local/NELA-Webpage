import type { ReactNode } from 'react';
import Link from 'next/link';
import DocsSidebar from '../../components/DocsSidebar';
import styles from '../../components/DocsStyles.module.css';

const mobileQuickLinks = [
  { href: '/docs/what-is-it', label: 'Welcome' },
  { href: '/docs/installation', label: 'Get started' },
  { href: '/docs/features/file-indexer', label: 'File Indexer' },
  { href: '/docs/features/private-vs-cloud', label: 'Private / Cloud' },
  { href: '/docs/features/artifacts', label: 'Create files' },
  { href: '/docs/trouble-shooting', label: 'Fix problems' },
];

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.docsShell}>
      <div
        className="mx-auto max-w-7xl px-4 py-10 pt-24 sm:px-6 md:py-14 md:pt-28"
        style={{ color: 'var(--text-primary)' }}
      >
        <div className="md:hidden mb-6">
          <p className={styles.docsMobileLabel}>Quick Jump</p>
          <div className={styles.docsMobileNav}>
            {mobileQuickLinks.map((item) => (
              <Link key={item.href} href={item.href} className={styles.docsMobileNavLink}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex gap-8 lg:gap-10">
          <DocsSidebar />
          <div className={`flex-1 min-w-0 ${styles.docsPageSurface}`}>
            <div className={styles.docsContent}>{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
