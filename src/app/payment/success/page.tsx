import Link from "next/link";

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-stone-900">Payment Confirmed</h1>
        <p className="text-stone-600">
          Your ticket has been secured. You&apos;ll receive a confirmation email shortly with event details.
        </p>
        <p className="text-sm text-stone-400 mt-6">
          We do not offer refunds, but you can transfer your ticket to someone else up to 14 days before the event.
          Email <a href="mailto:hello@interestingpeople.com" className="text-blue-600 hover:underline">hello@interestingpeople.com</a> for transfers.
        </p>
        <div className="pt-4">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Back to interestingpeople.com
          </Link>
        </div>
      </div>
    </div>
  );
}
