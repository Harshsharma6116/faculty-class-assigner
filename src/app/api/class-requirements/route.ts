import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth/helpers';
import { handleApiError, ApiError } from '@/lib/auth/api-error';

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await requireAuth();

    // 2. Parse search and query parameters
    const searchParams = req.nextUrl.searchParams;
    const semesterId = searchParams.get('semesterId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const departmentId = searchParams.get('departmentId');

    if (!semesterId) {
      throw new ApiError(400, 'semesterId query parameter is required');
    }

    // 3. Define scope filtering
    const baseWhere: any = { semesterId };
    if (user.role === 'SCHOOL_ADMIN') {
      baseWhere.subject = {
        department: { schoolId: user.schoolId }
      };
    } else if (user.role === 'DEPT_ADMIN') {
      baseWhere.subject = {
        departmentId: user.departmentId
      };
    }

    // 4. Construct filters
    const where: any = {
      ...baseWhere,
    };

    if (status) {
      where.status = status;
    }

    if (departmentId) {
      if (user.role === 'DEPT_ADMIN' && departmentId !== user.departmentId) {
        throw new ApiError(403, 'Permission denied: cannot access another department');
      }
      
      // Merge with subject department criteria
      where.subject = {
        ...(where.subject || {}),
        departmentId: departmentId,
      };
    }

    if (search) {
      where.OR = [
        { subject: { name: { contains: search, mode: 'insensitive' as const } } },
        { subject: { code: { contains: search, mode: 'insensitive' as const } } },
        { batch: { name: { contains: search, mode: 'insensitive' as const } } },
        { room: { name: { contains: search, mode: 'insensitive' as const } } },
      ];
    }

    // 5. Fetch count and data concurrently
    const [total, data] = await Promise.all([
      prisma.classRequirement.count({ where }),
      prisma.classRequirement.findMany({
        where,
        include: {
          subject: {
            include: {
              department: true,
            },
          },
          batch: true,
          room: true,
          assignedFaculty: {
            select: {
              id: true,
              fullName: true,
              email: true,
              seniorityLevel: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          subject: {
            code: 'asc',
          },
        },
      }),
    ]);

    return NextResponse.json({
      data,
      metadata: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
