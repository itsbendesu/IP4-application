"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "info" | "verification";

export default function ApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("info");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    location: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    bio: "",
    links: [""],
    // Honeypot field - bots will fill this
    website: "",
  });

  const [consentGiven, setConsentGiven] = useState(false);

  const [verificationCode, setVerificationCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const updateField = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateLink = (index: number, value: string) => {
    const newLinks = [...formData.links];
    newLinks[index] = value;
    setFormData((prev) => ({ ...prev, links: newLinks }));
  };

  const addLink = () => {
    if (formData.links.length < 5) {
      setFormData((prev) => ({ ...prev, links: [...prev.links, ""] }));
    }
  };

  const removeLink = (index: number) => {
    const newLinks = formData.links.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, links: newLinks.length ? newLinks : [""] }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required";
    if (!formData.email.trim() || !formData.email.includes("@")) return "Valid email is required";
    if (!formData.location.trim()) return "Location is required";
    if (!formData.bio.trim() || formData.bio.length < 10) return "Bio must be at least 10 characters";
    if (formData.bio.length > 500) return "Bio must be under 500 characters";

    // Validate links if provided
    const nonEmptyLinks = formData.links.filter((l) => l.trim());
    for (const link of nonEmptyLinks) {
      try {
        new URL(link);
      } catch {
        return "Please enter valid URLs for all links";
      }
    }

    if (!consentGiven) return "You must agree to the privacy policy to continue";

    return null;
  };

  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const validLinks = formData.links.filter((l) => l.trim());

      const res = await fetch("/api/apply/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          location: formData.location,
          timezone: formData.timezone,
          bio: formData.bio,
          links: validLinks.length ? validLinks : undefined,
          website: formData.website, // Honeypot
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start application");
      }

      setToken(data.token);
      setEmail(formData.email);

      if (data.requiresVerification) {
        setStep("verification");
      } else {
        // No verification needed, go straight to upload
        router.push(`/upload/${data.token}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/apply/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          code: verificationCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      // Verified! Go to upload page
      router.push(`/upload/${token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!token || resendCooldown > 0) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/apply/verify", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to resend code");
      }

      // Start cooldown
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl font-bold text-slate-900 tracking-tight">
            IP4
          </Link>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className={`flex items-center gap-2 ${step === "info" ? "text-slate-900 font-medium" : ""}`}>
              <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-medium ${step === "info" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"}`}>
                1
              </span>
              <span className="hidden sm:inline">Your Info</span>
            </span>
            <div className="w-8 h-px bg-slate-200" />
            <span className={`flex items-center gap-2 ${step === "verification" ? "text-slate-900 font-medium" : ""}`}>
              <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-medium ${step === "verification" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"}`}>
                2
              </span>
              <span className="hidden sm:inline">Verify</span>
            </span>
            <div className="w-8 h-px bg-slate-200" />
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-xs flex items-center justify-center text-slate-400 font-medium">
                3
              </span>
              <span className="hidden sm:inline">Record</span>
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <div className="grid md:grid-cols-[1fr,320px] gap-12 md:gap-16">
          {/* Main form column */}
          <div>
            <div className="mb-10">
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-3">
                {step === "info" ? "Tell us about yourself." : "Verify your email."}
              </h1>
              <p className="text-slate-500 text-lg">
                {step === "info"
                  ? "No resume, no LinkedIn. We want to know what makes you interesting."
                  : "Check your inbox for a 6-digit code."}
              </p>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="bg-white">
              {step === "info" && (
                <form onSubmit={handleSubmitInfo} className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-shadow bg-white"
                        placeholder="Jane Smith"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-shadow bg-white"
                        placeholder="jane@example.com"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => updateField("location", e.target.value)}
                          className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-shadow bg-white"
                          placeholder="San Francisco, CA"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Timezone
                        </label>
                        <input
                          type="text"
                          value={formData.timezone}
                          readOnly
                          className="w-full px-4 py-3.5 border border-slate-100 rounded-xl bg-slate-50 text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100" />

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Short Bio
                    </label>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-slate-500">
                        What makes you tick? What are you curious about? Skip the job title.
                      </p>
                      <span className="text-xs text-slate-400 font-mono ml-4 flex-shrink-0">
                        {formData.bio.length}/500
                      </span>
                    </div>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => updateField("bio", e.target.value)}
                      rows={4}
                      maxLength={500}
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-shadow resize-none bg-white"
                      placeholder="I spend my weekends building mechanical keyboards and arguing about which pizza style is best..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Links
                      <span className="text-slate-400 font-normal ml-2">(optional)</span>
                    </label>
                    <p className="text-sm text-slate-500 mb-3">
                      Personal site, blog, projects&mdash;not LinkedIn.
                    </p>
                    {formData.links.map((link, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input
                          type="url"
                          value={link}
                          onChange={(e) => updateLink(i, e.target.value)}
                          className="flex-1 px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-shadow bg-white"
                          placeholder="https://..."
                        />
                        {formData.links.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLink(i)}
                            className="px-3 py-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    {formData.links.length < 5 && (
                      <button
                        type="button"
                        onClick={addLink}
                        className="text-sm text-slate-500 hover:text-slate-900 transition-colors mt-1"
                      >
                        + Add another link
                      </button>
                    )}
                  </div>

                  {/* Honeypot field - hidden from users, bots will fill it */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input
                      type="text"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={(e) => updateField("website", e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  <div className="h-px bg-slate-100" />

                  {/* Privacy consent checkbox */}
                  <label className="flex items-start gap-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      className="mt-0.5 h-5 w-5 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                    />
                    <span className="text-sm text-slate-500 leading-relaxed">
                      I understand that my video will be reviewed by the selection team and agree to the{" "}
                      <Link
                        href="/privacy"
                        target="_blank"
                        className="text-slate-900 hover:underline font-medium"
                      >
                        Privacy Policy
                      </Link>
                      , including how my data and video submission will be handled.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-4 bg-slate-900 text-white rounded-full font-medium text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {loading ? "Submitting..." : "Continue to Video"}
                  </button>
                </form>
              )}

              {step === "verification" && (
                <form onSubmit={handleVerify} className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5">
                      <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-slate-600">
                      We sent a 6-digit code to <strong className="text-slate-900">{email}</strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full px-4 py-4 text-center text-2xl tracking-[0.5em] border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none font-mono"
                      placeholder="000000"
                      maxLength={6}
                      autoFocus
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || verificationCode.length !== 6}
                    className="w-full px-6 py-4 bg-slate-900 text-white rounded-full font-medium text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? "Verifying..." : "Verify Email"}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={loading || resendCooldown > 0}
                      className="text-sm text-slate-500 hover:text-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : "Didn't receive a code? Resend"}
                    </button>
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("info");
                        setToken(null);
                        setVerificationCode("");
                        setError(null);
                      }}
                      className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      &larr; Go back and edit your info
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden md:block">
            <div className="sticky top-24 space-y-8">
              {/* What to expect */}
              <div className="bg-slate-50 rounded-2xl p-6">
                <h3 className="font-semibold text-slate-900 text-sm mb-4">What happens next</h3>
                <ol className="space-y-4 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-medium">1</span>
                    <span className="text-slate-600">Fill out this form</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                    <span className="text-slate-500">Verify your email</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                    <span className="text-slate-500">Record a 90-second video</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-5 h-5 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-xs font-medium">4</span>
                    <span className="text-slate-500">We review &amp; respond</span>
                  </li>
                </ol>
              </div>

              {/* Tip */}
              <div className="border border-slate-200 rounded-2xl p-6">
                <h3 className="font-semibold text-slate-900 text-sm mb-3">A word of advice</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Write your bio like you&apos;re telling a friend what you&apos;re into right now&mdash;not
                  like you&apos;re updating a professional profile. We care about what
                  lights you up.
                </p>
              </div>

              {/* Quote */}
              <div className="relative">
                <svg className="w-6 h-6 text-slate-200 mb-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-sm text-slate-500 leading-relaxed italic">
                  &ldquo;The application process itself told me this wasn&apos;t going to be
                  another boring conference. I was nervous recording my video, and
                  that&apos;s exactly why it worked.&rdquo;
                </p>
                <p className="text-xs text-slate-400 mt-3">
                  &mdash; Priya R., IP3 Attendee
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
