import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, scopeFilterForBatch } from '@/lib/auth/helpers';
import { createBatchSchema } from '@/lib/validators';
import { handleApiError } from '@/lib/auth/api-error';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const departmentId = searchParams.get('departmentId');
    const semesterId = searchParams.get('semesterId');

    const baseWhere = scopeFilterForBatch(user);
    
    const where = {
      ...baseWhere,
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(semesterId ? { semesterId } : {}),
    };

    const [total, data] = await Promise.all([
      prisma.batch.count({ where }),
      prisma.batch.findMany({
        where,
        include: { department: true, semester: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: 'asc' },
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
    
    const validatedData = createBatchSchema.parse(body);

    // DEPT_ADMIN can only create batches for their department
    if (user.role === 'DEPT_ADMIN' && validatedData.departmentId !== user.departmentId) {
      return NextResponse.json({ error: 'Cannot create batch for another department' }, { status: 403 });
    }
    
    const batch = await prisma.batch.create({
      data: validatedData,
      include: { department: true, semester: true },
    });
    
    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
