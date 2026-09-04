'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { apiFetch, getAccessToken, getApiBaseUrl } from '@/lib/nela-api';
import { friendlyErrorFromUnknown } from '@/lib/friendlyError';
import { evaluatePlanCheckout, type PaidPlan } from '@/lib/planCheckout';
import { openStandardCheckout } from '@/lib/razorpayCheckout';
import type {
  BillingPricesResponse,
  CheckoutResponse,
  ConfirmCheckoutResponse,
  CreditPackId,
  EntitlementResponse,
} from '@/lib/api-types';
import { buildModeTiers } from './featureMatrix';

export default function PricingPageContent() {
  const [prices, setPrices] = useState<BillingPricesResponse | null>(null);
  const [entitlement, setEntitlement] = useState<EntitlementResponse | null>(
    null,
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/v1/billing/prices`);
        if (!res.ok) throw new Error('Failed to load prices');
        const data = (await res.json()) as BillingPricesResponse;
        if (!cancelled) setPrices(data);
      } catch {
        if (!cancelled) {
          setPrices(null);
          setMessage('Could not load live prices. Showing defaults.');
        }
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
        if (!cancelled) setEntitlement(null);
        return;
      }
      try {
        const ent = await apiFetch<EntitlementResponse>('/v1/me/entitlement');
        if (!cancelled) setEntitlement(ent);
      } catch {
        if (!cancelled) setEntitlement(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const paid = params.get('paid') === '1';
    if (!paid) return;
    let cancelled = false;
    void (async () => {
      try {
        if (!getAccessToken()) {
          if (!cancelled) {
            setMessage(
              'Sign in to activate this payment, then open Billing → Confirm.',
            );
          }
          return;
        }
        const planParam = params.get('plan');
        const plan =
          planParam === 'starter' || planParam === 'pro' ? planParam : undefined;
        const packParam = params.get('pack');
        const packId =
          packParam === 'nano' || packParam === 'plus' || packParam === 'max'
            ? packParam
            : undefined;
        const q = (key: string) => {
          const v = params.get(key);
          return v && v.trim() ? v.trim() : undefined;
        };
        const confirmed = await apiFetch<ConfirmCheckoutResponse>(
          '/v1/billing/razorpay/confirm',
          {
            method: 'POST',
            body: JSON.stringify({
              plan,
              packId,
              paymentLinkId: q('razorpay_payment_link_id'),
              razorpayPaymentId: q('razorpay_payment_id'),
              razorpayPaymentLinkId: q('razorpay_payment_link_id'),
              razorpayPaymentLinkReferenceId: q(
                'razorpay_payment_link_reference_id',
              ),
              razorpayPaymentLinkStatus: q('razorpay_payment_link_status'),
              razorpaySignature: q('razorpay_signature'),
            }),
          },
        );
        if (cancelled) return;
        if (confirmed.isPremium || confirmed.displayPlan === 'premium') {
          setSuccess(true);
          setMessage(
            "You're on Premium — Smart and Deep are unlocked in Cloud.",
          );
          return;
        }
        if (confirmed.paidCloud || confirmed.activated) {
          setSuccess(true);
          setMessage(
            'Credits added — Smart and Deep unlock while your balance lasts. Your plan stays Free until you subscribe.',
          );
          return;
        }
        const ent = await apiFetch<EntitlementResponse>('/v1/me/entitlement');
        if (cancelled) return;
        if (ent.isPremium || ent.displayPlan === 'premium') {
          setSuccess(true);
          setMessage("You're on Premium — Smart and Deep are unlocked in Cloud.");
        } else if (ent.paidCloud) {
          setSuccess(true);
          setMessage(
            'Credits are active — Smart and Deep unlock while your balance lasts.',
          );
        } else {
          setMessage(
            'Payment received but not active yet. Open Billing and tap Confirm.',
          );
        }
      } catch (err) {
        if (!cancelled) {
          setMessage(
            friendlyErrorFromUnknown(err),
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const runCheckout = async (
    body: { type: 'subscription'; plan: PaidPlan } | { type: 'credits'; packId: CreditPackId },
    busyKey: string,
  ) => {
    setBusy(busyKey);
    setMessage(null);
    setSuccess(false);
    try {
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
        setBusy(null);
        return;
      }
      if (paid.status === 'failed') {
        setSuccess(false);
        setMessage(paid.message);
        setBusy(null);
        return;
      }

      const confirmed = await apiFetch<ConfirmCheckoutResponse>(
        '/v1/billing/razorpay/confirm',
        {
          method: 'POST',
          body: JSON.stringify({
            ...(body.type === 'subscription'
              ? { plan: body.plan }
              : { packId: body.packId }),
            razorpayOrderId: paid.razorpayOrderId,
            razorpayPaymentId: paid.razorpayPaymentId,
            razorpaySignature: paid.razorpaySignature,
          }),
        },
      );

      const nextEntitlement =
        (await apiFetch<EntitlementResponse>('/v1/me/entitlement').catch(
          () => null,
        )) ??
        ({
          plan: confirmed.plan,
          status: confirmed.status,
          paidCloud: confirmed.paidCloud,
          isPremium: confirmed.isPremium,
          displayPlan: confirmed.displayPlan,
        } as EntitlementResponse);
      setEntitlement(nextEntitlement);
      setSuccess(true);
      setMessage(
        confirmed.activated
          ? 'Payment successful — your plan/credits are active.'
          : 'Payment verified.',
      );
    } catch (err) {
      setSuccess(false);
      setMessage(friendlyErrorFromUnknown(err));
    } finally {
      setBusy(null);
    }
  };

  const payPlan = async (plan: PaidPlan) => {
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
    if (!getAccessToken()) {
      window.location.href = `/login?next=${encodeURIComponent(`/account/billing?plan=${plan}&auto=1`)}`;
      return;
    }
    await runCheckout({ type: 'subscription', plan }, plan);
  };

  const payPack = async (packId: CreditPackId) => {
    if (!getAccessToken()) {
      window.location.href = `/login?next=${encodeURIComponent(`/account/billing?pack=${packId}&auto=1`)}`;
      return;
    }
    await runCheckout({ type: 'credits', packId }, packId);
  };

  const freeLabel = prices?.plans.free.priceLabel ?? '₹0';
  const starterLabel = prices?.plans.starter.priceLabel ?? '₹399 / mo';
  const proLabel = prices?.plans.pro.priceLabel ?? '₹999 / mo';
  const starterCredits = prices?.plans.starter.monthlyCredits ?? 800;
  const proCredits = prices?.plans.pro.monthlyCredits ?? 2000;
  const fastLimit = prices?.fastFree.limit ?? 8;
  const fastWindow = prices?.fastFree.windowHours ?? 6;
  const packs = prices?.packs ?? [
    { id: 'nano' as const, label: 'Nano', credits: 200, priceLabel: '₹199', amountPaise: 19900 },
    { id: 'plus' as const, label: 'Plus', credits: 800, priceLabel: '₹799', amountPaise: 79900 },
    { id: 'max' as const, label: 'Max', credits: 2000, priceLabel: '₹1,799', amountPaise: 179900 },
  ];

  const modeTiers = useMemo(
    () =>
      buildModeTiers({
        fastLimit,
        fastWindow,
        starterCredits,
        proCredits,
        starterPriceLabel: starterLabel,
        proPriceLabel: proLabel,
      }),
    [fastLimit, fastWindow, starterCredits, proCredits, starterLabel, proLabel],
  );

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

  const planCta = (plan: PaidPlan) =>
    plan === 'starter' ? starterCheckout : proCheckout;

  return (
    <div>
        <h1 className="font-space text-4xl md:text-5xl font-bold tracking-tight mb-3">
          Pricing
        </h1>
        <p className="mb-12 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
          Local &amp; Cloud is free to start — on-device modes plus Cloud Fast (
          {fastLimit} / {fastWindow}h). Premium grants monthly credits;
          pay-as-you-go packs top up the same wallet.
          {prices ? ` Prices for ${prices.country} (INR checkout).` : null}
        </p>

        {message ? (
          <p
            className="mb-6 text-sm"
            style={{ color: success ? 'var(--accent)' : '#e11d48' }}
          >
            {message}
          </p>
        ) : null}

        <div className="grid md:grid-cols-3 gap-6 mb-14">
          <div
            className="p-6 rounded-2xl border"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-card)',
            }}
          >
            <h2 className="font-space text-2xl font-bold mb-1">Free</h2>
            <p className="mb-4 font-medium" style={{ color: 'var(--accent)' }}>
              {freeLabel}
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Local &amp; Cloud: private on-device modes plus Cloud Fast{' '}
              {fastLimit}/{fastWindow}h. Buy credits anytime for Smart/Deep.
            </p>
            <Link
              href="/download"
              className="inline-flex rounded-full px-4 py-2 text-sm font-semibold"
              style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
            >
              Download
            </Link>
          </div>

          <div
            className="p-6 rounded-2xl border"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-card)',
            }}
          >
            <h2 className="font-space text-2xl font-bold mb-1">Starter</h2>
            <p className="mb-4 font-medium" style={{ color: 'var(--accent)' }}>
              {starterLabel}
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Premium Cloud: Smart + Deep with {starterCredits} credits / month.
            </p>
            <button
              type="button"
              disabled={busy !== null || !starterCheckout.allowed}
              onClick={() => void payPlan('starter')}
              className="inline-flex rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
              style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
            >
              {busy === 'starter'
                ? 'Opening Razorpay…'
                : starterCheckout.allowed
                  ? starterCheckout.ctaLabel === 'Get now'
                    ? 'Pay Now'
                    : (starterCheckout.ctaLabel ?? 'Pay Now')
                  : (starterCheckout.ctaLabel ?? 'Current plan')}
            </button>
            {!starterCheckout.allowed && starterCheckout.reason ? (
              <p className="mt-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {starterCheckout.reason}
              </p>
            ) : null}
          </div>

          <div
            className="p-6 rounded-2xl border"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-card)',
            }}
          >
            <h2 className="font-space text-2xl font-bold mb-1">Pro</h2>
            <p className="mb-4 font-medium" style={{ color: 'var(--accent)' }}>
              {proLabel}
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Higher pool: {proCredits} credits / month, higher RPM, deeper work.
            </p>
            <button
              type="button"
              disabled={busy !== null || !proCheckout.allowed}
              onClick={() => void payPlan('pro')}
              className="inline-flex rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
              style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
            >
              {busy === 'pro'
                ? 'Opening Razorpay…'
                : proCheckout.allowed
                  ? proCheckout.ctaLabel === 'Get now'
                    ? 'Pay Now'
                    : (proCheckout.ctaLabel ?? 'Pay Now')
                  : (proCheckout.ctaLabel ?? 'Current plan')}
            </button>
            {!proCheckout.allowed && proCheckout.reason ? (
              <p className="mt-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {proCheckout.reason}
              </p>
            ) : null}
          </div>
        </div>

        <section className="mb-12">
          <h2 className="font-space text-2xl font-bold mb-2">Compare modes</h2>
          <p className="mb-6 text-sm max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            Each column builds on the one to its left. Local &amp; Cloud is free;
            Smart and Deep need Premium or credit packs. Team is coming soon.
          </p>

          <div className="pricing-mode-compare">
            <div className="pricing-mode-stack" role="list">
              {modeTiers.map((tier) => {
                const checkout =
                  tier.ctaKind === 'download' || tier.ctaKind === 'team'
                    ? null
                    : planCta(tier.ctaKind);
                const blocked = checkout !== null && !checkout.allowed;
                const teamMailto =
                  'mailto:nelalocal.official@gmail.com?subject=NELA%20Team%20plan%20interest';
                return (
                  <article
                    key={tier.id}
                    className="pricing-mode-card"
                    data-tier={tier.id}
                    role="listitem"
                  >
                    <h3>
                      {tier.title}
                      {tier.comingSoon ? (
                        <span className="pricing-mode-badge">Coming soon</span>
                      ) : null}
                    </h3>
                    {tier.includesFrom ? (
                      <p className="pricing-mode-includes">{tier.includesFrom}</p>
                    ) : (
                      <p className="pricing-mode-includes">Base</p>
                    )}
                    <p className="pricing-mode-price">{tier.priceLabel}</p>
                    {tier.priceHint ? (
                      <p className="pricing-mode-price-hint">{tier.priceHint}</p>
                    ) : null}
                    <p className="pricing-mode-blurb">{tier.blurb}</p>
                    <ul className="pricing-mode-features">
                      {tier.features.map((feature) => (
                        <li key={feature}>
                          <span className="pricing-mode-tick" aria-hidden>
                            <Check size={11} strokeWidth={3} />
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pricing-mode-cta">
                      {tier.ctaKind === 'download' ? (
                        <Link href="/download" className="pricing-mode-cta-btn">
                          {tier.ctaLabel}
                        </Link>
                      ) : tier.ctaKind === 'team' ? (
                        <a
                          href={teamMailto}
                          className="pricing-mode-cta-btn pricing-mode-cta-btn--outline"
                        >
                          {tier.ctaLabel}
                        </a>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="pricing-mode-cta-btn"
                            disabled={busy !== null || blocked}
                            onClick={() => void payPlan(tier.ctaKind as PaidPlan)}
                          >
                            {busy === tier.ctaKind
                              ? 'Opening Razorpay…'
                              : blocked
                                ? (checkout?.ctaLabel ?? 'Current plan')
                                : (checkout?.ctaLabel ?? tier.ctaLabel)}
                          </button>
                          {blocked && checkout?.reason ? (
                            <p
                              className="text-xs text-center"
                              style={{ color: 'var(--text-tertiary)' }}
                            >
                              {checkout.reason}
                            </p>
                          ) : null}
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-space text-2xl font-bold mb-2">
            Credit top-up packs
          </h2>
          <p className="mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Available on any plan — unlocks Cloud Smart / Deep while balance lasts.
            Same wallet as subscription grants.
          </p>
          <p
            className="mb-6 rounded-xl border px-3 py-2 text-sm"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
            }}
          >
            Top-up credits apply only for the calendar month you buy them.
            Unused pack credits expire at the end of that month and do not roll
            over. Subscription monthly grants still reset each billing period.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {packs.map((pack) => (
              <div
                key={pack.id}
                className="p-6 rounded-2xl border"
                style={{
                  borderColor: 'var(--border-primary)',
                  background: 'var(--bg-card)',
                }}
              >
                <h3 className="font-space text-xl font-bold mb-1">{pack.label}</h3>
                <p className="mb-1 font-medium" style={{ color: 'var(--accent)' }}>
                  {pack.priceLabel}
                </p>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                  {pack.credits} credits
                </p>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void payPack(pack.id)}
                  className="inline-flex rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
                  style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
                >
                  {busy === pack.id ? 'Opening Razorpay…' : 'Buy top-up'}
                </button>
              </div>
            ))}
          </div>
        </section>
    </div>
  );
}
