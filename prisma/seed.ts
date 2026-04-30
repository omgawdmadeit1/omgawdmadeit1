import { prisma } from "../lib/prisma";

async function main() {
  await prisma.user.upsert({
    where: { id: "default-user" },
    update: {},
    create: { id: "default-user", requireApproval: true, dailyPostLimit: 10 },
  });
}

main().finally(async () => prisma.$disconnect());
