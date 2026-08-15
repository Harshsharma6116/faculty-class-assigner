import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth/helpers';
import { handleApiError, ApiError } from '@/lib/auth/api-error';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // 1. Authenticate user
    const user = await requireAuth();

    // 2. Validate semester existence
    const semester = await prisma.semester.findUnique({
      where: { id },
    });
    if (!semester) {
      throw new ApiError(404, 'Semester not found');
    }

    // 3. Apply scope filtering on runByUser's hierarchy
    const where: any = { semesterId: id };
    if (user.role === 'SCHOOL_ADMIN') {
      where.runByUser = { schoolId: user.schoolId };
    } else if (user.role === 'DEPT_ADMIN') {
      where.runByUser = { departmentId: user.departmentId };
    }

    // 4. Fetch the allocation runs
    const runs = await prisma.allocationRun.findMany({
      where,
      include: {
        runByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        runAt: 'desc',
      },
    });

    return NextResponse.json(runs);
  } catch (error) {
    return handleApiError(error);
  }
}
