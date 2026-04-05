import { NextResponse } from "next/server";
import { Pool } from "pg";

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

  // Check database connectivity using direct pg connection (bypasses Prisma adapter)
  try {
    const dbStart = Date.now();
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      connectionTimeoutMillis: 10000,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    });
    const result = await pool.query("SELECT 1 as ok");
    await pool.end();
    health.checks.database.latencyMs = Date.now() - dbStart;
  } catch (error) {
    health.checks.database.status = "error";
    health.status = "unhealthy";
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Health check DB error:", errMsg);
    health.checks.database.error = errMsg.slice(0, 500);
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
