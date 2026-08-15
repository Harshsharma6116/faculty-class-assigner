import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, scopeFilterForTimeSlot } from '@/lib/auth/helpers';
import { createTimeSlotSchema } from '@/lib/validators';
import { handleApiError } from '@/lib/auth/api-error';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50'); // Usually load more slots
    const schoolId = searchParams.get('schoolId');
    const dayOfWeek = searchParams.get('dayOfWeek');

    const baseWhere = scopeFilterForTimeSlot(user);
    
    const where = {
      ...baseWhere,
      ...(schoolId ? { schoolId } : {}),
      ...(dayOfWeek ? { dayOfWeek: dayOfWeek as any } : {}),
    };

    const [total, data] = await Promise.all([
      prisma.timeSlot.count({ where }),
      prisma.timeSlot.findMany({
        where,
        include: { school: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [
          { dayOfWeek: 'asc' },
          { periodNumber: 'asc' }
        ],
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
    
    const validatedData = createTimeSlotSchema.parse(body);

    if (user.role === 'SCHOOL_ADMIN' && validatedData.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Cannot create time slot for another school' }, { status: 403 });
    }
    
    const timeSlot = await prisma.timeSlot.create({
      data: validatedData,
      include: { school: true },
    });
    
    return NextResponse.json(timeSlot, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
