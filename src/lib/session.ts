import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  reviewerId?: string;
  reviewerEmail?: string;
  reviewerName?: string;
  reviewerRole?: "ADMIN" | "REVIEWER";
  isLoggedIn: boolean;
}

function getSessionPassword(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET environment variable is required in production");
    }
    // In development, use a deterministic dev secret
    return "dev-only-session-secret-not-for-production-use-1234567890";
  }
  return secret;
}

export const sessionOptions: SessionOptions = {
  password: getSessionPassword(),
  cookieName: "interesting-people-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
};
