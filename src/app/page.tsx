import Link from "next/link";
import Image from "next/image";
import PhotoGallery from "@/components/PhotoGallery";

const notablePeople = [
  { name: "Hannibal Buress", role: "Comedian", image: "/images/speakers/hannibal-buress.jpg" },
  { name: "Sam Reich", role: "TV Producer", image: "/images/speakers/sam-reich.jpg" },
  { name: "Greg Isenberg", role: "Entrepreneur", image: "/images/speakers/greg-isenberg.jpg" },
  { name: "Dr. Rhonda Patrick", role: "Scientist", image: "/images/speakers/dr-rhonda-patrick.jpg" },
  { name: "Matthew Buchanan", role: "Entrepreneur", image: "/images/speakers/matthew-buchanan.jpg" },
  { name: "Patrick Campbell", role: "Entrepreneur", image: "/images/speakers/patrick-campbell.jpg" },
  { name: "Shaan Puri", role: "Podcaster", image: "/images/speakers/shaan-puri.jpg" },
  { name: "Bill Oakley", role: "TV Writer", image: "/images/speakers/bill-oakley.jpg" },
  { name: "Darya Rose", role: "Neuroscientist", image: "/images/speakers/darya-rose.jpeg" },
  { name: "Steph Smith", role: "Podcaster", image: "/images/speakers/steph-smith.jpg" },
  { name: "Andrew Wilkinson", role: "Entrepreneur", image: "/images/speakers/andrew-wilkinson.jpg" },
  { name: "Nick Gray", role: "Author", image: "/images/speakers/nick-gray.jpg" },
  { name: "Matthew Dicks", role: "Storyteller", image: "/images/speakers/matthew-dicks.jpg" },
  { name: "Adam Lisagor", role: "Director", image: "/images/speakers/adam-lisagor.jpg" },
  { name: "Cyan Banister", role: "Investor", image: "/images/speakers/cyan-banister.jpg" },
  { name: "Jon Glaser", role: "Comedian", image: "/images/speakers/jon-glaser.jpg" },
  { name: "Josh Johnson", role: "Comedian", image: "/images/speakers/josh-johnson.jpg" },
  { name: "Jason Verners", role: "Magician", image: "/images/speakers/jason-verners.jpg" },
];

const featuredTestimonials = [
  {
    quote:
      "A super well run event. I had a blast!",
    name: "Shaan Puri",
    descriptor: "Co-host, My First Million",
    image: "/images/speakers/shaan-puri.jpg",
  },
  {
    quote:
      "Interesting People is exactly what a conference should be, but often isn\u2019t. A small, curated group with programming focused on connection instead of cookie-cutter content.",
    name: "Steph Smith",
    descriptor: "Creator of Internet Pipes, a16z Podcast Host",
    image: "/images/speakers/steph-smith.jpg",
  },
  {
    quote:
      "Met a roomful of people who were genuinely incredible human beings: Smart. Kind. Generous. Curious. Open minded. A collection of damn unicorns!",
    name: "Matthew Dicks",
    descriptor: "Author of Storyworthy",
    image: "/images/speakers/matthew-dicks.jpg",
  },
];

const faqs = [
  {
    q: "What actually happens at the event?",
    a: "Three days of structured and unstructured time together. Hand-picked dinner groups with conversation prompts to skip the small talk. A storytelling workshop with Moth champion Matthew Dicks. Comedy night. Lake swims. Late-night conversations that turn into friendships. No panels. No keynotes. No lanyards.",
  },
  {
    q: "Where and when is IP4?",
    a: "July 27\u201330, 2026 in Victoria, Canada. Somewhere beautiful, walkable, and away from the noise.",
  },
  {
    q: "How many people attend?",
    a: "Around 150. Small enough to meet everyone, large enough to be surprised. We\u2019re deliberate about the mix \u2014 ages, backgrounds, geographies, industries.",
  },
  {
    q: "Why do I have to record a video?",
    a: "Because resumes lie and bios are performative. A 90-second unedited video tells us more about who you actually are than any written application ever could. It filters for people willing to be real \u2014 and that vulnerability sets the tone for the whole weekend.",
  },
  {
    q: "Is this a networking event?",
    a: "God no. Networking is for guys named Chadwick who hand out business cards at funerals. This is about making actual friends with people who are interesting and kind. If you\u2019re here to collect contacts, this isn\u2019t for you.",
  },
  {
    q: "What if I\u2019m not a founder or executive?",
    a: "Good. We\u2019re not selecting for titles. Teachers, artists, scientists, writers, community organizers \u2014 some of the most interesting people at IP3 had nothing to do with startups.",
  },
];

function TestimonialBlock({
  quote,
  name,
  descriptor,
  image,
  bg = "bg-white",
}: {
  quote: string;
  name: string;
  descriptor: string;
  image: string;
  bg?: string;
}) {
  return (
    <section className={`py-16 md:py-20 ${bg}`}>
      <div className="max-w-4xl mx-auto px-6 text-center">
        <p className="text-2xl md:text-3xl lg:text-4xl text-stone-800 leading-relaxed font-serif italic">
          &ldquo;{quote}&rdquo;
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full overflow-hidden relative bg-stone-200 flex-shrink-0">
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div>
            <p className="font-semibold text-stone-900">{name}</p>
            <p className="text-sm text-stone-400">{descriptor}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnglePhotos({
  images,
}: {
  images: { src: string; alt: string; rotate: string }[];
}) {
  return (
    <div className="pt-2 pb-8 md:pt-4 md:pb-12 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 flex justify-center items-center gap-4 md:gap-8">
        {images.map((img, i) => (
          <div
            key={i}
            className={`w-56 h-40 md:w-80 md:h-56 relative rounded-lg overflow-hidden shadow-xl flex-shrink-0 ${img.rotate} ${i === 1 ? "hidden md:block translate-y-4" : ""} ${i === 2 ? "hidden lg:block -translate-y-2" : ""}`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover object-top"
              sizes="320px"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 font-bold text-lg text-stone-900 tracking-tight">
            Interesting People<sup className="text-blue-600 text-sm font-bold ml-0.5">4</sup>
          </Link>
          <div className="flex items-center gap-8">
            <Link
              href="#about"
              className="hidden md:block text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              About
            </Link>
            <Link
              href="#people"
              className="hidden md:block text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              People
            </Link>
            <Link
              href="#process"
              className="hidden md:block text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              Process
            </Link>
            <Link
              href="#faq"
              className="hidden md:block text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="/apply"
              className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-full font-medium hover:bg-blue-700 transition-all"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative w-full min-h-screen flex items-end">
        <Image
          src="/images/ip3/outdoor-gathering.jpeg"
          alt="Attendees gathered lakeside at golden hour with string lights at IP3"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 pb-12 md:pb-20 w-full">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight max-w-4xl drop-shadow-lg [text-shadow:_0_2px_20px_rgba(0,0,0,0.5)]">
            We hate
            <br />
            conferences.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl [text-shadow:_0_1px_8px_rgba(0,0,0,0.4)]">
            They&apos;re about sitting. Making awkward small talk. Bragging at the bar. Status.{" "}
            <span className="text-white font-medium">They suck.</span>{" "}
            This is not that. This is 150 people selected for{" "}
            <span className="text-blue-300 font-medium">curiosity</span>,{" "}
            <span className="text-blue-300 font-medium">depth</span>, and{" "}
            <span className="text-blue-300 font-medium">being actual humans</span>.
          </p>
          <p className="mt-6 text-sm font-medium tracking-wide text-white/60 uppercase">
            July 27&ndash;30, 2026 &middot; Victoria, Canada
          </p>
          <div className="mt-6 flex flex-col items-start gap-3">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-full font-medium text-lg hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Apply for IP4
            </Link>
            <p className="text-sm text-white/50">Limited to 150 attendees.</p>
          </div>

        </div>
      </section>

      {/* Testimonial — Shaan Puri */}
      <TestimonialBlock {...featuredTestimonials[0]} />

      {/* A Note from Andrew */}
      <section className="bg-stone-50 pt-14 md:pt-20 pb-24 md:pb-32" id="about">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-5xl font-bold text-stone-900 tracking-tight mb-4">How it all started.</h2>
            <p className="text-sm font-medium tracking-[0.15em] text-stone-400 uppercase mb-6">A note from Andrew</p>
            <div className="text-lg md:text-xl text-stone-700 leading-relaxed space-y-6">
              <p>
                In 2010, I was twenty-four, sitting at a big circular table at my first tech
                conference. Cheesy gold chairs, greyhound bus pattern cushions, hotel banquet
                hall. The VC next to me &mdash; white button-down, Patagonia vest, of course &mdash; asked
                about my startup. I told him I&apos;d bootstrapped it.
              </p>
              <p>
                &ldquo;Ah,&rdquo; he said. &ldquo;A <em>lifestyle business</em>.&rdquo;
              </p>
              <p>
                Then he turned his back on me and started talking to someone else. Left me
                sitting there, cheeks flushed, awkwardly sandwiched between two other conversations.
              </p>
              <p>
                I&apos;ve never forgotten how that felt. Being dismissed based on an arbitrary
                status game. <span className="text-stone-900 font-medium">(Also: screw that guy.)</span>
              </p>
              <p>
                So I built the opposite. Like Harvard, but instead of needing a trust
                fund and a last name that&apos;s on a building somewhere, you just need to
                be interesting and nice. No agenda. No pressure. Just 150 genuinely curious
                humans and the space to connect like actual people.
              </p>
            </div>
            <div className="mt-10 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden relative bg-stone-200 flex-shrink-0">
                <Image
                  src="/images/speakers/andrew-wilkinson.jpg"
                  alt="Andrew Wilkinson"
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div>
                <p className="font-semibold text-stone-900">Andrew Wilkinson</p>
                <p className="text-sm text-stone-400">Founder, Interesting People</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Angled photos — performances & speakers */}
      <AnglePhotos
        images={[
          { src: "/images/ip3/comedy-night-wide.jpeg", alt: "Comedy night at IP3", rotate: "-rotate-3" },
          { src: "/images/ip3/outdoor-hangout.jpeg", alt: "Outdoor hangout at IP3", rotate: "rotate-2" },
          { src: "/images/ip3/animated-conversation.jpeg", alt: "Animated conversation at IP3", rotate: "-rotate-1" },
        ]}
      />

      {/* Photo Gallery */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight mb-1">Three days. Zero laptops.</p>
          <p className="text-sm text-stone-400 mb-4">Show and tell. Comedy. Music. Incredible food. Magic (yes, literally).</p>
          <PhotoGallery />
        </div>
      </section>

      {/* Testimonial — Steph Smith */}
      <TestimonialBlock {...featuredTestimonials[1]} bg="bg-stone-50" />

      {/* Alumni Grid */}
      <section className="bg-white py-24 md:py-32" id="people">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-stone-900 tracking-tight mb-4">
            Some of our alumni.
          </h2>
          <p className="text-lg text-stone-500 max-w-2xl mb-12">
            Founders, comedians, scientists, storytellers, artists, investors. The only thing they have in common is that they&apos;re interesting.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
            {notablePeople.map((person) => (
              <div key={person.name} className="text-center group">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden mx-auto mb-3 relative bg-stone-200 ring-2 ring-transparent group-hover:ring-blue-300 transition-all">
                  <Image
                    src={person.image}
                    alt={person.name}
                    fill
                    className="object-cover grayscale"
                    sizes="96px"
                  />
                </div>
                <p className="font-semibold text-stone-900 text-sm">{person.name}</p>
                <p className="text-xs text-stone-400">{person.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Wall */}
      <section className="bg-stone-900 py-24 md:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-10 text-center">
            People rave about Interesting People.
          </h2>

          {/* Hero quote */}
          <div className="text-center mb-16">
            <p className="text-3xl md:text-4xl lg:text-5xl font-serif italic text-white/70 leading-snug max-w-3xl mx-auto">
              &ldquo;I&apos;ve been to Davos, Sun Valley, TED &mdash; this was better.&rdquo;
            </p>
            <p className="text-white/40 text-sm mt-6">
              &mdash; IP3 Attendee
            </p>
          </div>

          {/* Quote grid — 2x2, big and juicy */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-20">
            {[
              { quote: "I usually find events a waste of time, but Interesting People was the opposite.", name: "Greg Isenberg", role: "CEO, Late Checkout", image: "/images/speakers/greg-isenberg.jpg" },
              { quote: "It\u2019s rare that you go to an event where the bulk of people aren\u2019t on their phone.", name: "Jayson Gaignard", role: "Founder, Mastermind Talks", image: "/images/speakers/jayson-gaignard.avif" },
              { quote: "A great collection of smart people working on interesting things.", name: "Nick Gray", role: "Author & Founder", image: "/images/speakers/nick-gray.jpg" },
              { quote: "So many inspiring conversations, connections made, learnings and insight.", name: "Tessa McLoughlin", role: "Founder & Director, KWENCH", image: "/images/speakers/tessa-mcloughlin.avif" },
            ].map((t, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
                <p className="text-xl md:text-2xl text-white leading-relaxed mb-8">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-4">
                  {t.image ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden relative bg-stone-700 flex-shrink-0">
                      <Image
                        src={t.image}
                        alt={t.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-white/50 text-lg font-medium">{t.name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium">{t.name}</p>
                    <p className="text-white/40 text-sm">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Big stat */}
          <div className="text-center">
            <p className="text-7xl md:text-9xl font-bold text-white tracking-tight">94%</p>
            <p className="text-lg md:text-xl text-white/60 mt-4">
              of attendees said they&apos;d come back in a heartbeat.
            </p>
          </div>
        </div>
      </section>

      {/* Scarcity bar */}
      <div className="bg-blue-600 py-4">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <p className="text-white font-medium">
            Only 150 spots. Over 6,000 applications last year.
          </p>
          <Link
            href="/apply"
            className="text-sm text-blue-100 underline underline-offset-2 hover:text-white transition-colors"
          >
            Apply before it&apos;s too late &rarr;
          </Link>
        </div>
      </div>

      {/* What We Look For */}
      <section className="py-24 md:py-32 bg-stone-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-start md:gap-16 mb-16">
            <div className="md:flex-1">
              <h2 className="text-3xl md:text-5xl font-bold text-stone-900 tracking-tight mb-6">
                What gets you in.
              </h2>
              <p className="text-lg text-stone-500 mb-6">
                When we review applications, we ask one question: did this person make us
                feel warm and gooey inside?
              </p>
              <p className="text-lg text-stone-500 mb-6">
                We immediately cross people off when we see red flags like:{" "}
                <span className="text-stone-700 font-medium">&ldquo;Chief Innovation Officer.&rdquo;</span>{" "}
                <span className="text-stone-700 font-medium">&ldquo;Futurist.&rdquo;</span>{" "}
                <span className="text-stone-700 font-medium">&ldquo;Catalyst.&rdquo;</span>{" "}
                <span className="text-stone-700 font-medium">&ldquo;Change Maker.&rdquo;</span>{" "}
                And the most dreaded of all:{" "}
                <span className="text-stone-700 font-medium">&ldquo;Forbes 30 Under 30.&rdquo;</span>
              </p>
              <p className="text-lg text-stone-500">
                We&apos;re not looking for titles. We&apos;re looking for three things.
              </p>
            </div>

            {/* Fake LinkedIn card with red sharpie slashes */}
            <div className="hidden md:block md:w-72 lg:w-80 flex-shrink-0 mt-8 md:mt-4">
              <div className="relative bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden rotate-2">
                {/* LinkedIn-style header */}
                <div className="h-16 bg-gradient-to-r from-blue-700 to-blue-500" />
                <div className="px-5 pb-5">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full bg-stone-300 border-4 border-white -mt-8 mb-3 overflow-hidden relative">
                    <Image
                      src="/images/chad-worthington.jpg"
                      alt="Chad Worthington III"
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <p className="font-bold text-stone-900 text-sm">Chad Worthington III</p>
                  <p className="text-xs text-stone-500 mt-0.5">Chief Innovation Officer</p>
                  <p className="text-xs text-stone-400 mt-0.5">Forbes 30 Under 30 | TEDx Speaker</p>
                  <p className="text-xs text-stone-400">Disruptor | Thought Leader | Catalyst</p>
                  <div className="mt-3 flex gap-2">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">500+ connections</span>
                  </div>
                </div>
                {/* NOPE stamp */}
                <div className="absolute top-12 right-3 pointer-events-none">
                  <div className="border-4 border-red-600 rounded-md px-4 py-1.5 rotate-[-12deg] opacity-90">
                    <span className="text-red-600 text-2xl font-black tracking-widest uppercase">NOPE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group">
              <span className="number-accent text-5xl md:text-6xl font-bold">01</span>
              <h3 className="text-2xl font-semibold text-stone-900 mt-4 mb-4">Curiosity</h3>
              <p className="text-stone-500 leading-relaxed">
                The kind of person who makes you lean in at dinner. Who asks surprising
                questions. Who has depth, not just credentials. Who goes down rabbit
                holes for the joy of it.
              </p>
            </div>

            <div className="group">
              <span className="number-accent text-5xl md:text-6xl font-bold">02</span>
              <h3 className="text-2xl font-semibold text-stone-900 mt-4 mb-4">Generosity</h3>
              <p className="text-stone-500 leading-relaxed">
                Interesting people make others feel interesting too. They remember
                the small detail you mentioned in passing. They show up fully and
                contribute rather than spectate.
              </p>
            </div>

            <div className="group">
              <span className="number-accent text-5xl md:text-6xl font-bold">03</span>
              <h3 className="text-2xl font-semibold text-stone-900 mt-4 mb-4">Emotional Intelligence</h3>
              <p className="text-stone-500 leading-relaxed">
                People who read rooms. Who can disagree without making it personal.
                Who connect without performing. Who make the space better just by
                being in it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial — Matthew Dicks */}
      <TestimonialBlock {...featuredTestimonials[2]} />

      {/* The IP Difference — red/green treatment */}
      <section className="py-24 md:py-32 bg-stone-50 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          {/* Column headers as the heading */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-0 mb-2">
            <div className="md:pr-8 md:border-r md:border-stone-200">
              <h2 className="text-2xl md:text-3xl font-bold text-stone-400 tracking-tight">Most Conferences</h2>
            </div>
            <div className="md:pl-8">
              <h2 className="text-2xl md:text-3xl font-bold text-blue-600 tracking-tight">Interesting People</h2>
            </div>
          </div>

          <div className="space-y-0 divide-y divide-stone-200 border-t border-stone-200">
            {[
              { theirs: "Curated by status and who you know", ours: "Curated by curiosity, depth, and emotional intelligence" },
              { theirs: "Panels where one person talks, everyone else scrolls", ours: "80% of the time you\u2019re connecting, not listening" },
              { theirs: "\u201CNetworking breaks\u201D that feel like speed dating", ours: "Shared meals, walks, and activities that create real bonds" },
              { theirs: "Sad conference center buffets and rubber chicken", ours: "Chef-curated meals you\u2019ll actually talk about after" },
              { theirs: "You leave with 50 LinkedIn connections you\u2019ll ignore", ours: "You leave with 5 people you\u2019ll actually stay in touch with" },
              { theirs: "Fluorescent-lit convention centers with no windows", ours: "Beautiful venues surrounded by nature in Victoria, BC" },
              { theirs: "Optimized for sponsors and optics", ours: "Optimized for genuine human connection" },
            ].map((row, i) => (
              <div key={i} className="grid md:grid-cols-2 gap-4 md:gap-0">
                <div className="py-5 md:py-6 md:pr-8 md:border-r md:border-stone-200 flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p className="text-red-400 line-through decoration-red-300">{row.theirs}</p>
                </div>
                <div className="pb-5 md:py-6 md:pl-8 flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-stone-900 font-medium">{row.ours}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Process */}
      <section className="bg-white py-24 md:py-32" id="process">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-stone-900 tracking-tight mb-6">
            Ten minutes. That&apos;s it.
          </h2>
          <p className="text-lg text-stone-500 max-w-2xl mb-16">
            We made the bar to apply low and the bar to get in high. It&apos;s intentionally
            simple, intentionally uncomfortable, and intentionally human.
          </p>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div className="relative">
              <span className="text-6xl md:text-7xl font-bold text-blue-200 absolute -top-4 -left-2">1</span>
              <div className="relative pt-12">
                <h3 className="text-xl font-semibold text-stone-900 mb-3">Tell us who you are</h3>
                <p className="text-stone-500 leading-relaxed">
                  Your name, where you&apos;re from, and a short bio. No resume. No LinkedIn.
                  We want to know what makes you tick, not what makes you look good on paper.
                </p>
              </div>
            </div>

            <div className="relative">
              <span className="text-6xl md:text-7xl font-bold text-blue-200 absolute -top-4 -left-2">2</span>
              <div className="relative pt-12">
                <h3 className="text-xl font-semibold text-stone-900 mb-3">Record a 90-second video</h3>
                <p className="text-stone-500 leading-relaxed">
                  Three questions. 30 seconds each. One take. No do-overs. We want to
                  see the real you &mdash; how you think on your feet, not how well you
                  rehearse.
                </p>
              </div>
            </div>

            <div className="relative">
              <span className="text-6xl md:text-7xl font-bold text-blue-200 absolute -top-4 -left-2">3</span>
              <div className="relative pt-12">
                <h3 className="text-xl font-semibold text-stone-900 mb-3">We watch. We respond.</h3>
                <p className="text-stone-500 leading-relaxed">
                  A real human watches every single video. No AI screening. No keyword filters.
                  We&apos;ll email you either way &mdash; yes, no, or waitlist.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-12 border-t border-stone-200 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-full font-medium text-lg hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Your Application
            </Link>
            <p className="text-sm text-stone-400">
              Applications reviewed on a rolling basis. Apply early.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-stone-50 py-24 md:py-32" id="pricing">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-stone-900 tracking-tight mb-4">
              Pick your experience.
            </h2>
            <p className="text-lg text-stone-500 max-w-xl mx-auto">
              Every tier includes all sessions, meals, and activities. The difference is where you sleep and who you dine with.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Local */}
            <div className="bg-white rounded-2xl border border-stone-200 p-8 flex flex-col">
              <p className="text-sm font-medium tracking-[0.2em] text-stone-400 uppercase mb-2">Local</p>
              <p className="text-4xl font-bold text-stone-900 mb-2">$5,999</p>
              <p className="text-xs text-stone-400 mb-6">Victoria residents only</p>
              <p className="text-stone-500 leading-relaxed mb-6 flex-grow text-sm">
                You live here, you sleep at home. Full access to every session, meal, and activity &mdash; just no hotel room. Must have a Victoria, BC address.
              </p>
              <ul className="text-sm text-stone-600 space-y-2 mb-8">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  All sessions &amp; activities
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  All meals &amp; refreshments
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-stone-300 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  <span className="text-stone-400">No accommodation</span>
                </li>
              </ul>
              <Link
                href="/apply"
                className="inline-flex items-center justify-center px-6 py-3.5 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-all hover:scale-[1.02] active:scale-[0.98] w-full"
              >
                Apply
              </Link>
            </div>

            {/* Regular */}
            <div className="bg-white rounded-2xl border border-stone-200 p-8 flex flex-col">
              <p className="text-sm font-medium tracking-[0.2em] text-stone-400 uppercase mb-2">Regular</p>
              <p className="text-4xl font-bold text-stone-900 mb-2">$9,999</p>
              <p className="text-xs text-stone-400 mb-6">The full experience</p>
              <p className="text-stone-500 leading-relaxed mb-6 flex-grow text-sm">
                Three days, all-in. Luxury accommodations, every meal, every session, every late-night conversation.
              </p>
              <ul className="text-sm text-stone-600 space-y-2 mb-8">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  All sessions &amp; activities
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  All meals &amp; refreshments
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Luxury accommodations
                </li>
              </ul>
              <Link
                href="/apply"
                className="inline-flex items-center justify-center px-6 py-3.5 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-all hover:scale-[1.02] active:scale-[0.98] w-full"
              >
                Apply Now
              </Link>
            </div>

            {/* VIP */}
            <div className="bg-white rounded-2xl border-2 border-blue-500 p-8 flex flex-col relative">
              <span className="absolute -top-3 left-8 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                The Full Treatment
              </span>
              <p className="text-sm font-medium tracking-[0.2em] text-blue-600 uppercase mb-2">VIP</p>
              <p className="text-4xl font-bold text-stone-900 mb-2">$15,999</p>
              <p className="text-xs text-stone-400 mb-6">Limited to 20 guests</p>
              <p className="text-stone-500 leading-relaxed mb-6 flex-grow text-sm">
                Everything in Regular, elevated. Best room, black car, front-row seats, a private dinner with speakers, and a personal concierge you can text anytime to handle whatever you need.
              </p>
              <ul className="text-sm text-stone-600 space-y-2 mb-8">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Everything in Regular
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                  Upgraded suite
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                  Black car airport transfer
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                  Dedicated front-row seating
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                  Private dinner with speakers &amp; Andrew
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                  24/7 personal text concierge
                </li>
              </ul>
              <Link
                href="/apply"
                className="inline-flex items-center justify-center px-6 py-3.5 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] w-full"
              >
                Apply for VIP
              </Link>
            </div>
          </div>

          {/* Scholarship bar */}
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-stone-900">
                Interesting but broke?
              </p>
              <p className="text-sm text-stone-500 mt-1">
                We set aside spots for artists, comedians, musicians, and creatives who&apos;d make the event better but can&apos;t swing the price tag. No shame, just a different application.
              </p>
            </div>
            <Link
              href="/apply"
              className="inline-flex items-center justify-center px-6 py-3 bg-amber-500 text-white rounded-full font-medium text-sm hover:bg-amber-600 transition-all whitespace-nowrap flex-shrink-0"
            >
              Apply for a Scholarship
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 md:py-32 bg-white" id="faq">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-stone-900 tracking-tight mb-16">
            Questions we hear a lot.
          </h2>

          <div className="space-y-0">
            {faqs.map((faq, i) => (
              <details key={i} className="group border-b border-stone-200">
                <summary className="flex items-center justify-between py-6 cursor-pointer list-none">
                  <h3 className="text-lg font-medium text-stone-900 pr-8">{faq.q}</h3>
                  <svg
                    className="w-5 h-5 text-blue-500 flex-shrink-0 transition-transform group-open:rotate-45"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </summary>
                <p className="pb-6 text-stone-500 leading-relaxed pr-12">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-100 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <p className="text-lg font-bold text-stone-900 mb-1">
                Interesting People<sup className="text-blue-600 text-xs ml-0.5">4</sup>
              </p>
              <p className="text-sm text-stone-400">
                A gathering for the genuinely curious.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <Link href="/apply" className="text-stone-500 hover:text-stone-900 transition-colors">
                Apply
              </Link>
              <Link href="/privacy" className="text-stone-500 hover:text-stone-900 transition-colors">
                Privacy
              </Link>
              <Link href="#about" className="text-stone-500 hover:text-stone-900 transition-colors">
                About
              </Link>
              <Link href="#faq" className="text-stone-500 hover:text-stone-900 transition-colors">
                FAQ
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-stone-100 text-sm text-stone-400">
            Applications reviewed on a rolling basis. We respond to everyone.
          </div>
        </div>
      </footer>
    </main>
  );
}
