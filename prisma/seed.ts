import { config } from "dotenv";
config({ path: ".env.local", override: true });
config({ override: true });
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const prompts = [
  "Describe a belief you held with total confidence that turned out to be completely wrong. How long did you resist updating it?",
  "What's something you're known for that quietly embarrasses you?",
  "Tell us about a moment when you chose comfort over courage. No redemption arc required.",
  "What do the people who find you genuinely difficult to be around get right about you?",
  "What are you currently pretending to care less about than you actually do?",
  "If the most interesting chapter of your life is still ahead of you, what needs to be true for that to happen?",
  "What's a question you're afraid someone at this conference might ask you?",
  "Finish this sentence honestly: \"Most people in my field are too afraid to admit that…\"",
  "What's something you've changed your mind about in the last 12 months that genuinely cost you something to update?",
  "You have 30 seconds. Use it to tell us something you're worried we might judge you for.",
  "What's something you've accomplished that you've never fully let yourself feel good about, and why?",
  "Describe the version of you that shows up when no one important is watching.",
  "What's a conversation you've been avoiding, and what are you protecting by avoiding it?",
  "What did you used to believe made someone successful that you no longer believe?",
  "If the people who love you most were being honest, what would they say is holding you back?",
];

async function main() {
  console.log("Seeding database...");

  // Deactivate all existing prompts
  await prisma.prompt.updateMany({
    where: { active: true },
    data: { active: false },
  });
  console.log("Deactivated old prompts");

  // Create new prompts
  for (let i = 0; i < prompts.length; i++) {
    await prisma.prompt.upsert({
      where: { id: `prompt-v2-${i + 1}` },
      update: { text: prompts[i], active: true },
      create: {
        id: `prompt-v2-${i + 1}`,
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
