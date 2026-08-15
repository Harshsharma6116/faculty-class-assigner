import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth/helpers';
import { handleApiError } from '@/lib/auth/api-error';

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user (SUPER_ADMIN, SCHOOL_ADMIN, DEPT_ADMIN allowed)
    const user = await requireAuth();

    // 2. Parse search and query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const entityType = searchParams.get('entityType');
    const action = searchParams.get('action');

    // 3. Define scope filtering based on user role
    const baseWhere: any = {};
    if (user.role === 'SCHOOL_ADMIN') {
      baseWhere.user = { schoolId: user.schoolId };
    } else if (user.role === 'DEPT_ADMIN') {
      baseWhere.user = { departmentId: user.departmentId };
    }

    // 4. Construct filters
    const where: any = {
      ...baseWhere,
    };

    if (entityType) {
      where.entityType = entityType;
    }

    if (action) {
      where.action = action;
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' as const } },
        { entityId: { contains: search, mode: 'insensitive' as const } },
        { reason: { contains: search, mode: 'insensitive' as const } },
        {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          },
        },
      ];
    }

    // 5. Fetch count and data concurrently
    const [total, data] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
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
