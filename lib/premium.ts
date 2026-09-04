/** Shared Premium helpers for webpage chrome (per-user, server-driven). */

/**
 * Premium = active Starter/Pro subscription only.
 *
 * Do NOT treat `paidCloud` (credit balance > 0) as Premium — free-trial and
 * credit-pack balances unlock Smart/Deep while they last, but the account
 * plan stays Free until a paid subscription is active. Conflating the two
 * made cancelled/failed top-ups look like Pro while admin still showed Free.
 */
export function isPremiumAccount(input: {
  plan?: string | null;
  displayPlan?: string | null;
  isPremium?: boolean | null;
  paidCloud?: boolean | null;
  entitlementStatus?: string | null;
  status?: string | null;
}): boolean {
  if (input.isPremium === true) return true;
  if (input.displayPlan === "premium") return true;
  if (input.isPremium === false || input.displayPlan === "free") {
    // Explicit server fields win — ignore legacy paidCloud for branding.
    if (input.isPremium === false) return false;
    if (input.displayPlan === "free") return false;
  }

  const plan = (input.plan ?? "free").toLowerCase();
  if (plan !== "starter" && plan !== "pro") return false;

  const status = (input.status ?? input.entitlementStatus ?? "").toLowerCase();
  if (status === "inactive" || status === "cancelled") return false;

  // Legacy fallback only when premium fields were omitted by an older API.
  if (input.isPremium === undefined && input.displayPlan === undefined) {
    return true;
  }
  return false;
}
