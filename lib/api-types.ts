/**
 * Frontend-owned API response shapes for the NELA Cloud HTTP API.
 * Kept in this repo only — not shared with nela-backend. If the API
 * contract changes, update these types to match the backend responses.
 */

export type CloudPlan = "free" | "starter" | "pro";

export type CreditPackId = "nano" | "plus" | "max";

export type DisplayPlan = "free" | "premium";

export type EntitlementStatus =
  | "inactive"
  | "active"
  | "past_due"
  | "cancelled"
  | "quota_exhausted";

export interface UserProfileDto {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  authProvider: "google" | "email";
  plan: CloudPlan;
  displayPlan?: DisplayPlan;
  isPremium?: boolean;
  entitlementStatus: EntitlementStatus;
  updatedAt: string;
  occupation?: string | null;
  field?: string | null;
  onboardingCompleted?: boolean;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  profile: UserProfileDto;
}

export interface EmailRegisterResponse {
  requiresVerification: true;
  email: string;
  message: string;
}

export interface EmailVerifyResponse {
  ok: true;
  email: string;
  message: string;
}

export interface EmailResendResponse {
  ok: true;
  message: string;
}

export interface EntitlementResponse {
  cloudEnabled: boolean;
  plan: CloudPlan;
  status: EntitlementStatus;
  displayPlan?: DisplayPlan;
  isPremium?: boolean;
  paidCloud: boolean;
  credits?: {
    balance: number;
    packCredits: number;
    monthlyGrant: number;
  };
  quota: {
    includedUsd: number;
    usedUsd: number;
    remainingUsd: number;
  };
  fastFree: {
    limit: number;
    used: number;
    remaining: number;
    windowHours?: number;
    resetsAt?: string | null;
  };
  limits: {
    maxInputTokens: number;
    maxOutputTokens: number;
    requestsPerMinute: number;
  };
}

export interface BillingPricesResponse {
  country: string;
  currency: "INR";
  usdInrRate: number;
  plans: {
    free: { priceLabel: string; monthlyCredits: number; features: string[] };
    starter: {
      priceLabel: string;
      amountPaise: number;
      monthlyCredits: number;
      features: string[];
    };
    pro: {
      priceLabel: string;
      amountPaise: number;
      monthlyCredits: number;
      features: string[];
    };
  };
  packs: Array<{
    id: CreditPackId;
    label: string;
    credits: number;
    priceLabel: string;
    amountPaise: number;
  }>;
  fastFree: { limit: number; windowHours: number };
  orUsdPerCredit: number;
}

export interface CheckoutResponse {
  mode: 'standard' | 'redirect';
  keyId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  prefillEmail?: string;
  checkoutUrl?: string;
}

export interface CancelSubscriptionResponse {
  ok: boolean;
  cancelAtPeriodEnd: boolean;
  accessUntil: string | null;
  plan: CloudPlan;
  message: string;
}

export interface BillingTransactionDto {
  id: string;
  kind: "subscription" | "pack";
  sku: string;
  label: string;
  amountPaise: number;
  amountLabel: string;
  currency: string;
  createdAt: string;
}

export interface BillingTransactionsResponse {
  transactions: BillingTransactionDto[];
}

export interface SubscriptionBillingStatusResponse {
  subscription: {
    plan: "starter" | "pro" | "free";
    status: string | null;
    cancelAtPeriodEnd: boolean;
    accessUntil: string | null;
    isRecurring: boolean;
  } | null;
}

export interface ConfirmCheckoutResponse {
  ok: boolean;
  activated: boolean;
  plan: CloudPlan;
  status: EntitlementStatus;
  paidCloud: boolean;
  isPremium: boolean;
  displayPlan?: DisplayPlan;
}
