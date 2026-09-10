import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, TrackingType } from "../src/generated/prisma/client.js";

try {
  process.loadEnvFile();
} catch {
  // No .env file present (e.g. CI) — real env vars are expected to be injected already.
}

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the seed script.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const DEFAULT_SYMPTOMS: Array<{ name: string; category: string }> = [
  { name: "Headache", category: "neurological" },
  { name: "Fatigue", category: "general" },
  { name: "Joint Pain", category: "pain" },
  { name: "Muscle Pain", category: "pain" },
  { name: "Nausea", category: "digestive" },
  { name: "Brain Fog", category: "neurological" },
  { name: "Dizziness", category: "neurological" },
  { name: "Insomnia", category: "sleep" },
  { name: "Anxiety", category: "mental_health" },
  { name: "Stomach Pain", category: "digestive" },
  { name: "Back Pain", category: "pain" },
];

const DEFAULT_HABITS: Array<{ name: string; trackingType: TrackingType; unit: string | null }> = [
  { name: "Sleep Duration", trackingType: TrackingType.duration, unit: "hours" },
  { name: "Water Intake", trackingType: TrackingType.numeric, unit: "glasses" },
  { name: "Exercise", trackingType: TrackingType.boolean, unit: null },
  { name: "Alcohol", trackingType: TrackingType.boolean, unit: null },
  { name: "Caffeine", trackingType: TrackingType.numeric, unit: "cups" },
];

// Default (system) rows always have userId = null. We deliberately don't use
// Prisma's `.upsert()` here: on Postgres, upsert compiles to
// `INSERT ... ON CONFLICT (user_id, name) DO UPDATE`, but Postgres treats every
// NULL user_id as distinct for uniqueness purposes, so the compound
// `@@unique([userId, name])` constraint never matches a conflict for these
// rows. A plain findFirst -> update/create is simple, correct, and safe to
// re-run.
async function upsertDefaultSymptom(input: { name: string; category: string }) {
  const existing = await prisma.symptom.findFirst({
    where: { userId: null, name: input.name },
  });

  if (existing) {
    await prisma.symptom.update({
      where: { id: existing.id },
      data: { category: input.category, isActive: true },
    });
  } else {
    await prisma.symptom.create({
      data: { userId: null, name: input.name, category: input.category, isActive: true },
    });
  }
}

async function upsertDefaultHabit(input: { name: string; trackingType: TrackingType; unit: string | null }) {
  const existing = await prisma.habit.findFirst({
    where: { userId: null, name: input.name },
  });

  if (existing) {
    await prisma.habit.update({
      where: { id: existing.id },
      data: { trackingType: input.trackingType, unit: input.unit, isActive: true },
    });
  } else {
    await prisma.habit.create({
      data: {
        userId: null,
        name: input.name,
        trackingType: input.trackingType,
        unit: input.unit,
        isActive: true,
      },
    });
  }
}

async function main() {
  for (const symptom of DEFAULT_SYMPTOMS) {
    await upsertDefaultSymptom(symptom);
  }
  for (const habit of DEFAULT_HABITS) {
    await upsertDefaultHabit(habit);
  }
  console.log(`Seeded ${DEFAULT_SYMPTOMS.length} default symptoms and ${DEFAULT_HABITS.length} default habits.`);
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
