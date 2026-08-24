'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CreditCard, Laptop, LogOut, Tag, User } from 'lucide-react';
import styles from './DocsStyles.module.css';
import { useAuth } from '@/components/AuthProvider';

type NavItem = {
  href: string;
  label: string;
  icon: typeof User;
  match: 'exact' | 'prefix';
};

const NAV_ITEMS: NavItem[] = [
  { href: '/account', label: 'Account', icon: User, match: 'exact' },
  { href: '/account/pricing', label: 'Pricing', icon: Tag, match: 'prefix' },
  { href: '/account/billing', label: 'Billing', icon: CreditCard, match: 'prefix' },
  { href: '/account/link-device', label: 'Link desktop', icon: Laptop, match: 'prefix' },
];

export function isAccountNavActive(pathname: string, item: NavItem): boolean {
  if (item.match === 'exact') return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export default function AccountSidebar() {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <aside className={`hidden md:block w-64 lg:w-72 ${styles.docsSidebar}`}>
      <div className={`${styles.docsSidebarPanel} sticky top-24`}>
        <div className={styles.docsSidebarMeta}>
          <p className={styles.docsSidebarEyebrow}>Profile</p>
          <p className={styles.docsSidebarCaption}>
            Account, plan, billing, and desktop linking
          </p>
        </div>

        <nav className="bg-transparent" aria-label="Account">
          <ul className="space-y-1.5 text-sm">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isAccountNavActive(pathname, item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${styles.docsSidebarLink} ${
                      active ? styles.docsSidebarLinkActive : ''
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className={`${styles.docsSidebarLink} ${styles.docsSidebarLinkDanger}`}
              >
                <span className="inline-flex items-center gap-2">
                  <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                  Sign out
                </span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
}

export function AccountMobileNav() {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <div className="md:hidden mb-6">
      <p className={styles.docsMobileLabel}>Account</p>
      <div className={styles.docsMobileNav}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={styles.docsMobileNavLink}
            style={
              isAccountNavActive(pathname, item)
                ? { color: 'var(--accent)', borderColor: 'var(--accent)' }
                : undefined
            }
          >
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className={styles.docsMobileNavLink}
          style={{ color: '#e11d48', borderColor: 'rgba(225, 29, 72, 0.45)' }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
