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
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Apply to Join</h1>
          <p className="text-gray-600">
            {step === "info"
              ? "Tell us about yourself. No resume, no LinkedIn - just you."
              : "Check your email for a verification code."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          {step === "info" && (
            <form onSubmit={handleSubmitInfo} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Jane Smith"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="jane@example.com"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="San Francisco, CA"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={formData.timezone}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Bio * <span className="text-gray-400 font-normal">({formData.bio.length}/500)</span>
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  What makes you tick? What are you curious about? Skip the job title.
                </p>
                <textarea
                  value={formData.bio}
                  onChange={(e) => updateField("bio", e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="I spend my weekends building mechanical keyboards and arguing about which pizza style is best..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Links <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  Personal site, blog, projects - not LinkedIn.
                </p>
                {formData.links.map((link, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => updateLink(i, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://..."
                    />
                    {formData.links.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLink(i)}
                        className="px-3 py-2 text-gray-400 hover:text-red-500"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
                {formData.links.length < 5 && (
                  <button
                    type="button"
                    onClick={addLink}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
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

              {/* Privacy consent checkbox */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">
                    I understand that my video will be reviewed by the selection team and agree to the{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-indigo-600 hover:text-indigo-700 underline"
                    >
                      Privacy Policy
                    </Link>
                    , including how my data and video submission will be handled.
                  </span>
                </label>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Submitting..." : "Continue to Video"}
                </button>
                <p className="text-center text-sm text-gray-500 mt-3">
                  You&apos;ll record a 90-second video response next
                </p>
              </div>
            </form>
          )}

          {step === "verification" && (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
                <p className="text-gray-600">
                  We sent a 6-digit code to <strong>{email}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify Email"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading || resendCooldown > 0}
                  className="text-sm text-indigo-600 hover:text-indigo-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Didn't receive a code? Resend"}
                </button>
              </div>

              <div className="pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setStep("info");
                    setToken(null);
                    setVerificationCode("");
                    setError(null);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  &larr; Go back and edit your info
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
