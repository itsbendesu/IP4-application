import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const prompts = [
  "Tell us about a time you changed your mind about something important.",
  "What's the most interesting rabbit hole you've gone down recently?",
  "Describe a project you're proud of that most people don't know about.",
  "What question do you wish more people would ask you?",
  "Tell us about someone who has significantly influenced your thinking.",
  "What's a contrarian belief you hold that others might disagree with?",
  "If you could have dinner with anyone, living or dead, who and why?",
];

async function main() {
  console.log("Seeding database...");

  // Create prompts
  for (let i = 0; i < prompts.length; i++) {
    await prisma.prompt.upsert({
      where: { id: `prompt-${i + 1}` },
      update: { text: prompts[i] },
      create: {
        id: `prompt-${i + 1}`,
        text: prompts[i],
        active: true,
      },
    });
  }
  console.log(`Created ${prompts.length} prompts`);

  // Create default admin reviewer (password: admin123)
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.reviewer.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      role: "ADMIN",
    },
  });
  console.log("Created default admin: admin@example.com");

  // Note: Password auth is handled separately via session
  // In production, use OAuth or magic links instead of storing password hashes

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
