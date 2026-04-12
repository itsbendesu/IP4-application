import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { timingSafeEqual } from "crypto";

const STATUS_MAP: Record<string, "SUBMITTED" | "ACCEPTED" | "REJECTED"> = {
  submitted: "SUBMITTED",
  accepted: "ACCEPTED",
  rejected: "REJECTED",
};

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  const expected = process.env.WEBHOOK_SECRET;
  if (!secret || !expected || !constantTimeCompare(secret, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { email, status } = await req.json();

  if (!email || !status || !STATUS_MAP[status]) {
    return NextResponse.json({ error: "email and valid status required" }, { status: 400 });
  }

  const applicant = await prisma.applicant.findUnique({
    where: { email },
    include: { submission: true },
  });

  if (!applicant || !applicant.submission) {
    return NextResponse.json({ error: "applicant or submission not found" }, { status: 404 });
  }

  await prisma.submission.update({
    where: { id: applicant.submission.id },
    data: { status: STATUS_MAP[status] },
  });

  return NextResponse.json({ ok: true, submissionId: applicant.submission.id });
}
