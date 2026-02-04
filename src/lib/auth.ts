import { getSession, SessionData } from "./session";
import { NextResponse } from "next/server";

export interface AuthResult {
  authorized: true;
  session: SessionData;
}

export interface AuthError {
  authorized: false;
  response: NextResponse;
}

export async function requireAuth(): Promise<AuthResult | AuthError> {
  const session = await getSession();

  if (!session.isLoggedIn || !session.reviewerId) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { authorized: true, session };
}

export async function requireAdmin(): Promise<AuthResult | AuthError> {
  const session = await getSession();

  if (!session.isLoggedIn || !session.reviewerId) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (session.reviewerRole !== "ADMIN") {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Admin access required" }, { status: 403 }),
    };
  }

  return { authorized: true, session };
}
