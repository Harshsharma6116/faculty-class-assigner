import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, scopeFilterForFaculty } from '@/lib/auth/helpers';
import { createFacultySchema } from '@/lib/validators';
import { handleApiError } from '@/lib/auth/api-error';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Pagination params
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const departmentId = searchParams.get('departmentId');

    const where = {
      ...scopeFilterForFaculty(user),
      ...(search ? { 
        OR: [
          { fullName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } }
        ]
      } : {}),
      ...(departmentId ? { departmentId } : {})
    };

    const [total, data] = await Promise.all([
      prisma.faculty.count({ where }),
      prisma.faculty.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { fullName: 'asc' },
        include: {
          department: {
            select: { name: true, shortCode: true }
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
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPT_ADMIN']); 
    const body = await req.json();
    
    const validatedData = createFacultySchema.parse(body);

    if (user.role === 'DEPT_ADMIN' && user.departmentId !== validatedData.departmentId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    if (user.role === 'SCHOOL_ADMIN') {
        const dept = await prisma.department.findUnique({ where: { id: validatedData.departmentId } });
        if (dept?.schoolId !== user.schoolId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
    }

    const faculty = await prisma.faculty.create({
      data: validatedData,
      include: {
        department: {
          select: { name: true, shortCode: true }
        }
      }
    });
    
    return NextResponse.json(faculty, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
