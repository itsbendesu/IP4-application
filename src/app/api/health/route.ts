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
    version: "2.0.0-hardened",
    checks: {
      database: { status: "ok" },
      storage: { status: "unconfigured" },
    },
  };

  // Check database connectivity using direct pg connection (bypasses Prisma adapter)
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    health.checks.database.status = "error";
    health.status = "unhealthy";
    health.checks.database.error = "DATABASE_URL not set";
  } else {
    try {
      const dbStart = Date.now();
      const pool = new Pool({
        connectionString: dbUrl,
        max: 1,
        connectionTimeoutMillis: 10000,
        ssl: { rejectUnauthorized: false },
      });
      await pool.query("SELECT 1 as ok");
      await pool.end();
      health.checks.database.latencyMs = Date.now() - dbStart;
    } catch (error) {
      health.checks.database.status = "error";
      health.status = "unhealthy";
      const errMsg = error instanceof Error ? `${error.constructor?.name || error.name}: ${error.message}` : String(error);
      const errCode = (error as Record<string, unknown>)?.code;
      health.checks.database.error = `pg[${errCode || '?'}]: ${errMsg}`.slice(0, 500);
    }
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
