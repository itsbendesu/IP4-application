import Link from "next/link";
import Image from "next/image";

const testimonials = [
  {
    quote:
      "I've been to Davos, TED, Summit—none of them made me feel the way IP3 did. For three days I wasn't a founder or a title. I was just a person in a room full of people who actually gave a damn.",
    name: "Sarah M.",
    descriptor: "IP3 Attendee",
  },
  {
    quote:
      "I walked in knowing no one and left with five people I now talk to every week. Not contacts. Friends.",
    name: "James K.",
    descriptor: "IP2 & IP3 Attendee",
  },
  {
    quote:
      "The video application scared me. In hindsight, that was the point. It filtered for people willing to be vulnerable, and that set the tone for the whole weekend.",
    name: "Priya R.",
    descriptor: "IP3 Attendee",
  },
  {
    quote:
      "No panels. No lanyards. No 'so what do you do?' energy. Just the best conversations I've had in years.",
    name: "Marco D.",
    descriptor: "IP1, IP2, & IP3 Attendee",
  },
  {
    quote:
      "Someone described it as 'a dinner party that lasts three days' and honestly that's the most accurate thing I've ever heard.",
    name: "Amelia T.",
    descriptor: "IP3 Attendee",
  },
  {
    quote:
      "I'm an introvert. I usually hate these things. But the curation was so good that every conversation felt effortless. I didn't have to perform.",
    name: "David L.",
    descriptor: "IP2 Attendee",
  },
];

const faqs = [
  {
    q: "What actually happens at the event?",
    a: "Three days of structured and unstructured time together. Shared meals, facilitated conversations, collaborative activities, and plenty of space to just be. Instead of the usual conference format of 80% listening and 20% talking, we flipped it on its head. IP is all about the attendees and their stories.",
  },
  {
    q: "Where and when is IP4?",
    a: "Details on location and dates are shared with accepted applicants. We keep it intimate\u2014expect somewhere beautiful, walkable, and away from the noise.",
  },
  {
    q: "How many people attend?",
    a: "Around 150. Small enough to meet everyone, large enough to be surprised. We\u2019re deliberate about the mix\u2014ages, backgrounds, geographies, industries.",
  },
  {
    q: "What does it cost?",
    a: "Pricing details are shared upon acceptance. We offer need-based scholarships because interesting isn\u2019t correlated with wealth.",
  },
  {
    q: "Why do I have to record a video?",
    a: "Because resumes lie and bios are performative. A 90-second unedited video tells us more about who you actually are than any written application ever could. It filters for people willing to be real\u2014and that vulnerability set the tone for the whole weekend.",
  },
  {
    q: "What if I'm not a founder or executive?",
    a: "Good. We\u2019re not selecting for titles. Teachers, artists, scientists, writers, community organizers\u2014some of the most interesting people at IP3 had nothing to do with startups.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl font-bold text-slate-900 tracking-tight">
            IP4
          </Link>
          <div className="flex items-center gap-8">
            <Link
              href="#about"
              className="hidden md:block text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              About
            </Link>
            <Link
              href="#testimonials"
              className="hidden md:block text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              Stories
            </Link>
            <Link
              href="#process"
              className="hidden md:block text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              Process
            </Link>
            <Link
              href="#faq"
              className="hidden md:block text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="/apply"
              className="px-5 py-2.5 bg-violet-600 text-white text-sm rounded-full font-medium hover:bg-violet-700 transition-all"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-44 md:pb-32">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-sm font-medium tracking-[0.2em] text-violet-500 uppercase mb-8">
            Interesting People 4 &mdash; Applications Open
          </p>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-slate-900 leading-[1.05] tracking-tight max-w-4xl">
            We used to hate
            <br />
            conferences.
          </h1>
          <p className="mt-8 text-xl md:text-2xl text-slate-500 leading-relaxed max-w-2xl">
            So we built something different. A three-day gathering for 150 people
            selected not for their titles, but for their{" "}
            <span className="text-violet-600 font-medium">curiosity</span>,{" "}
            <span className="text-violet-600 font-medium">depth</span>, and{" "}
            <span className="text-violet-600 font-medium">willingness to be real</span>.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center px-8 py-4 bg-violet-600 text-white rounded-full font-medium text-lg hover:bg-violet-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Apply for IP4
            </Link>
            <Link
              href="#about"
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-slate-600 rounded-full font-medium text-lg border border-slate-200 hover:border-slate-400 hover:text-slate-900 transition-all"
            >
              Learn More
            </Link>
          </div>

          {/* Social proof strip */}
          <div className="mt-16 pt-8 border-t border-slate-100">
            <p className="text-sm text-slate-400 mb-4">From previous gatherings</p>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-bold text-violet-600">400+</span>
                <span className="text-sm text-slate-500">attendees across<br />three events</span>
              </div>
              <div className="hidden sm:block w-px h-10 bg-slate-200" />
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-bold text-violet-600">32</span>
                <span className="text-sm text-slate-500">countries<br />represented</span>
              </div>
              <div className="hidden sm:block w-px h-10 bg-slate-200" />
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-bold text-violet-600">94%</span>
                <span className="text-sm text-slate-500">said they&apos;d<br />come back</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Image */}
      <section className="pb-24 md:pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src="/images/ip3/sunset-panorama.jpg"
              alt="IP3 venue at golden hour — attendees gathered lakeside"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* The Big Idea — editorial section */}
      <section className="bg-slate-950 py-24 md:py-32" id="about">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-medium tracking-[0.2em] text-slate-500 uppercase mb-8">
              The idea
            </p>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-8">
              Most events optimize for{" "}
              <span className="text-slate-500 italic">impressiveness</span>.
              <br />
              We optimize for{" "}
              <span className="text-violet-400 italic">interestingness</span>.
            </h2>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-6">
              It started at a VC conference in 2010. The guy across the table found out
              our founder&apos;s business was bootstrapped&mdash;no venture money&mdash;and literally
              turned his back to talk to someone else. That moment crystallized everything
              wrong with how we gather: we sort people by status, not substance.
            </p>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              So we built the opposite. Like Harvard, but instead of needing a trust
              fund and a last name that&apos;s on a building somewhere, you just need to
              be interesting and nice. No agenda to network. No pressure to perform.
              Just 150 genuinely curious humans and the space to connect like actual
              human beings.
            </p>
          </div>
        </div>
      </section>

      {/* Photo Grid */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <div className="relative col-span-2 h-56 md:h-80 rounded-xl overflow-hidden">
              <Image
                src="/images/ip3/indoor-session.jpg"
                alt="Indoor session at IP3 with floor-to-ceiling windows"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative h-56 md:h-80 rounded-xl overflow-hidden">
              <Image
                src="/images/ip3/ballroom-talk.jpg"
                alt="Speaker addressing the room at IP3"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative h-44 md:h-56 rounded-xl overflow-hidden">
              <Image
                src="/images/ip3/dinner-scene.jpg"
                alt="Shared dinner at IP3"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative h-44 md:h-56 rounded-xl overflow-hidden">
              <Image
                src="/images/ip3/lake-paddleboards.jpg"
                alt="Paddleboarding at golden hour"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative h-44 md:h-56 col-span-2 md:col-span-1 rounded-xl overflow-hidden">
              <Image
                src="/images/ip3/workshop.jpg"
                alt="Workshop session at IP3"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <p className="text-center text-sm text-slate-400 mt-6">Scenes from IP3 &mdash; Victoria, BC</p>
        </div>
      </section>

      {/* The IP Difference — comparison grid */}
      <section className="py-24 md:py-32 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-medium tracking-[0.2em] text-slate-400 uppercase mb-4">
              The IP Difference
            </p>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
              This is not that.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Left column: What others do */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <p className="text-xs font-medium tracking-[0.15em] text-slate-400 uppercase mb-6">Every other event</p>
                <ul className="space-y-4">
                  {[
                    "Curated by status and who you know",
                    "Panels where one person talks, everyone else scrolls",
                    "\"Networking breaks\" that feel like speed dating",
                    "Name badges designed to start with your company",
                    "You leave with 50 LinkedIn connections you'll ignore",
                    "Optimized for sponsors and optics",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-500">
                      <svg className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right column: What IP does */}
            <div className="space-y-4">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                <p className="text-xs font-medium tracking-[0.15em] text-slate-500 uppercase mb-6">Interesting People</p>
                <ul className="space-y-4">
                  {[
                    "Curated by curiosity, depth, and emotional intelligence",
                    "80% talking, 20% listening \u2014 we flipped the script",
                    "Shared meals, walks, and activities that create real bonds",
                    "No badges. We learn names the old-fashioned way",
                    "You leave with 5 people you'll actually stay in touch with",
                    "Optimized for genuine human connection",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300">
                      <svg className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Look For */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-sm font-medium tracking-[0.2em] text-slate-400 uppercase mb-4">
            Selection criteria
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6">
            What gets you in.
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mb-16">
            When we review applications, we ask one question: did this person make us
            feel warm and gooey inside? That usually comes down to three things.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group">
              <span className="number-accent text-5xl md:text-6xl font-bold">01</span>
              <h3 className="text-2xl font-semibold text-slate-900 mt-4 mb-4">Curiosity</h3>
              <p className="text-slate-500 leading-relaxed">
                The kind of person who makes you lean in at dinner. Who asks surprising
                questions. Who has depth, not just credentials. Who goes down rabbit
                holes for the joy of it.
              </p>
            </div>

            <div className="group">
              <span className="number-accent text-5xl md:text-6xl font-bold">02</span>
              <h3 className="text-2xl font-semibold text-slate-900 mt-4 mb-4">Generosity</h3>
              <p className="text-slate-500 leading-relaxed">
                Interesting people make others feel interesting too. They remember
                the small detail you mentioned in passing. They show up fully and
                contribute rather than spectate.
              </p>
            </div>

            <div className="group">
              <span className="number-accent text-5xl md:text-6xl font-bold">03</span>
              <h3 className="text-2xl font-semibold text-slate-900 mt-4 mb-4">Emotional Intelligence</h3>
              <p className="text-slate-500 leading-relaxed">
                People who read rooms. Who can disagree without making it personal.
                Who connect without performing. Who make the space better just by
                being in it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Won't Help — refined */}
      <section className="bg-slate-50 border-y border-slate-100 py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <p className="text-sm font-medium tracking-[0.2em] text-slate-400 uppercase mb-4">
              Fair warning
            </p>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
              What won&apos;t help your application.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-8 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-colors">
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 text-lg mb-3">Your Title</h3>
              <p className="text-slate-500 leading-relaxed">
                &ldquo;Chief Innovation Officer.&rdquo; &ldquo;Futurist.&rdquo; &ldquo;Catalyst.&rdquo;
                &ldquo;Change Maker.&rdquo; These are red flags, not selling points.
                We don&apos;t care what&apos;s on your business card.
              </p>
            </div>

            <div className="p-8 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-colors">
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 text-lg mb-3">Your Credentials</h3>
              <p className="text-slate-500 leading-relaxed">
                Forbes lists, TED stages, viral tweets&mdash;none of it matters here.
                We offer scholarships for a reason: interesting isn&apos;t correlated
                with status or wealth.
              </p>
            </div>

            <div className="p-8 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-colors">
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center mb-5">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 text-lg mb-3">Your Performance</h3>
              <p className="text-slate-500 leading-relaxed">
                Being loud isn&apos;t the same as being interesting. We&apos;re not looking
                for the best personal brand. We&apos;re looking for the most genuine
                human. Listeners thrive here.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cinematic Photo Break */}
      <section className="relative h-72 md:h-[28rem]">
        <Image
          src="/images/ip3/twilight-lakefront.jpg"
          alt="Lakefront at twilight with string lights at IP3"
          fill
          className="object-cover"
        />
      </section>

      {/* Featured Quote */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <svg className="w-12 h-12 text-violet-200 mx-auto mb-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <blockquote className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 leading-[1.2] tracking-tight">
            &ldquo;It&apos;s the only event I&apos;ve ever been to where I didn&apos;t once
            check my phone.&rdquo;
          </blockquote>
          <p className="mt-8 text-slate-500">
            <span className="font-medium text-slate-700">Marco D.</span>{" "}
            &mdash; IP1, IP2, & IP3 Attendee
          </p>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="bg-slate-50 py-24 md:py-32" id="testimonials">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
            <div>
              <p className="text-sm font-medium tracking-[0.2em] text-slate-400 uppercase mb-4">
                In their words
              </p>
              <h2 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
                Stories from the room.
              </h2>
            </div>
            <p className="text-slate-500 max-w-md">
              We don&apos;t need to sell you on it. The people who&apos;ve been there will.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="testimonial-card bg-white rounded-2xl border border-slate-200/80 p-8 flex flex-col"
              >
                <svg className="w-8 h-8 text-violet-200 mb-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-slate-600 leading-relaxed flex-grow mb-6">
                  {t.quote}
                </p>
                <div className="pt-4 border-t border-slate-100">
                  <p className="font-medium text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-400">{t.descriptor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Process */}
      <section className="bg-slate-950 py-24 md:py-32" id="process">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-sm font-medium tracking-[0.2em] text-slate-500 uppercase mb-4">
            How it works
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-white tracking-tight mb-6">
            The application takes 10 minutes.
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mb-16">
            We made the bar to apply low and the bar to get in high. It&apos;s intentionally
            simple, intentionally uncomfortable, and intentionally human.
          </p>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div className="relative">
              <span className="font-serif text-6xl md:text-7xl font-bold text-violet-300/30 absolute -top-4 -left-2">1</span>
              <div className="relative pt-12">
                <h3 className="text-xl font-semibold text-white mb-3">Tell us who you are</h3>
                <p className="text-slate-400 leading-relaxed">
                  Your name, where you&apos;re from, and a short bio. No resume. No LinkedIn.
                  We want to know what makes you tick, not what makes you look good on paper.
                </p>
              </div>
            </div>

            <div className="relative">
              <span className="font-serif text-6xl md:text-7xl font-bold text-violet-300/30 absolute -top-4 -left-2">2</span>
              <div className="relative pt-12">
                <h3 className="text-xl font-semibold text-white mb-3">Record a 90-second video</h3>
                <p className="text-slate-400 leading-relaxed">
                  Two prompts. 45 seconds each. One take. No do-overs. We want to
                  see the real you&mdash;how you think on your feet, not how well you
                  rehearse.
                </p>
              </div>
            </div>

            <div className="relative">
              <span className="font-serif text-6xl md:text-7xl font-bold text-violet-300/30 absolute -top-4 -left-2">3</span>
              <div className="relative pt-12">
                <h3 className="text-xl font-semibold text-white mb-3">We watch. We respond.</h3>
                <p className="text-slate-400 leading-relaxed">
                  A real human watches every single video. No AI screening. No keyword filters.
                  We&apos;ll email you either way&mdash;yes, no, or waitlist.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-12 border-t border-white/10 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-slate-900 rounded-full font-medium text-lg hover:bg-slate-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Your Application
            </Link>
            <p className="text-sm text-slate-500">
              Applications reviewed on a rolling basis. Apply early.
            </p>
          </div>
        </div>
      </section>

      {/* Photo Strip */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="relative h-44 md:h-64 rounded-xl overflow-hidden">
              <Image
                src="/images/ip3/group-photo.jpg"
                alt="IP3 attendees smiling together"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative h-44 md:h-64 rounded-xl overflow-hidden">
              <Image
                src="/images/ip3/beach-conversation.jpg"
                alt="Lakeside conversation at sunset"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative h-44 md:h-64 rounded-xl overflow-hidden">
              <Image
                src="/images/ip3/stage-performance.jpg"
                alt="Evening performance at IP3"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Band */}
      <section className="bg-white py-16 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="text-center">
              <p className="font-serif text-4xl md:text-5xl font-bold text-violet-600">3</p>
              <p className="text-sm text-slate-500 mt-2">days together</p>
            </div>
            <div className="text-center">
              <p className="font-serif text-4xl md:text-5xl font-bold text-violet-600">150</p>
              <p className="text-sm text-slate-500 mt-2">attendees max</p>
            </div>
            <div className="text-center">
              <p className="font-serif text-4xl md:text-5xl font-bold text-violet-600">0</p>
              <p className="text-sm text-slate-500 mt-2">panels or keynotes</p>
            </div>
            <div className="text-center">
              <p className="font-serif text-4xl md:text-5xl font-bold text-violet-600">100%</p>
              <p className="text-sm text-slate-500 mt-2">human-reviewed</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 md:py-32" id="faq">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-sm font-medium tracking-[0.2em] text-slate-400 uppercase mb-4">
            Frequently asked
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-16">
            Questions we hear a lot.
          </h2>

          <div className="space-y-0">
            {faqs.map((faq, i) => (
              <details key={i} className="group border-b border-slate-200">
                <summary className="flex items-center justify-between py-6 cursor-pointer list-none">
                  <h3 className="text-lg font-medium text-slate-900 pr-8">{faq.q}</h3>
                  <svg
                    className="w-5 h-5 text-violet-400 flex-shrink-0 transition-transform group-open:rotate-45"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </summary>
                <p className="pb-6 text-slate-500 leading-relaxed pr-12">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-slate-950 py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-4xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6">
            Still reading?
            <br />
            <span className="text-violet-400">That&apos;s a good sign.</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-12">
            The kind of person who reads this far is usually the kind of person
            we&apos;re looking for. Take 10 minutes. Be yourself. See what happens.
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center justify-center px-10 py-5 bg-violet-500 text-white rounded-full font-medium text-lg hover:bg-violet-600 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Apply for IP4
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <p className="font-serif text-lg font-bold text-slate-900 mb-1">Interesting People</p>
              <p className="text-sm text-slate-400">
                A gathering for the genuinely curious.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <Link href="/apply" className="text-slate-500 hover:text-slate-900 transition-colors">
                Apply
              </Link>
              <Link href="/privacy" className="text-slate-500 hover:text-slate-900 transition-colors">
                Privacy
              </Link>
              <Link href="#about" className="text-slate-500 hover:text-slate-900 transition-colors">
                About
              </Link>
              <Link href="#faq" className="text-slate-500 hover:text-slate-900 transition-colors">
                FAQ
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-100 text-sm text-slate-400">
            Applications reviewed on a rolling basis. We respond to everyone.
          </div>
        </div>
      </footer>
    </main>
  );
}
