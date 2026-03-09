import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STATUS_MAP: Record<string, "SUBMITTED" | "ACCEPTED" | "REJECTED"> = {
  submitted: "SUBMITTED",
  accepted: "ACCEPTED",
  rejected: "REJECTED",
};

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
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
