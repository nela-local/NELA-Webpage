import type { ReactNode } from 'react';
import AccountSidebar, { AccountMobileNav } from '../../components/AccountSidebar';
import styles from '../../components/DocsStyles.module.css';

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.docsShell}>
      <div
        className="mx-auto max-w-7xl px-4 py-10 pt-24 sm:px-6 md:py-14 md:pt-28"
        style={{ color: 'var(--text-primary)' }}
      >
        <AccountMobileNav />

        <div className="flex gap-8 lg:gap-10">
          <AccountSidebar />
          <div className={`flex-1 min-w-0 ${styles.docsPageSurface}`}>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
