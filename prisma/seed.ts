import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ACTIVATION_CODE_COUNT = 200;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';

function randomChar(characters: string): string {
  return characters[Math.floor(Math.random() * characters.length)];
}

function buildRandomActivationCode(): string {
  const prefix = `${randomChar(LETTERS)}${randomChar(LETTERS)}`;
  const suffix = Array.from({ length: 4 }, () => randomChar(DIGITS)).join('');

  return `${prefix}${suffix}`;
}

function buildUniqueActivationCodes(
  count: number,
  existingCodes: Set<string>,
): string[] {
  const codes = new Set<string>();

  while (codes.size < count) {
    const code = buildRandomActivationCode();

    if (!existingCodes.has(code)) {
      codes.add(code);
    }
  }

  return [...codes];
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run local seed script in production.');
  }

  const existingActivationCodes = await prisma.activationCode.findMany({
    select: { code: true },
  });
  const existingCodes = new Set(
    existingActivationCodes.map(({ code }) => code),
  );
  const missingCodeCount = ACTIVATION_CODE_COUNT - existingCodes.size;

  if (missingCodeCount <= 0) {
    console.log(
      `Activation code seed skipped. ${existingCodes.size} codes already exist.`,
    );
    return;
  }

  const codes = buildUniqueActivationCodes(missingCodeCount, existingCodes);

  await prisma.activationCode.createMany({
    data: codes.map((code) => ({ code })),
    skipDuplicates: true,
  });

  console.log(`Seeded ${codes.length} activation codes:`);
  console.log(codes.join(', '));
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
