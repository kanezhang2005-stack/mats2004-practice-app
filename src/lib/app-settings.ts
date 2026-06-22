import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const AI_EXPLANATIONS_ENABLED_KEY = "ai_explanations_enabled";

export async function getAiExplanationsEnabled() {
  if (!process.env.DATABASE_URL) {
    return true;
  }

  const setting = await prisma.appSetting.findUnique({
    where: { key: AI_EXPLANATIONS_ENABLED_KEY }
  });
  return typeof setting?.value === "boolean" ? setting.value : true;
}

export async function setAiExplanationsEnabled(enabled: boolean) {
  const setting = await prisma.appSetting.upsert({
    where: { key: AI_EXPLANATIONS_ENABLED_KEY },
    create: { key: AI_EXPLANATIONS_ENABLED_KEY, value: enabled as unknown as Prisma.InputJsonValue },
    update: { value: enabled as unknown as Prisma.InputJsonValue }
  });
  return typeof setting.value === "boolean" ? setting.value : enabled;
}
