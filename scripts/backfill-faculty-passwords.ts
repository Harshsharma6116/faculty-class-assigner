import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting faculty password backfill...');
  
  const faculties = await prisma.faculty.findMany({
    where: { hashedPassword: null }
  });

  if (faculties.length === 0) {
    console.log('No faculty found needing password backfill.');
    return;
  }

  console.log(`Found ${faculties.length} faculty members. Generating hashes...`);
  
  const defaultPassword = 'Amity@123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);

  const result = await prisma.faculty.updateMany({
    where: { hashedPassword: null },
    data: { hashedPassword }
  });

  console.log(`Successfully backfilled passwords for ${result.count} faculty members.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
