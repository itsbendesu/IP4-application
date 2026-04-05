import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: {
      status: "ok" | "error";
      latencyMs?: number;
      error?: string;
    };
    storage: {
      status: "ok" | "unconfigured";
    };
  };
}

export async function GET() {
  const startTime = Date.now();
  const health: HealthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    checks: {
      database: { status: "ok" },
      storage: { status: "unconfigured" },
    },
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database.latencyMs = Date.now() - dbStart;
  } catch (error) {
    health.checks.database.status = "error";
    // Capture full error details for debugging
    const errMsg = error instanceof Error ? error.message : String(error);
    const errName = error instanceof Error ? error.name : "unknown";
    const errStack = error instanceof Error ? (error.stack || "").split("\n").slice(0, 3).join(" | ") : "";
    console.error("Health check DB error:", errName, errMsg);
    health.checks.database.error = `${errName}: ${errMsg}`.slice(0, 500);
  }

  // Check storage configuration
  const storageConfigured = !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );

  health.checks.storage.status = storageConfigured ? "ok" : "unconfigured";

  if (!storageConfigured && health.status === "healthy") {
    health.status = "degraded";
  }

  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Response-Time": `${Date.now() - startTime}ms`,
    },
  });
}
