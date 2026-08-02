import { randomInt } from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ACTIVATION_CODE_COUNT = 200;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SEED_LOCK_NAMESPACE = 20260802;
const SEED_LOCK_KEY = 1;

function randomChar(characters: string): string {
  return characters[randomInt(characters.length)];
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

  const result = await prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`
      SELECT pg_advisory_xact_lock(
        ${SEED_LOCK_NAMESPACE}::integer,
        ${SEED_LOCK_KEY}::integer
      )
    `;

    const existingActivationCodes = await transaction.activationCode.findMany({
      select: { code: true },
    });
    const existingCodes = new Set(
      existingActivationCodes.map(({ code }) => code),
    );
    const missingCodeCount = ACTIVATION_CODE_COUNT - existingCodes.size;

    if (missingCodeCount <= 0) {
      return {
        existingCodeCount: existingCodes.size,
        insertedCount: 0,
        codes: [],
      };
    }

    const codes = buildUniqueActivationCodes(missingCodeCount, existingCodes);
    const createManyResult = await transaction.activationCode.createMany({
      data: codes.map((code) => ({ code })),
      skipDuplicates: true,
    });

    return {
      existingCodeCount: existingCodes.size,
      insertedCount: createManyResult.count,
      codes,
    };
  });

  if (result.insertedCount === 0) {
    console.log(
      `Activation code seed skipped. ${result.existingCodeCount} codes already exist.`,
    );
    return;
  }

  console.log(`Seeded ${result.insertedCount} activation codes:`);
  console.log(result.codes.join(', '));
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
