import { Suspense } from 'react';
import BillingClient from './BillingClient';

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <p style={{ color: 'var(--text-secondary)' }}>Loading billing…</p>
      }
    >
      <BillingClient />
    </Suspense>
  );
}
