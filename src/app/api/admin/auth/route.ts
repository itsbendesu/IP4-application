import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    if (!ADMIN_PASSWORD) {
      console.error("ADMIN_PASSWORD env var not set");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // Rate limit: 5 attempts per 15 minutes per IP
    const ip = getIp(request);
    const now = Date.now();
    const entry = loginAttempts.get(ip);
    if (entry && entry.resetAt > now && entry.count >= 5) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    if (!entry || entry.resetAt < now) {
      loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    } else {
      entry.count++;
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const reviewer = await prisma.reviewer.findUnique({
      where: { email },
    });

    if (!reviewer) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Reset attempts on success
    loginAttempts.delete(ip);

    const session = await getSession();
    session.reviewerId = reviewer.id;
    session.reviewerEmail = reviewer.email;
    session.reviewerName = reviewer.name || undefined;
    session.reviewerRole = reviewer.role;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({
      success: true,
      name: reviewer.name,
      role: reviewer.role,
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    session.destroy();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ isLoggedIn: false });
    }
    return NextResponse.json({
      isLoggedIn: true,
      reviewerId: session.reviewerId,
      name: session.reviewerName,
      email: session.reviewerEmail,
      role: session.reviewerRole,
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ isLoggedIn: false });
  }
}
