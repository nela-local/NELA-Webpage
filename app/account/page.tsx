'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Crown, Save } from 'lucide-react';
import { apiFetch } from '@/lib/nela-api';
import { useAuth } from '@/components/AuthProvider';
import type { EntitlementResponse, UserProfileDto } from '@/lib/api-types';
import { isPremiumAccount } from '@/lib/premium';
import { friendlyErrorFromUnknown } from '@/lib/friendlyError';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isReady, setSession } = useAuth();
  const [profile, setProfile] = useState<UserProfileDto | null>(user);
  const [entitlement, setEntitlement] = useState<EntitlementResponse | null>(
    null,
  );
  const [name, setName] = useState(user?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const [me, ent] = await Promise.all([
          apiFetch<UserProfileDto>('/v1/me'),
          apiFetch<EntitlementResponse>('/v1/me/entitlement'),
        ]);
        if (cancelled) return;
        setProfile(me);
        setName(me.name);
        setEntitlement(ent);
      } catch (err) {
        if (!cancelled) {
          setError(friendlyErrorFromUnknown(err));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isReady, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setProfile(user);
      setName(user.name);
    }
  }, [user]);

  const isPremium = isPremiumAccount({
    plan: profile?.plan ?? entitlement?.plan,
    displayPlan: entitlement?.displayPlan ?? profile?.displayPlan,
    isPremium: entitlement?.isPremium ?? profile?.isPremium,
    paidCloud: entitlement?.paidCloud,
    entitlementStatus: profile?.entitlementStatus,
    status: entitlement?.status,
  });
  const planTitle = isPremium ? 'Premium' : 'Free';

  const monthlyGrant = entitlement?.credits?.monthlyGrant ?? 0;
  const balance = entitlement?.credits?.balance ?? 0;
  const packCredits = entitlement?.credits?.packCredits ?? 0;
  const showMonthlyQuota = monthlyGrant > 0;
  // Subscription grant burns first; packs roll over separately.
  const subscriptionRemaining = Math.max(0, balance - packCredits);
  const usedCredits = showMonthlyQuota
    ? Math.min(monthlyGrant, Math.max(0, monthlyGrant - subscriptionRemaining))
    : 0;
  const monthlyPct = showMonthlyQuota
    ? Math.min(100, Math.round((usedCredits / monthlyGrant) * 100))
    : 0;
  const fastLimit = entitlement?.fastFree.limit ?? 0;
  const fastUsed = entitlement?.fastFree.used ?? 0;
  const fastPct =
    !showMonthlyQuota && fastLimit > 0
      ? Math.min(100, Math.round((fastUsed / fastLimit) * 100))
      : 0;
  const quotaPct = showMonthlyQuota ? monthlyPct : fastPct;
  const quotaLabel = showMonthlyQuota
    ? `${usedCredits} of ${monthlyGrant} credits used this month`
    : `Fast free: ${fastUsed} / ${fastLimit} in the last ${
        entitlement?.fastFree.windowHours ?? 6
      }h`;

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await apiFetch<UserProfileDto>('/v1/me', {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
      setProfile(updated);
      const accessToken = window.localStorage.getItem('nela_access_token');
      const refreshToken = window.localStorage.getItem('nela_refresh_token');
      if (accessToken && refreshToken) {
        setSession({ accessToken, refreshToken, profile: updated });
      }
      setNotice('Profile saved');
      setTimeout(() => setNotice(null), 2000);
    } catch (err) {
      setError(friendlyErrorFromUnknown(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
        <h1 className="mb-2 font-space text-3xl font-bold tracking-tight sm:text-4xl">
          Account
        </h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          Manage your NELA Cloud profile, plan, and quota.
        </p>

        {error ? (
          <p className="mb-4" style={{ color: '#e11d48' }}>
            {error}{' '}
            <Link href="/login" style={{ color: 'var(--accent)' }}>
              Sign in again
            </Link>
          </p>
        ) : null}

        {profile ? (
          <>
            <div
              className="mb-6 flex items-start gap-3 rounded-2xl border p-4"
              style={{
                borderColor: 'var(--border-primary)',
                background: isPremium ? 'var(--accent-glow)' : 'var(--bg-card)',
              }}
            >
              <Crown className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} />
              <div>
                <p className="font-semibold">{planTitle}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {isPremium
                    ? 'Smart and Deep are unlocked in Cloud.'
                    : 'Local & Cloud included. Upgrade for Smart and Deep on Cloud.'}
                </p>
              </div>
            </div>

            <div
              className="mb-6 rounded-2xl border p-6"
              style={{
                borderColor: 'var(--border-primary)',
                background: 'var(--bg-card)',
              }}
            >
              <div className="mb-6 flex items-center gap-4">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    {profile.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold">{profile.name}</p>
                  <p style={{ color: 'var(--text-secondary)' }}>{profile.email}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Signed in with {profile.authProvider === 'google' ? 'Google' : 'email'}
                    {' · '}
                    Status: {profile.entitlementStatus}
                  </p>
                </div>
              </div>

              <form onSubmit={(e) => void handleSave(e)} className="space-y-3">
                <label className="block text-sm">
                  <span className="mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    Display name
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border px-4 py-3 outline-none"
                    style={{
                      borderColor: 'var(--border-primary)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                    autoComplete="name"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    Email
                  </span>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full rounded-xl border px-4 py-3 opacity-70"
                    style={{
                      borderColor: 'var(--border-primary)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </label>
                {notice ? (
                  <p className="text-sm" style={{ color: 'var(--accent)' }}>
                    {notice}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={saving || !name.trim() || name === profile.name}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2 font-medium disabled:opacity-50"
                  style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>Loading profile…</p>
        )}

        {entitlement ? (
          <div
            className="mb-6 rounded-2xl border p-6"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-card)',
            }}
          >
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="font-semibold">
                {showMonthlyQuota ? 'Monthly quota' : 'Usage quota'}
              </h2>
              <span className="text-sm tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                {quotaPct}%
              </span>
            </div>

            {(!entitlement.credits || entitlement.credits.balance <= 0) &&
            !entitlement.paidCloud ? (
              <div
                className="mb-4 rounded-xl border px-4 py-3 text-sm"
                style={{
                  borderColor: 'var(--accent)',
                  background: 'var(--accent-glow)',
                }}
              >
                <p className="mb-2 font-medium">
                  Credit balance is empty — Smart and Deep Cloud are locked.
                </p>
                <Link
                  href="/account/billing"
                  className="font-semibold underline"
                  style={{ color: 'var(--accent)' }}
                >
                  Buy credits or upgrade
                </Link>
              </div>
            ) : null}

            <div
              className="mb-2 h-2.5 w-full overflow-hidden rounded-full"
              style={{ background: 'var(--bg-secondary)' }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={quotaPct}
              aria-label={quotaLabel}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${quotaPct}%`,
                  background: 'var(--accent)',
                }}
              />
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {quotaLabel}
            </p>
            {showMonthlyQuota && balance > 0 ? (
              <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {balance} credits remaining
                {packCredits > 0 ? ` (${packCredits} from packs)` : ''}
              </p>
            ) : null}
          </div>
        ) : null}
    </div>
  );
}
