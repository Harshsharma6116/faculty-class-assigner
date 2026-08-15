import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth/helpers';
import { createSemesterSchema } from '@/lib/validators';
import { handleApiError } from '@/lib/auth/api-error';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(); // All authenticated users can view semesters
    
    // Pagination params
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const isActiveStr = searchParams.get('isActive');

    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    
    if (isActiveStr === 'true') {
      where.isActive = true;
    } else if (isActiveStr === 'false') {
      where.isActive = false;
    }

    const [total, data] = await Promise.all([
      prisma.semester.count({ where }),
      prisma.semester.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { startDate: 'desc' },
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
    await requireAuth(['SUPER_ADMIN']); // Only super admin can create semesters
    const body = await req.json();
    
    const validatedData = createSemesterSchema.parse(body);
    
    // If making this semester active, optionally deactivate others? 
    // The schema doesn't strictly enforce one active semester, but often good practice.
    // For now, we just save what's provided.
    
    const semester = await prisma.semester.create({
      data: {
        name: validatedData.name,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        isActive: validatedData.isActive
      },
    });
    
    return NextResponse.json(semester, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
