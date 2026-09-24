/** Progressive mode columns for the pricing page (Local & Cloud → Smart → Deep → Team). */

export interface ModeTierLiveValues {
  fastLimit: number;
  fastWindow: number;
  starterCredits: number;
  proCredits: number;
  starterPriceLabel: string;
  proPriceLabel: string;
}

export type ModeCtaKind = 'download' | 'starter' | 'pro' | 'team';

export interface ModeTier {
  id: 'local_cloud' | 'smart' | 'deep' | 'team';
  title: string;
  /** Shown under the title — e.g. "Everything in Local & Cloud, plus:" */
  includesFrom?: string;
  priceLabel: string;
  priceHint?: string;
  blurb: string;
  features: string[];
  ctaKind: ModeCtaKind;
  ctaLabel: string;
  comingSoon?: boolean;
}

export function buildModeTiers(live: ModeTierLiveValues): ModeTier[] {
  const fastQuota = `${live.fastLimit} requests / ${live.fastWindow}h free`;

  return [
    {
      id: 'local_cloud',
      title: 'Local & Cloud',
      priceLabel: '₹0',
      priceHint: 'Local forever · Cloud Fast free tier',
      blurb:
        'Private on-device modes plus signed-in Cloud Fast — including plain-language Tally text answers when connected.',
      features: [
        'Fast, Smart, and Deep on your device — no account required',
        'Read-only TallyPrime connect · text money answers',
        'Artifacts, web search, docs / RAG, voice, vision, Playground',
        `Cloud Fast chat (${fastQuota} on Free)`,
        'Unlimited Cloud Fast while you have credits',
        'Credit packs unlock Cloud Smart and Deep anytime',
      ],
      ctaKind: 'download',
      ctaLabel: 'Download now',
    },
    {
      id: 'smart',
      title: 'Cloud Smart',
      includesFrom: 'Everything in Local & Cloud, plus:',
      priceLabel: live.starterPriceLabel,
      priceHint: `Starter · ${live.starterCredits} credits / mo`,
      blurb:
        'Balanced Cloud reasoning for everyday owner questions — stronger Tally tool use and artifacts.',
      features: [
        'Smart quality tier on Cloud',
        'Stronger Tally Q&A, live dashboard, and Excel export',
        'Stronger tool use and freeform Cloud artifacts',
        'Also unlockable with Pro or credit packs',
      ],
      ctaKind: 'starter',
      ctaLabel: 'Get now',
    },
    {
      id: 'deep',
      title: 'Cloud Deep',
      includesFrom: 'Everything in Cloud Smart, plus:',
      priceLabel: live.proPriceLabel,
      priceHint: `Pro · ${live.proCredits} credits / mo`,
      blurb: 'Highest Cloud quality for long or complex business analysis.',
      features: [
        'Deep quality tier on Cloud',
        'Best for large context and tougher Tally / document work',
        `Bigger monthly pool than Starter (${live.starterCredits} → ${live.proCredits})`,
      ],
      ctaKind: 'pro',
      ctaLabel: 'Get now',
    },
    {
      id: 'team',
      title: 'Team / Enterprise',
      includesFrom: 'Everything in Cloud Deep, plus:',
      priceLabel: 'Coming soon',
      priceHint: 'Per-seat INR · shared org billing',
      blurb:
        'Seats for your organization with admin controls and centralized billing. Checkout is not open yet.',
      features: [
        'Per-user pricing in INR',
        'Shared org wallet and usage visibility',
        'Admin controls and seat management',
        'Priority onboarding when we launch',
      ],
      ctaKind: 'team',
      ctaLabel: 'Contact for Team',
      comingSoon: true,
    },
  ];
}
