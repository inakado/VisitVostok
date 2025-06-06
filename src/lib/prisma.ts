import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

const createPrismaClient = () => {
  // Во время build в CI не подключаемся к базе
  if (process.env.SKIP_ENV_VALIDATION === "true" || process.env.NODE_ENV === "test") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return null as any; // Возвращаем mock для CI build
  }
  
  return new PrismaClient().$extends(withAccelerate());
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;