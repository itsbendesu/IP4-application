"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";

type Step = "basics" | "questions" | "story" | "verification" | "record" | "confirmation";

interface Prompt {
  id: string;
  text: string;
}

interface ApplicationData {
  id: string;
  name: string;
  email: string;
  prompts: Prompt[];
  expiresAt: string;
}

export default function ApplyPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<Step>("basics");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    ticketType: "" as "" | "local" | "regular" | "vip",
    address: "",
    localSwear: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    heardAbout: "",
    priorEvents: false,
    priorEventsWhich: [] as string[],
    threeWords: "",
    bio: "",
    socials: {
      instagram: "",
      x: "",
      tiktok: "",
      youtube: "",
      website: "",
    },
    projectLinks: [""],
    // Honeypot field - bots will fill this
    website: "",
  });

  const [consentGiven, setConsentGiven] = useState(false);

  const [verificationCode, setVerificationCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Recording state
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  // Recording refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);

  const MAX_DURATION = 90;
  const PROMPT_DURATION = 30;

  // Lock body scroll and handle Escape key when modal is open
  useEffect(() => {
    if (!modalOpen) return;

    document.body.style.overflow = "hidden";

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (step === "confirmation") {
          setModalOpen(false);
        } else if (step === "basics" && !formData.name && !formData.email.trim()) {
          setModalOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [modalOpen, step, formData.name, formData.email]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stream]);

  // Attach stream to video element when stream changes
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const updateField = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const normalizeSocialUrl = (platform: string, value: string): string => {
    const v = value.trim();
    if (!v) return "";
    // Already a full URL
    if (/^https?:\/\//i.test(v)) return v;
    // Has a domain (e.g. www.instagram.com/handle or instagram.com/handle)
    if (v.includes(".")) return `https://${v}`;
    // Bare handle — build platform URL
    const handle = v.replace(/^@/, "");
    const bases: Record<string, string> = {
      instagram: `https://instagram.com/${handle}`,
      x: `https://x.com/${handle}`,
      tiktok: `https://tiktok.com/@${handle}`,
      youtube: `https://youtube.com/@${handle}`,
      website: `https://${v}`,
    };
    return bases[platform] || `https://${v}`;
  };

  const updateSocial = (platform: string, value: string) => {
    setFormData((prev) => ({ ...prev, socials: { ...prev.socials, [platform]: value } }));
  };

  const updateProjectLink = (index: number, value: string) => {
    const newLinks = [...formData.projectLinks];
    newLinks[index] = value;
    setFormData((prev) => ({ ...prev, projectLinks: newLinks }));
  };

  const addProjectLink = () => {
    if (formData.projectLinks.length < 5) {
      setFormData((prev) => ({ ...prev, projectLinks: [...prev.projectLinks, ""] }));
    }
  };

  const removeProjectLink = (index: number) => {
    const newLinks = formData.projectLinks.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, projectLinks: newLinks.length ? newLinks : [""] }));
  };

  const validateStep = (s: Step) => {
    if (s === "basics") {
      if (!formData.name.trim()) return "Name is required";
      if (!formData.email.trim() || !formData.email.includes("@")) return "Valid email is required";
      if (!formData.phone.trim()) return "Phone number is required";
      if (!formData.ticketType) return "Please select a ticket type";
      if (formData.ticketType === "local" && !formData.address.trim()) return "Address is required for Local tickets";
      if (formData.ticketType === "local" && !formData.localSwear) return "Please confirm you live in Victoria";
    }
    if (s === "questions") {
      if (!formData.heardAbout.trim()) return "Please tell us how you heard about IP";
      if (!formData.threeWords.trim()) return "Please describe yourself in 3 words";
    }
    if (s === "story") {
      if (!formData.bio.trim() || formData.bio.length < 10) return "Bio must be at least 10 characters";
      if (formData.bio.length > 500) return "Bio must be under 500 characters";
      const filledSocials = Object.entries(formData.socials).filter(([, v]) => v.trim());
      if (filledSocials.length === 0) return "Please share at least one social or personal profile";
      for (const [platform, value] of filledSocials) {
        const url = normalizeSocialUrl(platform, value);
        try { new URL(url); } catch { return `Invalid profile for ${platform}`; }
      }
      const nonEmptyProjectLinks = formData.projectLinks.filter((l) => l.trim());
      for (const link of nonEmptyProjectLinks) {
        const normalized = /^https?:\/\//i.test(link) ? link : `https://${link}`;
        try { new URL(normalized); } catch { return "Please enter valid URLs for all project links"; }
      }
      if (!consentGiven) return "You must agree to the privacy policy to continue";
    }
    return null;
  };

  const infoSteps: Step[] = ["basics", "questions", "story"];

  const handleNext = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    const idx = infoSteps.indexOf(step);
    if (idx < infoSteps.length - 1) {
      setStep(infoSteps[idx + 1]);
    }
  };

  const handleBack = () => {
    setError(null);
    const idx = infoSteps.indexOf(step);
    if (idx > 0) {
      setStep(infoSteps[idx - 1]);
    }
  };

  // Fetch application data and transition to record step
  const fetchApplicationAndRecord = async (appToken: string) => {
    const res = await fetch(`/api/apply/${appToken}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to load application");
    }
    setApplication(data);
    setError(null);
    setStep("record");
  };

  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep("story");
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allLinks = [
        ...Object.entries(formData.socials)
          .filter(([, v]) => v.trim())
          .map(([platform, value]) => normalizeSocialUrl(platform, value)),
        ...formData.projectLinks
          .filter((l) => l.trim())
          .map((l) => /^https?:\/\//i.test(l) ? l : `https://${l}`),
      ];

      const res = await fetch("/api/apply/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          ticketType: formData.ticketType,
          address: formData.ticketType === "local" ? formData.address : undefined,
          timezone: formData.timezone,
          heardAbout: formData.heardAbout,
          priorEvents: formData.priorEvents
            ? `Yes — ${formData.priorEventsWhich.join(", ") || "unspecified"}`
            : "No",
          threeWords: formData.threeWords,
          bio: formData.bio,
          links: allLinks.length ? allLinks : undefined,
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
        await fetchApplicationAndRecord(data.token);
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

      await fetchApplicationAndRecord(token);
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

  // Camera / recording functions
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      setStream(mediaStream);
      setError(null);
      setHasStarted(true);
    } catch {
      setError("Could not access camera. Please grant permission and try again.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startRecording = useCallback(() => {
    if (!stream) return;

    chunksRef.current = [];
    setDuration(0);
    setCurrentPromptIndex(0);
    setRecordedBlob(null);

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9,opus",
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      setRecordedUrl(URL.createObjectURL(blob));
      stopCamera();
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000);
    setIsRecording(true);
    isRecordingRef.current = true;

    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed++;
      setDuration(elapsed);

      const newPromptIndex = Math.min(
        Math.floor(elapsed / PROMPT_DURATION),
        (application?.prompts.length || 1) - 1
      );
      setCurrentPromptIndex(newPromptIndex);

      if (elapsed >= MAX_DURATION) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setVideoDuration(elapsed);
        if (mediaRecorderRef.current && isRecordingRef.current) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          isRecordingRef.current = false;
        }
      }
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, stopCamera, application?.prompts.length]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      setVideoDuration(duration);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      isRecordingRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [duration]);

  const uploadRecordedVideo = async (): Promise<{ key: string; url: string } | null> => {
    if (!recordedBlob) return null;

    const presignRes = await fetch("/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "recording.webm",
        contentType: "video/webm",
        size: recordedBlob.size,
      }),
    });

    if (!presignRes.ok) {
      const data = await presignRes.json();
      throw new Error(data.error || "Failed to get upload URL");
    }

    const presignData = await presignRes.json();

    if (presignData.localMode) {
      const uploadData = new FormData();
      uploadData.append("file", new File([recordedBlob], "recording.webm", { type: "video/webm" }));

      const localRes = await fetch("/api/upload/local", {
        method: "POST",
        body: uploadData,
      });

      if (!localRes.ok) {
        const data = await localRes.json();
        throw new Error(data.error || "Local upload failed");
      }

      setUploadProgress(100);
      const { key, url } = await localRes.json();
      return { key, url };
    }

    const { uploadUrl, key, publicUrl } = presignData;

    const xhr = new XMLHttpRequest();

    await new Promise<void>((resolve, reject) => {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error("Upload failed"));
        }
      };

      xhr.onerror = () => reject(new Error("Upload failed"));

      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", "video/webm");
      xhr.send(recordedBlob);
    });

    return { key, url: publicUrl };
  };

  const handleSubmitVideo = async () => {
    if (!recordedBlob) {
      setError("Please record a video first");
      return;
    }

    setSubmitting(true);
    setError(null);
    setUploadProgress(0);

    try {
      const videoData = await uploadRecordedVideo();

      if (!videoData) {
        throw new Error("Failed to upload video");
      }

      const res = await fetch("/api/apply/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          videoKey: videoData.key,
          videoUrl: videoData.url,
          videoDurationSec: videoDuration || duration,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      setStep("confirmation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const clearVideo = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setUploadProgress(0);
    setVideoDuration(0);
    setDuration(0);
    setHasStarted(false);
  };

  // Modal close logic
  const canCloseModal = !isRecording && !submitting && step !== "verification";

  const handleCloseModal = () => {
    if (!canCloseModal) return;
    if (step === "record" && stream) {
      stopCamera();
      setHasStarted(false);
    }
    setModalOpen(false);
  };

  // Modal width based on step
  const modalMaxWidth = step === "record" ? "52rem" : step === "confirmation" ? "36rem" : "42rem";

  // Step progress dots
  const allStepsOrder: Step[] = ["basics", "questions", "story", "verification", "record", "confirmation"];
  const currentStepIdx = allStepsOrder.indexOf(step);

  const stepDots = (
    <div className="flex items-center gap-2 sm:gap-3 text-sm text-slate-500">
      {(
        [
          { key: "basics", label: "Basics", idx: 0 },
          { key: "questions", label: "Details", idx: 1 },
          { key: "story", label: "Story", idx: 2 },
          { key: "record", label: "Record", idx: 4 },
        ] as const
      ).map((s, i) => {
        const isConfirmation = step === "confirmation";
        const isActive =
          s.key === step ||
          (s.key === "record" && (step === "verification" || step === "record"));
        const isCompleted =
          isConfirmation ||
          (s.key === "basics" && currentStepIdx > 0) ||
          (s.key === "questions" && currentStepIdx > 1) ||
          (s.key === "story" && currentStepIdx > 2) ||
          (s.key === "record" && currentStepIdx > 4);
        return (
          <span key={s.key} className="flex items-center gap-2">
            {i > 0 && <div className="w-4 sm:w-8 h-px bg-slate-200" />}
            <span
              className={`flex items-center gap-1.5 ${isActive && !isConfirmation ? "text-slate-900 font-medium" : ""}`}
            >
              <span
                className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-medium ${
                  isConfirmation
                    ? "bg-emerald-100 text-emerald-600"
                    : isActive
                      ? "bg-blue-600 text-white"
                      : isCompleted
                        ? "bg-blue-100 text-blue-600"
                        : "bg-slate-100 text-slate-400"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </span>
          </span>
        );
      })}
    </div>
  );

  const hasVideo = recordedBlob !== null;

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl font-bold text-slate-900 tracking-tight">
            IP4
          </Link>
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            Back to home
          </Link>
        </div>
      </nav>

      {/* Landing page content */}
      <div className="max-w-3xl mx-auto px-6 py-8 md:py-10">
        {/* Hero */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-2">
            Apply to IP4
          </h1>
          <p className="text-lg md:text-xl text-slate-500">
            No resume, no LinkedIn. Just you.
          </p>
        </div>

        {/* How it works */}
        <div className="mb-6 md:mb-8">
          <h2 className="font-serif text-xl font-bold text-slate-900 mb-4 text-center">
            Here&apos;s how it works
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              {
                num: 1,
                title: "Tell us about yourself",
                desc: "Name, location, a short bio, and a few quick questions. Takes about 3 minutes.",
              },
              {
                num: 2,
                title: "Verify your email",
                desc: "We\u2019ll send a quick code to confirm it\u2019s really you.",
              },
              {
                num: 3,
                title: "Record a 90-second video",
                desc: "Three questions, 30 seconds each. No prep needed\u2014just be yourself.",
              },
              {
                num: 4,
                title: "We review & respond",
                desc: "Our team watches every video. We\u2019ll get back to you within a few weeks.",
              },
            ].map((item) => (
              <div key={item.num} className="flex gap-3 p-4 rounded-2xl bg-slate-50">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                  {item.num}
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quote */}
        <div className="mb-6 md:mb-8 max-w-xl mx-auto text-center">
          <svg className="w-6 h-6 text-blue-200 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <p className="text-base text-slate-600 leading-relaxed italic mb-2">
            &ldquo;The application process itself told me this wasn&apos;t going to be
            another boring conference. I was nervous recording my video, and
            that&apos;s exactly why it worked.&rdquo;
          </p>
          <p className="text-sm text-slate-400">
            &mdash; Priya R., IP3 Attendee
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => setModalOpen(true)}
            className="px-10 py-3.5 bg-blue-600 text-white rounded-full font-medium text-lg hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/25"
          >
            Get Started
          </button>
          <p className="mt-2 text-sm text-slate-400">Takes about 5 minutes</p>
        </div>
      </div>

      {/* Modal overlay */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 sm:p-6"
          onClick={canCloseModal ? handleCloseModal : undefined}
        >
          <div
            className="bg-white w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative transition-[max-width] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ maxWidth: modalMaxWidth }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            {step !== "confirmation" && (
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 rounded-t-2xl z-10">
                <div className="flex items-center justify-between">
                  {stepDots}
                  {canCloseModal && (
                    <button
                      onClick={handleCloseModal}
                      className="ml-4 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                      aria-label="Close"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Confirmation header — just a close button */}
            {step === "confirmation" && (
              <div className="sticky top-0 bg-white px-6 py-4 rounded-t-2xl z-10 flex justify-end">
                <button
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Modal body */}
            <div className="px-6 py-8">
              {/* Step heading (form + verification steps) */}
              {(step === "basics" || step === "questions" || step === "story" || step === "verification") && (
                <div className="mb-8">
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-2">
                    {step === "basics" && "Let\u2019s start with the basics."}
                    {step === "questions" && "A few quick questions."}
                    {step === "story" && "Now tell us your story."}
                    {step === "verification" && "Verify your email."}
                  </h2>
                  <p className="text-slate-500">
                    {step === "basics" && "No resume, no LinkedIn. We want to know what makes you interesting."}
                    {step === "questions" && "Just a couple things so we can get to know you better."}
                    {step === "story" && "This is the fun part\u2014tell us what lights you up."}
                    {step === "verification" && "Check your inbox for a 6-digit code."}
                  </p>
                </div>
              )}

              {/* Error banner */}
              {error && step !== "confirmation" && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Step 1: The basics */}
              {step === "basics" && (
                <div className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white"
                        placeholder="Jane Smith"
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
                        className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white"
                        placeholder="jane@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        Ticket Type
                      </label>
                      <div className="flex gap-3">
                        {([
                          { value: "local", label: "Local", price: "$5,999" },
                          { value: "regular", label: "Regular", price: "$9,999" },
                          { value: "vip", label: "VIP", price: "$15,999" },
                        ] as const).map((tier) => (
                          <button
                            key={tier.value}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, ticketType: tier.value }))}
                            className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                              formData.ticketType === tier.value
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                          >
                            <span className="block">{tier.label}</span>
                            <span className={`block text-xs mt-0.5 ${formData.ticketType === tier.value ? "text-blue-200" : "text-slate-400"}`}>{tier.price}</span>
                          </button>
                        ))}
                      </div>
                      {formData.ticketType === "local" && (
                        <p className="text-xs text-slate-500 mt-2">Local tickets are for Victoria, BC residents only.</p>
                      )}
                    </div>

                    {formData.ticketType === "local" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-2">
                            Street Address
                          </label>
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => updateField("address", e.target.value)}
                            className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white"
                            placeholder="Your Victoria, BC address"
                          />
                        </div>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.localSwear}
                            onChange={(e) => setFormData((prev) => ({ ...prev, localSwear: e.target.checked }))}
                            className="mt-0.5 h-5 w-5 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                          />
                          <span className="text-sm text-slate-600 leading-relaxed">
                            I solemnly swear I actually live here, in Victoria, as my primary residence.
                          </span>
                        </label>
                      </div>
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

                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full px-6 py-4 bg-blue-600 text-white rounded-full font-medium text-lg hover:bg-blue-700 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Step 2: Quick questions */}
              {step === "questions" && (
                <div className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        How did you hear about Interesting People?
                      </label>
                      <input
                        type="text"
                        value={formData.heardAbout}
                        onChange={(e) => updateField("heardAbout", e.target.value)}
                        className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white"
                        placeholder="Friend, Twitter, newsletter, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-3">
                        Have you ever attended any IP events in the past?
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, priorEvents: true }))}
                          className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                            formData.priorEvents
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, priorEvents: false, priorEventsWhich: [] }))}
                          className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                            !formData.priorEvents
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          No
                        </button>
                      </div>
                      {formData.priorEvents && (
                        <div className="mt-4">
                          <p className="text-sm text-slate-500 mb-3">Which ones?</p>
                          <div className="flex gap-3">
                            {["IP1", "IP2", "IP3"].map((event) => (
                              <button
                                key={event}
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    priorEventsWhich: prev.priorEventsWhich.includes(event)
                                      ? prev.priorEventsWhich.filter((e) => e !== event)
                                      : [...prev.priorEventsWhich, event],
                                  }))
                                }
                                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                  formData.priorEventsWhich.includes(event)
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                }`}
                              >
                                {event}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        Describe yourself in 3 words
                      </label>
                      <input
                        type="text"
                        value={formData.threeWords}
                        onChange={(e) => updateField("threeWords", e.target.value)}
                        className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white"
                        placeholder="Curious, restless, optimistic"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-6 py-4 border border-slate-200 text-slate-700 rounded-full font-medium text-lg hover:bg-slate-50 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-full font-medium text-lg hover:bg-blue-700 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Tell us more */}
              {step === "story" && (
                <form onSubmit={handleSubmitInfo} className="space-y-8">
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
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow resize-none bg-white"
                      placeholder="I spend my weekends building mechanical keyboards and arguing about which pizza style is best..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Social Profiles
                    </label>
                    <p className="text-sm text-slate-500 mb-3">
                      Share at least one to help us get to know you better.
                    </p>
                    <div className="space-y-3">
                      {([
                        { key: "instagram", label: "Instagram", placeholder: "yourhandle" },
                        { key: "x", label: "X (Twitter)", placeholder: "yourhandle" },
                        { key: "tiktok", label: "TikTok", placeholder: "yourhandle" },
                        { key: "youtube", label: "YouTube", placeholder: "yourchannel" },
                        { key: "website", label: "Personal Website", placeholder: "yoursite.com" },
                      ] as const).map((platform) => (
                        <div key={platform.key} className="flex items-center gap-3">
                          <span className="text-sm text-slate-500 w-32 flex-shrink-0">{platform.label}</span>
                          <input
                            type="text"
                            value={formData.socials[platform.key]}
                            onChange={(e) => updateSocial(platform.key, e.target.value)}
                            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white text-sm"
                            placeholder={platform.placeholder}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">
                      Projects &amp; Businesses
                      <span className="text-slate-400 font-normal ml-2">(optional)</span>
                    </label>
                    <p className="text-sm text-slate-500 mb-3">
                      Links to anything you&apos;ve built, run, or are working on.
                    </p>
                    {formData.projectLinks.map((link, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={link}
                          onChange={(e) => updateProjectLink(i, e.target.value)}
                          className="flex-1 px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white"
                          placeholder="yourproject.com"
                        />
                        {formData.projectLinks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeProjectLink(i)}
                            className="px-3 py-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    {formData.projectLinks.length < 5 && (
                      <button
                        type="button"
                        onClick={addProjectLink}
                        className="text-sm text-slate-500 hover:text-slate-900 transition-colors mt-1"
                      >
                        + Add another link
                      </button>
                    )}
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

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-6 py-4 border border-slate-200 text-slate-700 rounded-full font-medium text-lg hover:bg-slate-50 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-full font-medium text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {loading ? "Submitting..." : "Continue to Video"}
                    </button>
                  </div>
                </form>
              )}

              {/* Verification step */}
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
                      className="w-full px-4 py-4 text-center text-2xl tracking-[0.5em] border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                      placeholder="000000"
                      maxLength={6}
                      autoFocus
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || verificationCode.length !== 6}
                    className="w-full px-6 py-4 bg-blue-600 text-white rounded-full font-medium text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                        setStep("story");
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

              {/* Record step */}
              {step === "record" && application && (
                <div className="space-y-6">
                  {/* Heading */}
                  <div className="mb-2">
                    <p className="text-sm text-slate-400 mb-1">Hi {application.name},</p>
                    <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                      Record your response.
                    </h2>
                  </div>

                  {/* Rules - only show before starting */}
                  {!hasStarted && !hasVideo && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                      <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        How it works
                      </h3>
                      <ul className="space-y-2 text-sm text-blue-800">
                        <li>
                          <span className="font-semibold">{application.prompts.length} questions, {PROMPT_DURATION}s each.</span>{" "}
                          <span className="text-blue-600">Questions appear one at a time when you start recording.</span>
                        </li>
                        <li>
                          <span className="font-semibold">One take.</span>{" "}
                          <span className="text-blue-600">You won&apos;t see the questions beforehand and there are no do-overs.</span>
                        </li>
                        <li>
                          <span className="font-semibold">No editing.</span>{" "}
                          <span className="text-blue-600">We want the real you, not the polished you.</span>
                        </li>
                      </ul>
                      <p className="mt-4 text-xs text-blue-600 italic">
                        Tip: Don&apos;t overthink it. When the question changes, just start talking.
                      </p>
                    </div>
                  )}

                  {/* Prompt box - only visible during recording */}
                  {isRecording && (
                    <div className="bg-slate-900 rounded-2xl p-6 md:p-8">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-slate-400 font-medium">
                          Question {currentPromptIndex + 1} of {application.prompts.length}
                        </p>
                        <div className="flex gap-2">
                          {application.prompts.map((_, idx) => (
                            <div
                              key={idx}
                              className={`w-2 h-2 rounded-full transition-all ${
                                idx === currentPromptIndex
                                  ? "bg-white scale-125"
                                  : idx < currentPromptIndex
                                  ? "bg-slate-500"
                                  : "bg-slate-700"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xl md:text-2xl text-white font-medium leading-relaxed">
                        {application.prompts[currentPromptIndex]?.text}
                      </p>
                      <div className="mt-4 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white/50 transition-all duration-1000"
                          style={{
                            width: `${((duration % PROMPT_DURATION) / PROMPT_DURATION) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {PROMPT_DURATION - (duration % PROMPT_DURATION)}s until next question
                      </p>
                    </div>
                  )}

                  {/* Video area */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6">
                    {!hasStarted && !hasVideo && (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-slate-600 mb-1">Record your {MAX_DURATION}-second response</p>
                        <p className="text-sm text-slate-500 mb-5">
                          Questions will appear on screen once you start recording.
                        </p>
                        <button
                          onClick={startCamera}
                          className="px-8 py-4 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          Enable Camera
                        </button>
                      </div>
                    )}

                    {/* Recording view */}
                    {stream && !recordedBlob && (
                      <div className="space-y-5">
                        <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                          <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                          {isRecording && (
                            <>
                              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                <span className="font-mono text-sm">{formatTime(duration)} / {formatTime(MAX_DURATION)}</span>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700">
                                <div
                                  className="h-full bg-red-500 transition-all duration-1000"
                                  style={{ width: `${(duration / MAX_DURATION) * 100}%` }}
                                />
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex justify-center gap-4">
                          {!isRecording && (
                            <button
                              onClick={startRecording}
                              className="px-8 py-4 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-all flex items-center gap-3"
                            >
                              <span className="w-3 h-3 bg-white rounded-full" />
                              Start Recording
                            </button>
                          )}

                          {isRecording && (
                            <button
                              onClick={stopRecording}
                              className="px-8 py-4 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-all"
                            >
                              Stop Recording
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Recording complete */}
                    {recordedBlob && (
                      <div className="space-y-5">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-emerald-800">Video recorded!</p>
                            <p className="text-sm text-emerald-600">{formatTime(videoDuration || duration)} — ready to submit</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Upload progress */}
                    {submitting && uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-5">
                        <div className="flex justify-between text-sm text-slate-600 mb-2">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-900 transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit button */}
                  {hasVideo && (
                    <div className="space-y-4">
                      <button
                        onClick={handleSubmitVideo}
                        disabled={submitting}
                        className="w-full px-6 py-4 bg-blue-600 text-white rounded-full font-medium text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99]"
                      >
                        {submitting ? "Submitting..." : "Submit Application"}
                      </button>
                      <p className="text-center text-sm text-slate-500">
                        By submitting, you confirm this is your final take.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Confirmation step */}
              {step === "confirmation" && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <h2 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mb-3">
                    You&apos;re in the queue.
                  </h2>

                  <p className="text-slate-500 max-w-sm mx-auto mb-8">
                    Thanks for putting yourself out there. We watch every single video
                    and will be in touch.
                  </p>

                  <div className="text-left max-w-sm mx-auto mb-8">
                    {[
                      {
                        num: "1",
                        title: "We watch your video",
                        desc: "A real human reviews every application.",
                      },
                      {
                        num: "2",
                        title: "We email you",
                        desc: "Yes, no, or waitlist\u2014we\u2019ll let you know.",
                      },
                      {
                        num: "3",
                        title: "If accepted",
                        desc: "You\u2019ll get all the details to confirm your spot.",
                      },
                    ].map((item) => (
                      <div key={item.num} className="flex gap-4 py-4 border-b border-slate-100 last:border-0">
                        <span className="font-serif text-2xl font-bold text-slate-200 flex-shrink-0 w-6">
                          {item.num}
                        </span>
                        <div>
                          <h3 className="font-medium text-slate-900 text-sm mb-0.5">{item.title}</h3>
                          <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleCloseModal}
                    className="px-10 py-4 bg-blue-600 text-white rounded-full font-medium text-lg hover:bg-blue-700 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
