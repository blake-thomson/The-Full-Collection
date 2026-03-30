"use client";

import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-red/10 border-2 border-red/30 flex items-center justify-center mx-auto mb-6">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="font-heading text-3xl font-bold mb-3">
          Welcome to The Full <span className="text-red">Collection</span>
        </h1>

        <p className="text-text-2 text-lg mb-6">
          Your payment was successful! We&apos;re thrilled to have you on board.
        </p>

        <div className="bg-surface border border-border rounded-xl p-5 mb-8 text-left">
          <h3 className="font-heading font-bold text-sm mb-3 text-text">What happens next:</h3>
          <ol className="space-y-3 text-sm text-text-2">
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-red/10 text-red text-xs font-bold flex items-center justify-center mt-0.5">1</span>
              <span>Check your email for your portal login credentials</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-red/10 text-red text-xs font-bold flex items-center justify-center mt-0.5">2</span>
              <span>Log in and complete the onboarding questionnaire so we can learn your brand</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-red/10 text-red text-xs font-bold flex items-center justify-center mt-0.5">3</span>
              <span>Start adding content ideas to your board — our team will take it from there</span>
            </li>
          </ol>
        </div>

        <Link
          href="/login"
          className="tfc-btn inline-block py-3 px-8 text-base no-underline"
        >
          Go to Portal Login
        </Link>

        <p className="text-text-3 text-xs mt-6">
          Questions? Email us at hello@thefullcollection.com
        </p>
      </div>
    </div>
  );
}
