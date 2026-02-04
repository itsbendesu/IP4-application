"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface ApplicationData {
  id: string;
  name: string;
  email: string;
  prompt: {
    id: string;
    text: string;
  };
  expiresAt: string;
}

type VideoSource = "record" | "upload";

export default function UploadPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [videoSource, setVideoSource] = useState<VideoSource>("record");
  const [hasStarted, setHasStarted] = useState(false);

  // Recording state
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  const MAX_DURATION = 90;
  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

  // Fetch application data
  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const res = await fetch(`/api/apply/${token}`);
        const data = await res.json();

        if (!res.ok) {
          if (data.requiresVerification) {
            // Redirect back to apply with verification needed
            router.push("/apply");
            return;
          }
          throw new Error(data.error || "Application not found");
        }

        setApplication(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load application");
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [token, router]);

  // Cleanup on unmount
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

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
      setHasStarted(true);
    } catch (err) {
      setError("Could not access camera. Please grant permission and try again.");
      console.error("Camera error:", err);
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
      stopCamera();
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000);
    setIsRecording(true);

    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed++;
      setDuration(elapsed);
      if (elapsed >= MAX_DURATION) {
        stopRecording();
      }
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, stopCamera]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      setVideoDuration(duration);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording, duration]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["video/mp4", "video/quicktime", "video/webm"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a video file (MP4, MOV, or WebM)");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError("File too large. Maximum size is 500MB.");
      return;
    }

    // Get video duration
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      if (video.duration > 120) {
        setError("Video must be 2 minutes or less.");
        return;
      }
      setVideoDuration(Math.round(video.duration));
      setUploadFile(file);
      setError(null);
      setHasStarted(true);
    };

    video.onerror = () => {
      setError("Could not read video file");
    };

    video.src = URL.createObjectURL(file);
  };

  const uploadVideo = async (): Promise<{ key: string; url: string } | null> => {
    if (!uploadFile) return null;

    try {
      // Get presigned URL
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: uploadFile.name,
          contentType: uploadFile.type,
          size: uploadFile.size,
        }),
      });

      if (!presignRes.ok) {
        const data = await presignRes.json();
        throw new Error(data.error || "Failed to get upload URL");
      }

      const { uploadUrl, key, publicUrl } = await presignRes.json();

      // Upload to R2
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
        xhr.setRequestHeader("Content-Type", uploadFile.type);
        xhr.send(uploadFile);
      });

      return { key, url: publicUrl };
    } catch (err) {
      throw err;
    }
  };

  const uploadRecordedVideo = async (): Promise<{ key: string; url: string } | null> => {
    if (!recordedBlob) return null;

    try {
      // Get presigned URL
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

      const { uploadUrl, key, publicUrl } = await presignRes.json();

      // Upload to R2
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
    } catch (err) {
      throw err;
    }
  };

  const handleSubmit = async () => {
    if (!recordedBlob && !uploadFile) {
      setError("Please record or upload a video first");
      return;
    }

    setSubmitting(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Upload the video first
      let videoData: { key: string; url: string } | null = null;

      if (recordedBlob) {
        videoData = await uploadRecordedVideo();
      } else if (uploadFile) {
        videoData = await uploadVideo();
      }

      if (!videoData) {
        throw new Error("Failed to upload video");
      }

      // Complete the application
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

      router.push("/confirmation");
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
    setRecordedBlob(null);
    setUploadFile(null);
    setUploadProgress(0);
    setVideoDuration(0);
    setDuration(0);
    setHasStarted(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </main>
    );
  }

  if (!application) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Application Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "This application may have expired or already been submitted."}</p>
          <Link
            href="/apply"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Start New Application
          </Link>
        </div>
      </main>
    );
  }

  const hasVideo = recordedBlob !== null || uploadFile !== null;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-2">Hi {application.name},</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Record Your Response</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Prompt */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-8">
          <p className="text-sm text-indigo-600 font-medium mb-2">Your prompt:</p>
          <p className="text-xl text-gray-900 font-medium">{application.prompt.text}</p>
        </div>

        {/* Rules - only show before starting */}
        {!hasStarted && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <h2 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              The rules
            </h2>
            <ul className="space-y-2 text-amber-800">
              <li className="flex items-start gap-2">
                <span className="font-bold">90 seconds max.</span>
                <span className="text-amber-700">We&apos;ll cut you off automatically.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">One take only.</span>
                <span className="text-amber-700">No re-recording after you submit.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">No editing.</span>
                <span className="text-amber-700">We want the real you, not the polished you.</span>
              </li>
            </ul>
            <p className="mt-4 text-sm text-amber-700 italic">
              Tip: Take a breath. Think for a second. Then just talk.
              Authenticity beats polish every time.
            </p>
          </div>
        )}

        {/* Video area */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          {!hasStarted && !hasVideo && (
            <>
              {/* Source toggle */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg mb-6">
                <button
                  onClick={() => setVideoSource("record")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    videoSource === "record"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Record Now
                </button>
                <button
                  onClick={() => setVideoSource("upload")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    videoSource === "upload"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Upload Video
                </button>
              </div>

              {videoSource === "record" ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-4">Record your {MAX_DURATION}-second response</p>
                  <button
                    onClick={startCamera}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    Enable Camera
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-2">Upload a pre-recorded video</p>
                  <p className="text-sm text-gray-500 mb-4">MP4, MOV, or WebM up to 500MB (max 2 min)</p>
                  <label className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium cursor-pointer">
                    Choose File
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </>
          )}

          {/* Recording view */}
          {stream && !recordedBlob && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {isRecording && (
                  <>
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="font-mono">{formatTime(duration)} / {formatTime(MAX_DURATION)}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
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
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2"
                  >
                    <span className="w-3 h-3 bg-white rounded-full" />
                    Start Recording
                  </button>
                )}

                {isRecording && (
                  <button
                    onClick={stopRecording}
                    className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium"
                  >
                    Stop Recording
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Preview recorded video */}
          {recordedBlob && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-green-800">Video recorded!</p>
                  <p className="text-sm text-green-600">{formatTime(videoDuration || duration)}</p>
                </div>
              </div>

              <video
                src={URL.createObjectURL(recordedBlob)}
                controls
                className="w-full rounded-lg"
              />

              <button
                onClick={clearVideo}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Record a different video
              </button>
            </div>
          )}

          {/* Preview uploaded video */}
          {uploadFile && !recordedBlob && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-green-800">Video ready!</p>
                  <p className="text-sm text-green-600">{uploadFile.name} ({formatTime(videoDuration)})</p>
                </div>
              </div>

              <video
                src={URL.createObjectURL(uploadFile)}
                controls
                className="w-full rounded-lg"
              />

              <button
                onClick={clearVideo}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Choose a different video
              </button>
            </div>
          )}

          {/* Upload progress */}
          {submitting && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all"
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
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
            <p className="text-center text-sm text-gray-500">
              By submitting, you confirm this is your final take.
            </p>
          </div>
        )}

        {/* Expiration notice */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Application expires: {new Date(application.expiresAt).toLocaleString()}
        </div>
      </div>
    </main>
  );
}
