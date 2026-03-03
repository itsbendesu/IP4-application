"use client";

import Link from "next/link";
import { useState } from "react";

const COSTS = {
  hotel: {
    label: "With Hotel",
    items: [
      { name: "Hotel (3 nights)", amount: 2300 },
      { name: "Food & drink", amount: 800 },
      { name: "Programming & entertainment", amount: 500 },
      { name: "Operations & logistics", amount: 400 },
    ],
    regularPrice: 9999,
  },
  local: {
    label: "No Hotel (Local)",
    items: [
      { name: "Food & drink", amount: 1100 },
      { name: "Programming & entertainment", amount: 700 },
      { name: "Operations & logistics", amount: 600 },
    ],
    regularPrice: 5999,
  },
};

function getCostTotal(type: "hotel" | "local") {
  return COSTS[type].items.reduce((sum, item) => sum + item.amount, 0);
}

function getSliderLabel(value: number, min: number, max: number) {
  const pct = (value - min) / (max - min);
  if (pct <= 0.05) return "Cover our costs";
  if (pct <= 0.35) return "Chip in a bit extra";
  if (pct <= 0.65) return "Meet us in the middle";
  if (pct <= 0.85) return "Almost full price";
  return "Full ticket price";
}

function formatPrice(amount: number) {
  return "$" + amount.toLocaleString("en-US");
}

type Step = "pricing" | "form" | "submitted";

export default function FriendsPage() {
  const [type, setType] = useState<"hotel" | "local">("hotel");
  const cost = getCostTotal(type);
  const max = COSTS[type].regularPrice;
  const [hotelValue, setHotelValue] = useState(getCostTotal("hotel"));
  const [localValue, setLocalValue] = useState(getCostTotal("local"));
  const [step, setStep] = useState<Step>("pricing");

  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    link: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = type === "hotel" ? hotelValue : localValue;
  const setValue = type === "hotel" ? setHotelValue : setLocalValue;
  const pct = ((value - cost) / (max - cost)) * 100;
  const sliderLabel = getSliderLabel(value, cost, max);

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
          links: form.link ? [form.link] : [],
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
            <sup className="text-blue-600 text-sm font-bold ml-0.5">4</sup>
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
              If you&apos;re here, Andrew personally invited you to IP4. That means you&apos;re
              already in — no application, no video, no hoops.
            </p>
            <p>
              We want to be totally transparent about what this event costs to put on.
              Below is the actual per-person cost breakdown.
            </p>
            <p>
              Pick what feels right for
              you — whether that&apos;s covering our costs or chipping in extra so we can
              offer more scholarship spots to artists and creatives who can&apos;t afford
              the ticket.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-24 md:pb-32">
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

              {/* Cost Breakdown Card */}
              <div className="bg-stone-50 rounded-2xl border border-stone-200 p-8 mb-10">
                <p className="text-xs font-medium tracking-[0.2em] text-stone-400 uppercase mb-5">
                  What it actually costs us per person
                </p>
                <div className="space-y-3">
                  {COSTS[type].items.map((item) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span className="text-stone-600">{item.name}</span>
                      <span className="text-stone-900 font-medium tabular-nums">
                        {formatPrice(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-stone-200 flex justify-between items-center">
                  <span className="font-semibold text-stone-900">Our cost</span>
                  <span className="text-xl font-bold text-stone-900 tabular-nums">
                    {formatPrice(cost)}
                  </span>
                </div>
                  </div>

              {/* Slider Section */}
              <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
                <p className="text-xs font-medium tracking-[0.2em] text-stone-400 uppercase mb-2">
                  Choose your price
                </p>
                <p className="text-sm text-stone-500 mb-8">
                  Slide to whatever feels right. No judgement, no guilt.
                </p>

                {/* Big Price Display */}
                <div className="text-center mb-8">
                  <p className="text-5xl md:text-7xl font-bold text-stone-900 tracking-tight tabular-nums">
                    {formatPrice(value)}
                  </p>
                  <p className="text-sm text-blue-600 font-medium mt-2">{sliderLabel}</p>
                </div>

                {/* Slider */}
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
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-stone-400">{formatPrice(cost)}</span>
                    <span className="text-xs text-stone-400">{formatPrice(max)}</span>
                  </div>
                </div>

                {/* Scholarship nudge */}
                {value > cost + (max - cost) * 0.5 && (
                  <p className="text-sm text-stone-500 text-center mt-6 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    Extra above our cost goes toward scholarship spots for
                    artists &amp; creatives who can&apos;t afford a ticket.
                  </p>
                )}

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
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
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
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
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
                      onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                      placeholder="What do you do? What are you into? A sentence or two is fine."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      Website or social link{" "}
                      <span className="text-stone-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="url"
                      value={form.link}
                      onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="https://..."
                    />
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
                    {submitting ? "Registering..." : `Register — ${formatPrice(value)}`}
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-3">
                You&apos;re on the list.
              </h2>
              <p className="text-stone-500 leading-relaxed max-w-md mx-auto mb-2">
                We&apos;ve got your details. Andrew&apos;s team will be in touch with
                next steps and payment info.
              </p>
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
                  "Every meal & drink for 3 days",
                  "Comedy night, storytelling, magic",
                  "Curated dinner groups (skip the small talk)",
                  "Lake swims, late-night conversations, new friendships",
                  ...(type === "hotel" ? ["3 nights luxury accommodation"] : []),
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-stone-600">
                    <svg
                      className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
                <sup className="text-blue-600 text-xs ml-0.5">4</sup>
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
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(37, 99, 235, 0.1);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3), 0 0 0 1px rgba(37, 99, 235, 0.2);
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
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(37, 99, 235, 0.1);
        }
      `}</style>
    </main>
  );
}
