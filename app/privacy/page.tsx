export default function PrivacyPage() {
  return (
    <main className="min-h-screen pt-28 px-6 pb-16">
      <article className="max-w-2xl mx-auto prose prose-invert">
        <h1 className="font-space text-4xl font-bold tracking-tight mb-6">
          Privacy Policy
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          NELA is local-first. Your desktop workspaces, local models, and file
          indexes stay on your device unless you explicitly send context to NELA
          Cloud. The optional TallyPrime connector is read-only: NELA reads
          ledgers and reports over the local HTTP Server and never writes
          vouchers.
        </p>
        <h2 className="font-space text-2xl font-semibold mt-8 mb-3">
          Account data
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          When you sign in with Google via NELA Cloud, we store your email, name,
          avatar URL, and subscription entitlement needed to operate the
          service.
        </p>
        <h2 className="font-space text-2xl font-semibold mt-8 mb-3">
          Cloud inference
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Prompts sent to Fast Cloud are proxied through our API to the model
          provider. File-derived context requires an explicit confirmation in
          the desktop app. Prompt logging is disabled by default.
        </p>
        <h2 className="font-space text-2xl font-semibold mt-8 mb-3">
          Payments
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Billing is processed by Razorpay. We store subscription identifiers and
          entitlement state; we do not store full payment card details.
        </p>
        <p className="mt-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Last updated: July 22, 2026
        </p>
      </article>
    </main>
  );
}
