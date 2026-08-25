/**
 * Razorpay Standard Checkout (Checkout.js modal).
 * Key ID comes from the API create-order response — never ship KEY_SECRET here.
 */

import type { CheckoutResponse } from './api-types';

const SCRIPT_ID = 'razorpay-checkout-js';
const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { email?: string; name?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayConstructor = new (options: RazorpayOptions) => {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

function loadCheckoutScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay checkout requires a browser'));
  }
  if (window.Razorpay) return Promise.resolve();

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load Razorpay Checkout.js')),
        { once: true },
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Failed to load Razorpay Checkout.js'));
    document.body.appendChild(script);
  });
}

export type StandardCheckoutResult =
  | {
      status: 'paid';
      razorpayPaymentId: string;
      razorpayOrderId: string;
      razorpaySignature: string;
    }
  | { status: 'cancelled' }
  | { status: 'failed'; message: string };

/**
 * Open Razorpay Standard Checkout for a create-order response.
 */
export async function openStandardCheckout(
  checkout: CheckoutResponse,
): Promise<StandardCheckoutResult> {
  if (checkout.mode !== 'standard') {
    throw new Error('Expected Standard Checkout payload from API');
  }
  if (
    !checkout.keyId ||
    !checkout.orderId ||
    typeof checkout.amount !== 'number' ||
    !checkout.currency
  ) {
    throw new Error('Incomplete Razorpay order payload');
  }

  await loadCheckoutScript();
  if (!window.Razorpay) {
    throw new Error('Razorpay Checkout.js did not initialize');
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: StandardCheckoutResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const rzp = new window.Razorpay!({
      key: checkout.keyId!,
      amount: checkout.amount!,
      currency: checkout.currency!,
      name: checkout.name || 'NELA',
      description: checkout.description,
      order_id: checkout.orderId!,
      prefill: checkout.prefillEmail
        ? { email: checkout.prefillEmail }
        : undefined,
      handler: (response) => {
        finish({
          status: 'paid',
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => finish({ status: 'cancelled' }),
      },
    });

    rzp.on('payment.failed', (response) => {
      const err = response as {
        error?: { description?: string; reason?: string };
      };
      finish({
        status: 'failed',
        message:
          err.error?.description ||
          err.error?.reason ||
          'Payment failed. Please try again.',
      });
    });

    rzp.open();
  });
}
