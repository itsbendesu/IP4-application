"use client";

import Link from "next/link";
import { useState } from "react";

const ACTUAL_COST = { hotel: 4500, local: 3000 };

const PRICING = {
  hotel: { min: 4500, max: 20000 },
  local: { min: 3000, max: 20000 },
};

const SCHOLARSHIP_DESCRIPTIONS = [
  "a young creative who couldn't otherwise afford to be here",
  "an emerging artist or builder who'd never get this chance",
  "someone early in their career who belongs in the room",
  "a creator who'll remember this weekend for the rest of their life",
];

function getDescription(index: number) {
  return SCHOLARSHIP_DESCRIPTIONS[index % SCHOLARSHIP_DESCRIPTIONS.length];
}

function getSliderLabel(value: number, type: "hotel" | "local") {
  const cost = ACTUAL_COST[type];
  const pct = value / cost;
  if (pct <= 1.02) return "Our cost";
  if (pct < 1.3) return "Chipping in a bit extra";
  if (pct < 1.7) return "Someone else gets to be there because of you";
  if (pct < 2.5) return "Filling the room with people who belong here";
  return "This is seriously generous";
}

function formatPrice(amount: number) {
  return "$" + amount.toLocaleString("en-US");
}

type Step = "pricing" | "form" | "submitted";

export default function FriendsPage() {
  const [type, setType] = useState<"hotel" | "local">("hotel");
  const cost = PRICING[type].min;
  const max = PRICING[type].max;
  const [hotelValue, setHotelValue] = useState(PRICING.hotel.min);
  const [localValue, setLocalValue] = useState(PRICING.local.min);
  const [step, setStep] = useState<Step>("pricing");

  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    teachSkill: "",
    socials: { instagram: "", x: "", tiktok: "", youtube: "", linkedin: "", website: "" },
  });

  const normalizeSocialUrl = (platform: string, value: string): string => {
    const v = value.trim();
    if (!v) return "";
    if (/^https?:\/\//i.test(v)) return v;
    if (v.includes(".")) return `https://${v}`;
    const handle = v.replace(/^@/, "");
    const bases: Record<string, string> = {
      instagram: `https://instagram.com/${handle}`,
      x: `https://x.com/${handle}`,
      tiktok: `https://tiktok.com/@${handle}`,
      youtube: `https://youtube.com/@${handle}`,
      linkedin: `https://linkedin.com/in/${handle}`,
      website: `https://${v}`,
    };
    return bases[platform] || `https://${v}`;
  };
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = type === "hotel" ? hotelValue : localValue;
  const setValue = type === "hotel" ? setHotelValue : setLocalValue;
  const pct = ((value - cost) / (max - cost)) * 100;
  const sliderLabel = getSliderLabel(value, type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/apply/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          bio: form.bio,
          teachSkill: form.teachSkill || undefined,
          links: Object.entries(form.socials)
            .filter(([, v]) => v.trim())
            .map(([platform, value]) => normalizeSocialUrl(platform, value)),
          ticketType: type === "hotel" ? "friends-hotel" : "friends-local",
          amount: value,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setStep("submitted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1 font-bold text-lg text-stone-900 tracking-tight"
          >
            Interesting People
            <sup className="text-blue-600 text-sm font-bold">4</sup>
          </Link>
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="hidden md:block text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              Home
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
      {step !== "submitted" && (
      <section className="pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-sm font-medium tracking-[0.15em] text-blue-600 uppercase mb-4">
            Friends & Family
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-stone-900 tracking-tight leading-[1.1] mb-6">
            You&apos;re one of Andrew&apos;s people.
          </h1>
          <div className="text-lg md:text-xl text-stone-600 leading-relaxed space-y-4">
            <p>
              If you&apos;re here, Andrew personally invited you to IP4. That
              means you&apos;re already in — no application, no video, no hoops.
            </p>
            <p>
              Pick what feels right for you — whether that&apos;s covering our
              cost or chipping in extra so we can offer more scholarship spots
              to artists and creatives who can&apos;t afford the ticket. All
              prices are in US dollars.
            </p>
          </div>
        </div>
      </section>
      )}

      {/* Main Content */}
      <section className={`pb-24 md:pb-32 ${step === "submitted" ? "pt-32 md:pt-40" : ""}`}>
        <div className="max-w-2xl mx-auto px-6">
          {/* ── STEP: PRICING ── */}
          {step === "pricing" && (
            <>
              {/* Hotel Toggle */}
              <div className="flex justify-center mb-10">
                <div className="inline-flex bg-stone-100 rounded-full p-1">
                  <button
                    onClick={() => setType("hotel")}
                    className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                      type === "hotel"
                        ? "bg-white text-stone-900 shadow-sm"
                        : "text-stone-500 hover:text-stone-700"
                    }`}
                  >
                    I need a hotel
                  </button>
                  <button
                    onClick={() => setType("local")}
                    className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                      type === "local"
                        ? "bg-white text-stone-900 shadow-sm"
                        : "text-stone-500 hover:text-stone-700"
                    }`}
                  >
                    I&apos;m local
                  </button>
                </div>
              </div>

              {/* Slider Section */}
              <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
                <p className="text-xs font-medium tracking-[0.2em] text-stone-400 uppercase mb-2">
                  Choose your price
                </p>
                <p className="text-sm text-stone-500 mb-8">
                  Slide to whatever feels right. No judgement.
                </p>

                {/* Big Price Display */}
                <div className="text-center mb-8">
                  <p className="text-5xl md:text-7xl font-bold text-stone-900 tracking-tight tabular-nums">
                    {formatPrice(value)}{" "}
                    <span className="text-xs font-medium tracking-[0.2em] text-stone-400 uppercase">
                      USD
                    </span>
                  </p>
                  <p className="text-sm text-blue-600 font-medium mt-2">
                    {sliderLabel}
                  </p>
                </div>

                {/* Slider with tick marks */}
                <div className="relative mb-4">
                  <input
                    type="range"
                    min={cost}
                    max={max}
                    step={100}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full h-2 bg-stone-200 rounded-full appearance-none cursor-pointer slider-thumb"
                    style={{
                      background: `linear-gradient(to right, #2563eb ${pct}%, #e7e5e4 ${pct}%)`,
                    }}
                  />
                  {/* Tick marks for each additional scholarship */}
                  {Array.from({
                    length: Math.floor((max - cost) / cost),
                  }).map((_, i) => {
                    const tickValue = cost * (i + 2); // +2 because first cost is the seat itself
                    const tickPct =
                      ((tickValue - cost) / (max - cost)) * 100;
                    const scholarshipNum = i + 1;
                    const isActive = value >= tickValue;
                    return (
                      <div
                        key={i}
                        className="absolute top-0 flex flex-col items-center pointer-events-none"
                        style={{
                          left: `${tickPct}%`,
                          transform: "translateX(-50%)",
                        }}
                      >
                        <div
                          className={`w-px h-5 ${
                            isActive ? "bg-blue-400" : "bg-stone-300"
                          }`}
                        />
                        <span
                          className={`text-[10px] mt-0.5 whitespace-nowrap ${
                            isActive ? "text-blue-500" : "text-stone-400"
                          }`}
                        >
                          +{scholarshipNum}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between mt-5">
                    <span className="text-xs text-stone-400">
                      {formatPrice(cost)}
                    </span>
                    <span className="text-xs text-stone-400">
                      {formatPrice(max)}
                    </span>
                  </div>
                </div>

                {/* Scholarship impact */}
                {value > cost &&
                  (() => {
                    const aboveCost = value - cost;
                    const scholarshipsFloat = aboveCost / cost;
                    const fullScholarships = Math.floor(scholarshipsFloat);
                    const partialPct = Math.round(
                      (scholarshipsFloat - fullScholarships) * 100
                    );
                    const totalPeople =
                      fullScholarships + (partialPct > 0 ? 1 : 0);

                    return (
                      <div className="mt-6 rounded-xl px-5 py-5 text-center bg-emerald-50 border border-emerald-200 transition-colors duration-300">
                        {/* Person icons */}
                        {totalPeople > 0 && (
                          <div className="flex items-center justify-center gap-2 mb-3">
                            {Array.from({
                              length: Math.min(totalPeople, 4),
                            }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                  i < fullScholarships
                                    ? "bg-emerald-500 text-white scale-100"
                                    : "bg-emerald-200 text-emerald-600 scale-95"
                                }`}
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                </svg>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Description */}
                        <p className="text-sm text-emerald-800 leading-relaxed">
                          Your seat is covered. The extra{" "}
                          <strong>{formatPrice(aboveCost)}</strong>{" "}
                          {fullScholarships >= 2
                            ? `puts ${fullScholarships} young creatives in the room who wouldn't be here without you.`
                            : fullScholarships === 1
                              ? `puts ${getDescription(0)} in the room.`
                              : `goes toward bringing ${getDescription(0)} into the room.`}
                        </p>

                        <p className="text-lg font-bold text-emerald-700 mt-2">
                          {fullScholarships >= 1
                            ? `${fullScholarships} seat${fullScholarships > 1 ? "s" : ""} funded${partialPct > 0 ? ", working on another" : ""}`
                            : "Working toward a full seat"}
                        </p>
                      </div>
                    );
                  })()}

                {/* CTA */}
                <div className="mt-8">
                  <button
                    onClick={() => setStep("form")}
                    className="inline-flex items-center justify-center w-full px-8 py-4 bg-blue-600 text-white rounded-full font-medium text-lg hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Continue — {formatPrice(value)}
                  </button>
                  <p className="text-xs text-stone-400 text-center mt-3">
                    You&apos;ll fill out a short form next. No video required.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ── STEP: FORM ── */}
          {step === "form" && (
            <>
              {/* Selected price summary */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8 flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">
                    {type === "hotel" ? "With Hotel" : "Local (No Hotel)"}
                  </p>
                  <p className="text-2xl font-bold text-stone-900 tabular-nums">
                    {formatPrice(value)}
                  </p>
                </div>
                <button
                  onClick={() => setStep("pricing")}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Change
                </button>
              </div>

              {/* Registration Form */}
              <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
                <p className="text-xs font-medium tracking-[0.2em] text-stone-400 uppercase mb-2">
                  Almost there
                </p>
                <p className="text-sm text-stone-500 mb-8">
                  Just the basics so we know who&apos;s coming.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      Phone
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      About you
                    </label>
                    <textarea
                      required
                      value={form.bio}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, bio: e.target.value }))
                      }
                      rows={3}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                      placeholder="What do you do? What are you into? A sentence or two is fine."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      A skill I&apos;d be open to sharing with or teaching the group{" "}
                      <span className="text-stone-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.teachSkill}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, teachSkill: e.target.value }))
                      }
                      maxLength={300}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="e.g. Improv comedy, close-up magic, how to tell a story that lands"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      Social profiles{" "}
                      <span className="text-stone-400 font-normal">
                        (optional — share at least one so we can get to know you)
                      </span>
                    </label>
                    <div className="space-y-2">
                      {([
                        { key: "instagram", label: "Instagram", placeholder: "yourhandle" },
                        { key: "x", label: "X (Twitter)", placeholder: "yourhandle" },
                        { key: "linkedin", label: "LinkedIn", placeholder: "yourhandle" },
                        { key: "tiktok", label: "TikTok", placeholder: "yourhandle" },
                        { key: "youtube", label: "YouTube", placeholder: "yourchannel" },
                        { key: "website", label: "Website", placeholder: "yoursite.com" },
                      ] as const).map((platform) => (
                        <div key={platform.key} className="flex items-center gap-3">
                          <span className="text-sm text-stone-500 w-24 flex-shrink-0">{platform.label}</span>
                          <input
                            type="text"
                            value={form.socials[platform.key]}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, socials: { ...f.socials, [platform.key]: e.target.value } }))
                            }
                            className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                            placeholder={platform.placeholder}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center w-full px-8 py-4 bg-blue-600 text-white rounded-full font-medium text-lg hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {submitting
                      ? "Registering..."
                      : `Register — ${formatPrice(value)}`}
                  </button>
                </form>
              </div>
            </>
          )}

          {/* ── STEP: SUBMITTED ── */}
          {step === "submitted" && (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 md:p-12 shadow-sm text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-3">
                You&apos;re on the list.
              </h2>
              <p className="text-stone-500 leading-relaxed max-w-md mx-auto mb-2">
                We&apos;ve got your details. We&apos;ll be in touch
                with next steps and payment info.
              </p>
              {value > cost && (
                <p className="text-sm text-emerald-600 font-medium mb-2">
                  Thank you for contributing an extra{" "}
                  {formatPrice(value - cost)} toward scholarships.
                </p>
              )}
              <p className="text-sm text-stone-400">
                July 27–30, 2026 &middot; Victoria, Canada
              </p>
            </div>
          )}

          {/* What's included — show on pricing and form steps */}
          {step !== "submitted" && (
            <div className="mt-10 bg-stone-50 rounded-2xl border border-stone-200 p-8">
              <p className="text-xs font-medium tracking-[0.2em] text-stone-400 uppercase mb-5">
                What&apos;s included
              </p>
              <ul className="space-y-3">
                {[
                  "All sessions, workshops & activities",
                  "All food, drinks & transportation for 3 days",
                  "Comedy night, storytelling, magic",
                  "Curated dinner groups (skip the small talk)",
                  "Lake swims, late-night conversations, new friendships",
                  ...(type === "hotel"
                    ? ["3 nights luxury accommodation"]
                    : []),
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-stone-600"
                  >
                    <svg
                      className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-100 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <p className="text-lg font-bold text-stone-900 mb-1">
                Interesting People
                <sup className="text-blue-600 text-xs">4</sup>
              </p>
              <p className="text-sm text-stone-400">
                A gathering for the genuinely curious.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <Link
                href="/"
                className="text-stone-500 hover:text-stone-900 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/privacy"
                className="text-stone-500 hover:text-stone-900 transition-colors"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom slider styles */}
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: 4px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(37, 99, 235, 0.1);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3),
            0 0 0 1px rgba(37, 99, 235, 0.2);
        }
        .slider-thumb::-webkit-slider-thumb:active {
          transform: scale(1.1);
        }
        .slider-thumb::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: 4px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2),
            0 0 0 1px rgba(37, 99, 235, 0.1);
        }
      `}</style>
    </main>
  );
}
