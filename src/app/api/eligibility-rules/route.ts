import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth/helpers';
import { handleApiError } from '@/lib/auth/api-error';
import { z } from 'zod';

const updateEligibilitySchema = z.object({
  rules: z.array(
    z.object({
      seniorityLevel: z.enum(['ASSISTANT_PROFESSOR', 'ASSOCIATE_PROFESSOR', 'PROFESSOR', 'HOD']),
      degreeLevel: z.enum(['UG', 'PG']),
      allowed: z.boolean(),
    })
  ),
});

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const rules = await prisma.seniorityDegreeEligibility.findMany({
      orderBy: [
        { seniorityLevel: 'asc' },
        { degreeLevel: 'asc' }
      ]
    });
    return NextResponse.json(rules);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(['SUPER_ADMIN']);
    const body = await req.json();
    const { rules } = updateEligibilitySchema.parse(body);

    const updatedRules = await prisma.$transaction(
      rules.map(rule =>
        prisma.seniorityDegreeEligibility.upsert({
          where: {
            seniorityLevel_degreeLevel: {
              seniorityLevel: rule.seniorityLevel,
              degreeLevel: rule.degreeLevel,
            },
          },
          update: { allowed: rule.allowed },
          create: {
            seniorityLevel: rule.seniorityLevel,
            degreeLevel: rule.degreeLevel,
            allowed: rule.allowed,
          },
        })
      )
    );

    return NextResponse.json(updatedRules);
  } catch (error) {
    return handleApiError(error);
  }
}
