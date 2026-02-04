import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const prompts = await prisma.prompt.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, text: true },
    });
    return NextResponse.json(prompts);
  } catch (error) {
    console.error("Failed to fetch prompts:", error);
    return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 });
  }
}
