'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Crown, X } from 'lucide-react';
import { apiFetch, getAccessToken, getApiBaseUrl } from '@/lib/nela-api';
import { friendlyErrorFromUnknown } from '@/lib/friendlyError';
import { evaluatePlanCheckout, type PaidPlan } from '@/lib/planCheckout';
import { openStandardCheckout } from '@/lib/razorpayCheckout';
import type {
  BillingPricesResponse,
  BillingTransactionsResponse,
  BillingTransactionDto,
  CancelSubscriptionResponse,
  CheckoutResponse,
  ConfirmCheckoutResponse,
  CreditPackId,
  EntitlementResponse,
  RestoreSubscriptionResponse,
  SubscriptionBillingStatusResponse,
} from '@/lib/api-types';

function q(params: URLSearchParams, key: string): string | undefined {
  const v = params.get(key);
  return v && v.trim() ? v.trim() : undefined;
}

function planDisplayName(plan: string | null | undefined): string {
  if (plan === 'pro') return 'Pro';
  if (plan === 'starter') return 'Starter';
  return 'Free';
}

function formatAccessUntil(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return null;
  }
}

export default function BillingClient() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [prices, setPrices] = useState<BillingPricesResponse | null>(null);
  const [entitlement, setEntitlement] = useState<EntitlementResponse | null>(
    null,
  );
  const [subStatus, setSubStatus] = useState<
    SubscriptionBillingStatusResponse['subscription']
  >(null);
  const [transactions, setTransactions] = useState<BillingTransactionDto[]>(
    [],
  );
  const [entitlementReady, setEntitlementReady] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const autoStarted = useRef(false);
  const confirmStarted = useRef(false);
  const cancelDialogRef = useRef<HTMLDivElement | null>(null);
  const restoreDialogRef = useRef<HTMLDivElement | null>(null);

  const refreshSubscription = async () => {
    try {
      const res = await apiFetch<SubscriptionBillingStatusResponse>(
        '/v1/billing/subscription',
      );
      setSubStatus(res.subscription);
    } catch {
      setSubStatus(null);
    }
  };

  const refreshTransactions = async () => {
    try {
      const res = await apiFetch<BillingTransactionsResponse>(
        '/v1/billing/transactions',
      );
      setTransactions(res.transactions);
    } catch {
      setTransactions([]);
    }
  };

  const refreshEntitlement = async () => {
    const ent = await apiFetch<EntitlementResponse>('/v1/me/entitlement');
    setEntitlement(ent);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/v1/billing/prices`);
        if (!res.ok) return;
        const data = (await res.json()) as BillingPricesResponse;
        if (!cancelled) setPrices(data);
      } catch {
        /* keep null */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!getAccessToken()) {
        if (!cancelled) {
          setEntitlement(null);
          setEntitlementReady(true);
        }
        return;
      }
      try {
        const ent = await apiFetch<EntitlementResponse>('/v1/me/entitlement');
        if (!cancelled) setEntitlement(ent);
        if (!cancelled) {
          await Promise.all([refreshSubscription(), refreshTransactions()]);
        }
      } catch {
        if (!cancelled) setEntitlement(null);
      } finally {
        if (!cancelled) setEntitlementReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!cancelModalOpen && !restoreModalOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        setCancelModalOpen(false);
        setRestoreModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (cancelModalOpen) {
      cancelDialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    }
    if (restoreModalOpen) {
      restoreDialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    }
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [cancelModalOpen, restoreModalOpen, busy]);

  const ensureAuth = (nextPath?: string) => {
    if (!getAccessToken()) {
      const next = nextPath ?? '/account/billing';
      window.location.href = `/login?next=${encodeURIComponent(next)}`;
      return false;
    }
    return true;
  };

  const runCheckout = async (
    body: { type: 'subscription'; plan: PaidPlan } | { type: 'credits'; packId: CreditPackId },
  ) => {
    const res = await apiFetch<CheckoutResponse>(
      '/v1/billing/razorpay/checkout',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );

    if (res.mode === 'redirect') {
      if (!res.checkoutUrl) throw new Error('No Razorpay checkout URL returned');
      window.location.href = res.checkoutUrl;
      return;
    }

    const paid = await openStandardCheckout(res);
    if (paid.status === 'cancelled') {
      setMessage('Payment cancelled.');
      setBusy(false);
      return;
    }
    if (paid.status === 'failed') {
      setSuccess(false);
      setMessage(paid.message);
      setBusy(false);
      return;
    }

    const confirmed = await apiFetch<ConfirmCheckoutResponse>(
      '/v1/billing/razorpay/confirm',
      {
        method: 'POST',
        body: JSON.stringify({
          ...(body.type === 'subscription' ? { plan: body.plan } : { packId: body.packId }),
          razorpayOrderId: paid.razorpayOrderId,
          razorpayPaymentId: paid.razorpayPaymentId,
          razorpaySignature: paid.razorpaySignature,
        }),
      },
    );
    setEntitlement({
      ...((await apiFetch<EntitlementResponse>('/v1/me/entitlement').catch(
        () => null,
      )) ?? {
        plan: confirmed.plan,
        status: confirmed.status,
        paidCloud: confirmed.paidCloud,
        isPremium: confirmed.isPremium,
        displayPlan: confirmed.displayPlan,
      }),
    } as EntitlementResponse);
    await Promise.all([refreshSubscription(), refreshTransactions()]);
    setSuccess(true);
    setMessage(
      confirmed.activated
        ? 'Payment successful — your plan/credits are active.'
        : 'Payment verified.',
    );
    setBusy(false);
  };

  const checkoutPlan = async (plan: PaidPlan) => {
    if (!ensureAuth(`/account/billing?plan=${plan}&auto=1`)) return;
    const decision = evaluatePlanCheckout({
      plan: entitlement?.plan,
      status: entitlement?.status,
      paidCloud: entitlement?.paidCloud,
      target: plan,
    });
    if (!decision.allowed) {
      setSuccess(false);
      setMessage(decision.reason ?? "You're already on this plan or a higher one.");
      return;
    }
    setBusy(true);
    setMessage(null);
    setSuccess(false);
    try {
      await runCheckout({ type: 'subscription', plan });
    } catch (err) {
      setMessage(friendlyErrorFromUnknown(err));
      setBusy(false);
    }
  };

  const checkoutPack = async (packId: CreditPackId) => {
    if (!ensureAuth(`/account/billing?pack=${packId}&auto=1`)) return;
    setBusy(true);
    setMessage(null);
    setSuccess(false);
    try {
      await runCheckout({ type: 'credits', packId });
    } catch (err) {
      setMessage(friendlyErrorFromUnknown(err));
      setBusy(false);
    }
  };

  const confirmCancelSubscription = async () => {
    if (!ensureAuth()) return;
    setBusy(true);
    setMessage(null);
    setSuccess(false);
    try {
      const res = await apiFetch<CancelSubscriptionResponse>(
        '/v1/billing/razorpay/cancel',
        {
          method: 'POST',
          body: JSON.stringify({}),
        },
      );
      setSuccess(true);
      setMessage(res.message);
      setCancelModalOpen(false);
      await refreshSubscription();
      try {
        await refreshEntitlement();
      } catch {
        /* ignore */
      }
    } catch (err) {
      setMessage(friendlyErrorFromUnknown(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmRestoreSubscription = async () => {
    if (!ensureAuth()) return;
    setBusy(true);
    setMessage(null);
    setSuccess(false);
    try {
      const res = await apiFetch<RestoreSubscriptionResponse>(
        '/v1/billing/razorpay/restore',
        { method: 'POST', body: '{}' },
      );
      setSuccess(true);
      setMessage(res.message);
      setRestoreModalOpen(false);
      await refreshSubscription();
      try {
        await refreshEntitlement();
      } catch {
        /* ignore */
      }
    } catch (err) {
      setMessage(friendlyErrorFromUnknown(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmPaid = async () => {
    if (!ensureAuth('/account/billing?paid=1')) return;
    setBusy(true);
    setMessage('Confirming payment…');
    setSuccess(false);
    try {
      const planParam = searchParams.get('plan');
      const plan =
        planParam === 'starter' || planParam === 'pro' ? planParam : undefined;
      const packParam = searchParams.get('pack');
      const packId =
        packParam === 'nano' || packParam === 'plus' || packParam === 'max'
          ? packParam
          : undefined;
      const body = {
        plan,
        packId,
        paymentLinkId: q(searchParams, 'razorpay_payment_link_id'),
        razorpayPaymentId: q(searchParams, 'razorpay_payment_id'),
        razorpayPaymentLinkId: q(searchParams, 'razorpay_payment_link_id'),
        razorpayPaymentLinkReferenceId: q(
          searchParams,
          'razorpay_payment_link_reference_id',
        ),
        razorpayPaymentLinkStatus: q(
          searchParams,
          'razorpay_payment_link_status',
        ),
        razorpaySignature: q(searchParams, 'razorpay_signature'),
      };
      const res = await apiFetch<ConfirmCheckoutResponse>(
        '/v1/billing/razorpay/confirm',
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      );
      if (res.isPremium || res.displayPlan === 'premium') {
        setSuccess(true);
        setMessage(
          "You're on Premium — Smart and Deep are unlocked in Cloud.",
        );
        try {
          await refreshEntitlement();
          await Promise.all([refreshSubscription(), refreshTransactions()]);
        } catch {
          /* ignore refresh failure */
        }
      } else if (res.paidCloud || res.activated) {
        setSuccess(true);
        setMessage(
          'Credits added — Smart and Deep unlock while your balance lasts. Your plan stays Free until you subscribe.',
        );
        try {
          await refreshEntitlement();
          await Promise.all([refreshSubscription(), refreshTransactions()]);
        } catch {
          /* ignore refresh failure */
        }
      } else {
        setMessage(
          'Payment recorded, but not active yet. Wait a moment and tap Confirm again.',
        );
      }
    } catch (err) {
      setMessage(friendlyErrorFromUnknown(err));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!entitlementReady || autoStarted.current) return;

    if (searchParams.get('paid') === '1') {
      if (confirmStarted.current) return;
      confirmStarted.current = true;
      autoStarted.current = true;
      void confirmPaid();
      return;
    }

    const plan = searchParams.get('plan');
    const pack = searchParams.get('pack');
    const auto = searchParams.get('auto') === '1';
    if (auto && (plan === 'starter' || plan === 'pro')) {
      autoStarted.current = true;
      void checkoutPlan(plan);
      return;
    }
    if (auto && (pack === 'nano' || pack === 'plus' || pack === 'max')) {
      autoStarted.current = true;
      void checkoutPack(pack);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, entitlementReady, entitlement]);

  const starterLabel = prices?.plans.starter.priceLabel ?? '₹399 / mo';
  const proLabel = prices?.plans.pro.priceLabel ?? '₹999 / mo';
  const packs = prices?.packs ?? [];
  const starterCheckout = evaluatePlanCheckout({
    plan: entitlement?.plan,
    status: entitlement?.status,
    paidCloud: entitlement?.paidCloud,
    target: 'starter',
  });
  const proCheckout = evaluatePlanCheckout({
    plan: entitlement?.plan,
    status: entitlement?.status,
    paidCloud: entitlement?.paidCloud,
    target: 'pro',
  });

  const usage = useMemo(() => {
    const monthlyGrant = entitlement?.credits?.monthlyGrant ?? 0;
    const balance = entitlement?.credits?.balance ?? 0;
    const packCredits = entitlement?.credits?.packCredits ?? 0;
    const subscriptionRemaining = Math.max(0, balance - packCredits);
    const usedCredits =
      monthlyGrant > 0
        ? Math.min(monthlyGrant, Math.max(0, monthlyGrant - subscriptionRemaining))
        : 0;
    const quotaPct =
      monthlyGrant > 0
        ? Math.min(100, Math.round((usedCredits / monthlyGrant) * 100))
        : 0;
    const fastLimit = entitlement?.fastFree.limit ?? 0;
    const fastUsed = entitlement?.fastFree.used ?? 0;
    const fastRemaining = entitlement?.fastFree.remaining ?? 0;
    const fastPct =
      fastLimit > 0 ? Math.min(100, Math.round((fastUsed / fastLimit) * 100)) : 0;
    return {
      monthlyGrant,
      balance,
      packCredits,
      subscriptionRemaining,
      usedCredits,
      quotaPct,
      fastLimit,
      fastUsed,
      fastRemaining,
      fastPct,
      status: entitlement?.status ?? '—',
      rpm: entitlement?.limits.requestsPerMinute ?? 0,
      maxInput: entitlement?.limits.maxInputTokens ?? 0,
    };
  }, [entitlement]);

  const isPaid =
    entitlement?.plan === 'starter' || entitlement?.plan === 'pro';
  const accessUntilLabel = formatAccessUntil(subStatus?.accessUntil);
  const showMonthly = usage.monthlyGrant > 0;

  return (
    <div>
      <div className="mb-8">
          <div>
            <h1 className="mb-2 font-space text-3xl font-bold tracking-tight sm:text-4xl">
              Billing
            </h1>
            <p className="max-w-xl text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
              Plan, usage, and top-ups in one place. Checkout is INR via Razorpay.
            </p>
          </div>
        </div>

        {message ? (
          <p
            className="mb-6 rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: success ? 'var(--accent)' : 'rgba(225, 29, 72, 0.4)',
              background: success ? 'var(--accent-glow)' : 'rgba(225, 29, 72, 0.08)',
              color: success ? 'var(--accent)' : '#e11d48',
            }}
          >
            {message}
          </p>
        ) : null}

        {subStatus?.cancelAtPeriodEnd ? (
          <p
            className="mb-6 rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
            }}
          >
            Cancellation scheduled
            {accessUntilLabel ? ` — Premium stays active until ${accessUntilLabel}.` : '.'}{' '}
            No further subscription charges after that.
          </p>
        ) : null}

        {/* Overview cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-card)' }}
          >
            <p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
              Plan
            </p>
            <div className="flex items-center gap-2">
              {isPaid ? (
                <Crown className="h-5 w-5" style={{ color: 'var(--accent)' }} aria-hidden />
              ) : null}
              <p className="font-space text-2xl font-bold">
                {planDisplayName(entitlement?.plan)}
              </p>
            </div>
            <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              Status: {usage.status}
              {subStatus?.isRecurring ? ' · recurring' : null}
            </p>
          </div>

          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-card)' }}
          >
            <p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
              Balance
            </p>
            <p className="font-space text-2xl font-bold tabular-nums" style={{ color: 'var(--accent)' }}>
              {usage.balance}
            </p>
            <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              credits available
              {usage.packCredits > 0
                ? ` · ${usage.packCredits} from packs (expire end of month)`
                : ''}
            </p>
          </div>

          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-card)' }}
          >
            <p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
              Used this period
            </p>
            <p className="font-space text-2xl font-bold tabular-nums">
              {showMonthly ? usage.usedCredits : '—'}
            </p>
            <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {showMonthly
                ? `of ${usage.monthlyGrant} monthly grant`
                : 'No monthly grant on Free'}
            </p>
          </div>

          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-card)' }}
          >
            <p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
              Cloud Fast free
            </p>
            <p className="font-space text-2xl font-bold tabular-nums">
              {usage.fastRemaining}
              <span className="text-base font-medium" style={{ color: 'var(--text-tertiary)' }}>
                /{usage.fastLimit}
              </span>
            </p>
            <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              remaining in rolling window
            </p>
          </div>
        </div>

        {/* Usage progress */}
        <div className="mb-8 grid gap-4 lg:grid-cols-2">
          <section
            className="rounded-2xl border p-6"
            style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-card)' }}
          >
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="font-space text-lg font-bold">Monthly credits</h2>
              <span className="text-sm tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                {showMonthly ? `${usage.quotaPct}%` : 'N/A'}
              </span>
            </div>
            {showMonthly ? (
              <>
                <div
                  className="mb-3 h-2.5 w-full overflow-hidden rounded-full"
                  style={{ background: 'var(--bg-secondary)' }}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={usage.quotaPct}
                  aria-label="Monthly credit usage"
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-500 ease-out"
                    style={{
                      width: `${usage.quotaPct}%`,
                      background: 'var(--accent)',
                    }}
                  />
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {usage.usedCredits} of {usage.monthlyGrant} credits used this month
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {usage.subscriptionRemaining} subscription credits left
                  {usage.packCredits > 0
                    ? ` · ${usage.packCredits} pack credits (expire end of month)`
                    : ''}
                </p>
              </>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Free plan has no monthly grant. Buy a pack or upgrade for Cloud Smart / Deep.
              </p>
            )}
          </section>

          <section
            className="rounded-2xl border p-6"
            style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-card)' }}
          >
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="font-space text-lg font-bold">Fast free window</h2>
              <span className="text-sm tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                {usage.fastPct}%
              </span>
            </div>
            <div
              className="mb-3 h-2.5 w-full overflow-hidden rounded-full"
              style={{ background: 'var(--bg-secondary)' }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={usage.fastPct}
              aria-label="Fast free usage"
            >
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${usage.fastPct}%`,
                  background: 'var(--accent)',
                }}
              />
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {usage.fastUsed} of {usage.fastLimit} free Fast requests used
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {entitlement?.fastFree.windowHours
                ? `${entitlement.fastFree.windowHours}h rolling window`
                : 'Rolling free Fast allowance'}
              {entitlement?.fastFree.resetsAt
                ? ` · next drop ${new Date(entitlement.fastFree.resetsAt).toLocaleString()}`
                : ''}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt style={{ color: 'var(--text-tertiary)' }}>RPM limit</dt>
                <dd className="mt-0.5 font-medium tabular-nums">{usage.rpm || '—'}</dd>
              </div>
              <div>
                <dt style={{ color: 'var(--text-tertiary)' }}>Max context</dt>
                <dd className="mt-0.5 font-medium tabular-nums">
                  {usage.maxInput > 0
                    ? `${Math.round(usage.maxInput / 1000)}k`
                    : '—'}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        {/* Plans & actions */}
        <section className="mb-8">
          <h2 className="mb-4 font-space text-xl font-bold">Plans & actions</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div
              className="flex flex-col rounded-2xl border p-5"
              style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-card)' }}
            >
              <h3 className="font-space text-lg font-bold">Starter</h3>
              <p className="mb-1 mt-1 font-medium" style={{ color: 'var(--accent)' }}>
                {starterLabel}
              </p>
              <p className="mb-4 flex-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {prices?.plans.starter.monthlyCredits ?? 800} credits / mo · Smart + Deep Cloud
              </p>
              <button
                type="button"
                disabled={busy || !starterCheckout.allowed}
                onClick={() => void checkoutPlan('starter')}
                className="rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
                style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                {starterCheckout.allowed
                  ? starterCheckout.ctaLabel === 'Get now'
                    ? 'Get Starter'
                    : (starterCheckout.ctaLabel ?? 'Get Starter')
                  : (starterCheckout.ctaLabel ?? 'Current plan')}
              </button>
              {!starterCheckout.allowed && starterCheckout.reason ? (
                <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {starterCheckout.reason}
                </p>
              ) : null}
            </div>

            <div
              className="flex flex-col rounded-2xl border p-5"
              style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-card)' }}
            >
              <h3 className="font-space text-lg font-bold">Pro</h3>
              <p className="mb-1 mt-1 font-medium" style={{ color: 'var(--accent)' }}>
                {proLabel}
              </p>
              <p className="mb-4 flex-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {prices?.plans.pro.monthlyCredits ?? 2000} credits / mo · higher RPM & context
              </p>
              <button
                type="button"
                disabled={busy || !proCheckout.allowed}
                onClick={() => void checkoutPlan('pro')}
                className="rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-60"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                {proCheckout.allowed
                  ? proCheckout.ctaLabel === 'Get now'
                    ? 'Get Pro'
                    : (proCheckout.ctaLabel ?? 'Get Pro')
                  : (proCheckout.ctaLabel ?? 'Current plan')}
              </button>
              {!proCheckout.allowed && proCheckout.reason ? (
                <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {proCheckout.reason}
                </p>
              ) : null}
              {entitlement?.plan === 'starter' && proCheckout.allowed ? (
                <p className="mt-2 text-xs" style={{ color: 'var(--accent)' }}>
                  Upgrade anytime for a larger monthly pool.
                </p>
              ) : null}
            </div>

            <div
              className="flex flex-col rounded-2xl border p-5"
              style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-card)' }}
            >
              <h3 className="font-space text-lg font-bold">Account</h3>
              <p className="mb-4 flex-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {isPaid
                  ? subStatus?.cancelAtPeriodEnd
                    ? 'Cancellation is scheduled. Restore your plan if that was a mistake.'
                    : 'Cancel at period end to stop renewal. You keep Premium until then.'
                  : 'Upgrade above or buy a credit pack to unlock Cloud Smart and Deep.'}
              </p>
              <div className="flex flex-col gap-2">
                {isPaid ? (
                  subStatus?.cancelAtPeriodEnd ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setRestoreModalOpen(true)}
                      className="rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
                      style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                    >
                      Restore subscription
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setCancelModalOpen(true)}
                      className="rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-60"
                      style={{ borderColor: 'rgba(225, 29, 72, 0.45)', color: '#e11d48' }}
                    >
                      Cancel subscription
                    </button>
                  )
                ) : (
                  <Link
                    href="/account/pricing"
                    className="rounded-full px-4 py-2 text-center text-sm font-semibold"
                    style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                  >
                    View pricing
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Transactions */}
        <section className="mb-8">
          <h2 className="mb-2 font-space text-xl font-bold">Transactions</h2>
          <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Successful subscription and credit-pack purchases.
          </p>
          {transactions.length === 0 ? (
            <div
              className="rounded-2xl border px-5 py-8 text-center text-sm"
              style={{
                borderColor: 'var(--border-primary)',
                background: 'var(--bg-card)',
                color: 'var(--text-tertiary)',
              }}
            >
              No purchases yet.
            </div>
          ) : (
            <div
              className="overflow-hidden rounded-2xl border"
              style={{
                borderColor: 'var(--border-primary)',
                background: 'var(--bg-card)',
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[28rem] text-left text-sm">
                  <thead>
                    <tr
                      className="border-b text-xs uppercase tracking-wide"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Item</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b last:border-b-0"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(tx.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3 font-medium">{tx.label}</td>
                        <td className="px-4 py-3 capitalize" style={{ color: 'var(--text-secondary)' }}>
                          {tx.kind}
                        </td>
                        <td
                          className="px-4 py-3 text-right font-medium tabular-nums"
                          style={{ color: 'var(--accent)' }}
                        >
                          {tx.amountLabel}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Packs */}
        {packs.length > 0 ? (
          <section className="mb-4">
            <h2 className="mb-2 font-space text-xl font-bold">Credit top-up packs</h2>
            <p className="mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Available on any plan — share the same wallet and unlock Cloud Smart / Deep
              while balance lasts.
            </p>
            <p
              className="mb-4 rounded-xl border px-3 py-2 text-sm"
              style={{
                borderColor: 'var(--border-primary)',
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
              }}
            >
              Top-up credits apply only for the calendar month you buy them.
              Unused pack credits expire at month end and do not roll over.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {packs.map((pack) => (
                <div
                  key={pack.id}
                  className="flex flex-col rounded-2xl border p-5"
                  style={{
                    borderColor: 'var(--border-primary)',
                    background: 'var(--bg-card)',
                  }}
                >
                  <h3 className="font-space text-lg font-bold">{pack.label}</h3>
                  <p className="mt-1 font-medium" style={{ color: 'var(--accent)' }}>
                    {pack.priceLabel}
                  </p>
                  <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {pack.credits} credits
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void checkoutPack(pack.id)}
                    className="mt-auto rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
                    style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                  >
                    Buy top-up
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

      {/* Cancel confirmation modal */}
      {cancelModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0"
            style={{ background: 'var(--bg-overlay-heavy)' }}
            aria-label="Close cancel dialog"
            disabled={busy}
            onClick={() => {
              if (!busy) setCancelModalOpen(false);
            }}
          />
          <div
            ref={cancelDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-sub-title"
            className="relative w-full max-w-md rounded-2xl border p-6 shadow-xl"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
            }}
          >
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full p-1.5"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Close"
              disabled={busy}
              onClick={() => setCancelModalOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
            <h2
              id="cancel-sub-title"
              className="pr-8 font-space text-xl font-bold tracking-tight"
            >
              Cancel subscription?
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              You&apos;ll keep {planDisplayName(entitlement?.plan)} Premium until the end of
              this billing period
              {accessUntilLabel ? ` (${accessUntilLabel})` : ''}. Auto-billing and renewal
              stop after that — no immediate lockout. You can restore the plan anytime before
              then if this was a mistake.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setCancelModalOpen(false)}
                className="rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-60"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                Keep plan
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmCancelSubscription()}
                className="rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
                style={{ background: '#e11d48', color: '#fff' }}
              >
                {busy ? 'Cancelling…' : 'Confirm cancel'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Restore subscription modal */}
      {restoreModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0"
            style={{ background: 'var(--bg-overlay-heavy)' }}
            aria-label="Close restore dialog"
            disabled={busy}
            onClick={() => {
              if (!busy) setRestoreModalOpen(false);
            }}
          />
          <div
            ref={restoreDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="restore-sub-title"
            className="relative w-full max-w-md rounded-2xl border p-6 shadow-xl"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
            }}
          >
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full p-1.5"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Close"
              disabled={busy}
              onClick={() => setRestoreModalOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
            <h2
              id="restore-sub-title"
              className="pr-8 font-space text-xl font-bold tracking-tight"
            >
              Restore subscription?
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              This removes the scheduled cancellation. Your{' '}
              {planDisplayName(entitlement?.plan)} plan stays active as before.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setRestoreModalOpen(false)}
                className="rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-60"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                Not now
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmRestoreSubscription()}
                className="rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
                style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                {busy ? 'Restoring…' : 'Restore subscription'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
