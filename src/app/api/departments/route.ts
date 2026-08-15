import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, scopeFilterForDepartment } from '@/lib/auth/helpers';
import { createDepartmentSchema } from '@/lib/validators';
import { handleApiError } from '@/lib/auth/api-error';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Pagination params
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const schoolId = searchParams.get('schoolId');

    const where = {
      ...scopeFilterForDepartment(user),
      ...(search ? { 
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { shortCode: { contains: search, mode: 'insensitive' as const } }
        ]
      } : {}),
      ...(schoolId ? { schoolId } : {})
    };

    const [total, data] = await Promise.all([
      prisma.department.count({ where }),
      prisma.department.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: 'asc' },
        include: {
          school: {
            select: { name: true }
          }
        }
      }),
    ]);

    return NextResponse.json({
      data,
      metadata: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN']); 
    const body = await req.json();
    
    const validatedData = createDepartmentSchema.parse(body);

    if (user.role === 'SCHOOL_ADMIN' && user.schoolId !== validatedData.schoolId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const department = await prisma.department.create({
      data: validatedData,
      include: {
        school: {
          select: { name: true }
        }
      }
    });
    
    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
