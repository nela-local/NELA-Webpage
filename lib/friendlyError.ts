/**
 * Convert API / network errors into short human messages with a next step.
 * Used across the NELA website (account, login, billing, pricing).
 */

export function friendlyError(raw: string | undefined | null): string {
  const text = (raw ?? "").trim();
  if (!text) return "Something went wrong. Please try again.";

  const lower = text.toLowerCase();

  if (looksAlreadyFriendly(lower) && !looksTechnical(text)) {
    const first = text.split(/(?<=\.)\s+/)[0] ?? text;
    if (!looksTechnical(first)) return ensureNextStep(first);
  }

  if (lower.includes("already on") || lower.includes("higher tier")) {
    return text.replace(/\.*\s*$/, "") + ".";
  }

  if (
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("connection refused") ||
    lower.includes("econnrefused") ||
    lower.includes("enotfound") ||
    lower.includes("unreachable") ||
    lower.includes("localhost")
  ) {
    return "We couldn't reach NELA Cloud. Check your internet connection and try again.";
  }

  if (
    lower.includes("invalid credentials") ||
    lower.includes("wrong password") ||
    lower.includes("invalid email or password")
  ) {
    return "That email or password doesn't look right. Check them and try again.";
  }

  if (lower.includes("missing bearer") || lower.includes("device session revoked")) {
    return "Your session expired. Sign in again and try again.";
  }

  if (lower.includes("unauthorized") || lower.includes("401")) {
    return "You're not authorized for that. Sign in again and try again.";
  }

  if (lower.includes("email_already") || lower.includes("already exists")) {
    return "An account with that email already exists. Sign in instead, or use a different email.";
  }

  if (
    lower.includes("email_not_verified") ||
    lower.includes("verify your email") ||
    lower.includes("verification link")
  ) {
    return "Verify your email before signing in. Check your inbox for the link, or request a new one.";
  }

  if (
    lower.includes("email_verification") ||
    lower.includes("verification link is invalid")
  ) {
    return "That verification link is invalid or expired. Request a new one from the sign-in page.";
  }

  if (
    lower.includes("session expired") ||
    lower.includes("refresh") ||
    lower.includes("sign in again")
  ) {
    return "Your session expired. Please sign in again.";
  }

  if (
    lower.includes("device_code") ||
    lower.includes("device code") ||
    lower.includes("8 character")
  ) {
    return "That device code didn't work. Generate a new code on desktop and try again.";
  }

  if (
    lower.includes("quota") ||
    lower.includes("credit") ||
    lower.includes("upgrade")
  ) {
    return "Your credits or plan don't cover this. Open Billing to upgrade or buy a pack.";
  }

  if (
    lower.includes("razorpay") ||
    lower.includes("checkout") ||
    lower.includes("payment") ||
    lower.includes("billing")
  ) {
    return "We couldn't complete checkout. Check your payment details and try again.";
  }

  if (lower.includes("rate") || lower.includes("429") || lower.includes("too many")) {
    return "Too many requests just now. Wait a few seconds, then try again.";
  }

  if (lower.includes("failed to load") || lower.includes("failed to save")) {
    return "We couldn't save that. Please try again.";
  }

  if (looksTechnical(text) || /\b[A-Z_]{4,}\b/.test(text) || /^api \d+/i.test(text)) {
    return "Something went wrong. Please try again.";
  }

  if (text.length < 160 && !looksTechnical(text)) {
    return ensureNextStep(text);
  }

  return "Something went wrong. Please try again.";
}

export function friendlyErrorFromUnknown(err: unknown): string {
  return friendlyError(err instanceof Error ? err.message : String(err));
}

function looksAlreadyFriendly(lower: string): boolean {
  return (
    lower.startsWith("we couldn't") ||
    lower.startsWith("something went wrong") ||
    lower.startsWith("that email") ||
    lower.startsWith("verify your email") ||
    lower.startsWith("your session") ||
    lower.startsWith("too many") ||
    lower.includes("please try again") ||
    lower.includes("sign in again") ||
    lower.includes("check your")
  );
}

function ensureNextStep(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("try again") ||
    lower.includes("sign in") ||
    lower.includes("check ") ||
    lower.includes("upgrade") ||
    lower.includes("buy ") ||
    lower.includes("open ") ||
    lower.includes("wait ")
  ) {
    return message;
  }
  return `${message.replace(/\.*\s*$/, "")}. Please try again.`;
}

function looksTechnical(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("http://") ||
    lower.includes("https://") ||
    lower.includes("localhost") ||
    lower.includes("status") ||
    /\{.*\}/.test(text) ||
    /\b[A-Z_]{4,}\b/.test(text) ||
    /\b(errno|econn|enotfound)\b/i.test(text)
  );
}
