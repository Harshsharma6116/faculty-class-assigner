import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const newPassword = 'password123';
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update all admins
  const users = await prisma.user.updateMany({
    data: { hashedPassword }
  });
  console.log(`Updated ${users.count} admins`);

  // Update all faculty
  const faculty = await prisma.faculty.updateMany({
    data: { hashedPassword }
  });
  console.log(`Updated ${faculty.count} faculty`);

  console.log('All passwords successfully set to: password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
