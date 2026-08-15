import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, scopeFilterForSubject } from '@/lib/auth/helpers';
import { createSubjectSchema } from '@/lib/validators';
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

    // Build where clause
    const where: any = {
      ...scopeFilterForSubject(user),
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (departmentId) {
      where.departmentId = departmentId;
    }

    const [total, data] = await Promise.all([
      prisma.subject.count({ where }),
      prisma.subject.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { code: 'asc' },
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
    
    const validatedData = createSubjectSchema.parse(body);
    
    // Check if the user is allowed to create a subject in this department
    if (user.role === 'DEPT_ADMIN' && user.departmentId !== validatedData.departmentId) {
      return NextResponse.json({ error: 'You can only create subjects in your own department' }, { status: 403 });
    }
    if (user.role === 'SCHOOL_ADMIN') {
      const department = await prisma.department.findUnique({
        where: { id: validatedData.departmentId },
        select: { schoolId: true }
      });
      if (department?.schoolId !== user.schoolId) {
        return NextResponse.json({ error: 'You can only create subjects in your own school' }, { status: 403 });
      }
    }
    
    const subject = await prisma.subject.create({
      data: validatedData,
    });
    
    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
