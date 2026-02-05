import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const prompts = [
  "Describe a moment in the last year that changed how you think.",
  "What's something you've been working on recently that you're especially proud of?",
  "What's a question you can't stop thinking about lately—even if you don't have a good answer yet?",
  "Describe a moment when you realized you were wrong about someone or something. What helped you see it differently?",
  "What's the most interesting idea you've come across recently? Why is it exciting?",
  "When you're in a group of people you don't know well, what role do you tend to naturally fall into—and why do you think that is?",
  "Tell us about something you find genuinely fascinating that most people wouldn't guess about you.",
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
    await pool.end();
  });
