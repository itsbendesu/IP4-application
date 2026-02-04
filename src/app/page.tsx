import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
          We&apos;re looking for
          <br />
          <span className="text-indigo-600">interesting people.</span>
        </h1>
        <p className="mt-6 text-xl text-gray-600 leading-relaxed">
          Not impressive people. Not successful people. Not people who look good on paper.
          Just genuinely interesting humans who make conversations better.
        </p>
      </section>

      {/* What we value */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-8">
            What we&apos;re looking for
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Curiosity</h3>
              <p className="mt-2 text-gray-600">
                People who ask questions they don&apos;t know the answers to. Who go down rabbit holes
                for the joy of it. Who are more interested in learning than being right.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900">Participation</h3>
              <p className="mt-2 text-gray-600">
                People who show up fully. Who contribute to conversations rather than spectate.
                Who make things happen instead of waiting for permission.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900">Emotional Intelligence</h3>
              <p className="mt-2 text-gray-600">
                People who read rooms. Who make others feel heard. Who can disagree without
                making it personal and connect without performing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What we don't value */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-8">
            What won&apos;t help your application
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-700">Your Resume</h3>
              <p className="mt-2 text-sm text-gray-500">
                We don&apos;t care where you went to school or where you work.
                Credentials are not a proxy for interesting.
              </p>
            </div>

            <div className="p-5 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-700">Your Wealth</h3>
              <p className="mt-2 text-sm text-gray-500">
                Money doesn&apos;t make you interesting. Neither does the appearance of it.
              </p>
            </div>

            <div className="p-5 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-700">Your Volume</h3>
              <p className="mt-2 text-sm text-gray-500">
                Being loud isn&apos;t the same as being interesting.
                We value depth over performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The process */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-3xl mx-auto px-6 text-white">
          <h2 className="text-2xl font-bold mb-8">How to apply</h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <h3 className="font-semibold">Tell us who you are</h3>
                <p className="mt-1 text-indigo-100">
                  Basic info and a short bio. No resume, no LinkedIn.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <h3 className="font-semibold">Answer a prompt on video</h3>
                <p className="mt-1 text-indigo-100">
                  You&apos;ll get one randomly assigned prompt. 90 seconds. One take. No do-overs.
                  We want to see the real you, not the polished you.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <h3 className="font-semibold">We review and respond</h3>
                <p className="mt-1 text-indigo-100">
                  Every application is watched by a human. We&apos;ll email you either way.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <Link
              href="/apply"
              className="inline-block px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
            >
              Start Application
            </Link>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-gray-500 text-sm">
            Applications are reviewed on a rolling basis. We read every single one.
          </p>
        </div>
      </section>
    </main>
  );
}
