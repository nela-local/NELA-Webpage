'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, User, X, Crown } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useAuth } from './AuthProvider';
import { trackClientEvent } from '@/lib/analytics-client';
import { ANALYTICS_EVENTS } from '@/lib/analytics-events';
import { isPremiumAccount } from '@/lib/premium';

const NAV_LINKS: ReadonlyArray<{
  href: string;
  label: string;
  id: string;
  cta?: boolean;
}> = [
  { href: '/', label: 'Home', id: 'home' },
  { href: '/docs', label: 'Docs', id: 'docs' },
  { href: '/faq', label: 'FAQ', id: 'faq' },
  { href: '/pricing', label: 'Pricing', id: 'pricing' },
  { href: '/try', label: 'Try Cloud', id: 'try' },
  { href: '/download', label: 'Download', id: 'download', cta: true },
];

function pathMatches(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavBar() {
  const { theme } = useTheme();
  const { user, isAuthenticated, isReady } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const hideForDashboard = Boolean(pathname?.startsWith('/dashboard'));

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  if (hideForDashboard) {
    return null;
  }

  const handleNavClick = (destination: string) => {
    trackClientEvent(ANALYTICS_EVENTS.NavClick, {
      source: 'navbar',
      destination,
    });
    setMenuOpen(false);
  };

  const profileHref = isAuthenticated ? '/account' : '/login';
  const profileLabel = isAuthenticated ? 'Profile' : 'Sign in';
  const profileActive =
    pathMatches(pathname, '/account') || pathMatches(pathname, '/login');
  const isPremium = isPremiumAccount({
    plan: user?.plan,
    displayPlan: user?.displayPlan,
    isPremium: user?.isPremium,
    entitlementStatus: user?.entitlementStatus,
  });

  const linkStyle = (opts: {
    cta?: boolean;
    active?: boolean;
  }): CSSProperties => {
    if (opts.cta) {
      return {
        background: 'var(--accent)',
        color: 'var(--bg-primary)',
        boxShadow: opts.active ? '0 0 0 2px var(--accent-glow)' : undefined,
        outline: opts.active ? '2px solid var(--text-primary)' : undefined,
        outlineOffset: opts.active ? '2px' : undefined,
      };
    }
    if (opts.active) {
      return {
        color: 'var(--accent)',
        background: 'var(--bg-card-hover)',
      };
    }
    return { color: 'var(--text-primary)' };
  };

  return (
    <>
      <header
        className="fixed z-50 flex items-center justify-between gap-3"
        style={{
          top: 'max(0.75rem, env(safe-area-inset-top))',
          left: 'max(0.75rem, env(safe-area-inset-left))',
          right: 'max(0.75rem, env(safe-area-inset-right))',
        }}
      >
        <Link
          href="/"
          className="shrink-0 rounded-full border p-2 backdrop-blur-md transition-transform duration-200 hover:scale-105"
          onClick={() => handleNavClick('home_logo')}
          style={{
            background: 'var(--bg-nav)',
            borderColor: pathMatches(pathname, '/')
              ? 'var(--accent)'
              : 'var(--border-primary)',
          }}
        >
          <Image
            src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
            alt="NELA"
            width={28}
            height={28}
            className="h-7 w-7 transition-opacity duration-300 sm:h-8 sm:w-8"
          />
        </Link>

        <nav
          className="hidden items-center gap-1 rounded-full border px-2 py-1.5 backdrop-blur-md md:flex lg:gap-2 lg:px-3"
          style={{
            background: 'var(--bg-nav)',
            borderColor: 'var(--border-primary)',
          }}
        >
          {NAV_LINKS.map((link) => {
            const active = pathMatches(pathname, link.href);
            return (
              <Link
                key={link.id}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-opacity duration-200 hover:opacity-90 lg:px-4 lg:text-base ${
                  link.cta ? 'shadow-sm' : ''
                }`}
                style={linkStyle({ cta: link.cta, active })}
                onClick={() => {
                  handleNavClick(link.id);
                  if (link.id === 'download') {
                    trackClientEvent(ANALYTICS_EVENTS.DownloadClick, {
                      source: 'navbar_cta',
                      destination: '/download',
                    });
                  }
                }}
                onMouseEnter={(e) => {
                  if (!link.cta && !active) {
                    e.currentTarget.style.color = 'var(--accent)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!link.cta) {
                    e.currentTarget.style.color = active
                      ? 'var(--accent)'
                      : 'var(--text-primary)';
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={profileHref}
            className="relative flex h-10 max-w-[10rem] items-center gap-2 rounded-full border px-2.5 backdrop-blur-md transition-transform duration-200 hover:scale-105 sm:h-11 sm:px-3"
            onClick={() => handleNavClick(isAuthenticated ? 'account' : 'login')}
            aria-current={profileActive ? 'page' : undefined}
            style={{
              background: 'var(--bg-nav)',
              borderColor: profileActive
                ? 'var(--accent)'
                : 'var(--border-primary)',
              color: profileActive ? 'var(--accent)' : 'var(--text-primary)',
            }}
            aria-label={
              isPremium ? `${profileLabel} · Premium` : profileLabel
            }
          >
            {isReady && user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{ background: 'var(--bg-card)' }}
              >
                <User
                  className="h-4 w-4"
                  style={{ color: 'var(--text-secondary)' }}
                />
              </span>
            )}
            <span className="hidden truncate text-sm font-medium sm:inline">
              {isReady && user?.name ? user.name.split(' ')[0] : profileLabel}
            </span>
            {isPremium ? (
              <Crown
                className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full p-0.5"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--bg-primary)',
                }}
                aria-hidden
              />
            ) : null}
          </Link>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md md:hidden sm:h-11 sm:w-11"
            style={{
              background: 'var(--bg-nav)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
            }}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0"
            style={{ background: 'var(--bg-overlay-heavy)' }}
            aria-label="Close menu overlay"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="absolute left-3 right-3 flex flex-col gap-1 rounded-2xl border p-3 backdrop-blur-md"
            style={{
              top: 'max(4.5rem, calc(env(safe-area-inset-top) + 3.75rem))',
              background: 'var(--bg-nav)',
              borderColor: 'var(--border-primary)',
            }}
          >
            {NAV_LINKS.map((link) => {
              const active = pathMatches(pathname, link.href);
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-xl px-4 py-3 text-base font-medium ${
                    link.cta ? 'text-center' : ''
                  }`}
                  style={linkStyle({ cta: link.cta, active })}
                  onClick={() => {
                    handleNavClick(link.id);
                    if (link.id === 'download') {
                      trackClientEvent(ANALYTICS_EVENTS.DownloadClick, {
                        source: 'navbar_mobile',
                        destination: '/download',
                      });
                    }
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href={profileHref}
              className="rounded-xl px-4 py-3 text-base font-medium"
              aria-current={profileActive ? 'page' : undefined}
              style={{
                color: profileActive ? 'var(--accent)' : 'var(--text-primary)',
                background: profileActive ? 'var(--bg-card-hover)' : undefined,
              }}
              onClick={() =>
                handleNavClick(isAuthenticated ? 'account' : 'login')
              }
            >
              {profileLabel}
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
