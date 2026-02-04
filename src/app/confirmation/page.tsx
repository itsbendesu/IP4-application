import Link from "next/link";

export default function ConfirmationPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          You&apos;re in the queue!
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Thanks for showing us who you are.
          We watch every single video and will be in touch.
        </p>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 text-left">
          <h2 className="font-semibold text-gray-900 mb-4">What happens now?</h2>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-semibold text-indigo-600">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">We watch your video</p>
                <p className="text-sm text-gray-600">A real human (not an AI) reviews every application.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-semibold text-indigo-600">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">We email you</p>
                <p className="text-sm text-gray-600">
                  Whether it&apos;s a yes, no, or waitlist - we&apos;ll let you know.
                  Check your inbox (and spam folder).
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-semibold text-indigo-600">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">If accepted</p>
                <p className="text-sm text-gray-600">
                  You&apos;ll get all the details about the event, dates, and how to confirm your spot.
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div className="text-gray-500 text-sm mb-6">
          <p>Questions? Reply to your confirmation email.</p>
        </div>

        <Link
          href="/"
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          &larr; Back to home
        </Link>
      </div>
    </main>
  );
}
