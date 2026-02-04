import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// Simple email-based auth for MVP (no password stored in DB)
// In production, use OAuth or magic links
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Find reviewer by email
    const reviewer = await prisma.reviewer.findUnique({
      where: { email },
    });

    if (!reviewer) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Simple password check (in production, use proper auth)
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

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
