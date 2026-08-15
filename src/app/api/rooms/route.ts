import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, scopeFilterForRoom } from '@/lib/auth/helpers';
import { createRoomSchema } from '@/lib/validators';
import { handleApiError } from '@/lib/auth/api-error';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const schoolId = searchParams.get('schoolId');

    const baseWhere = scopeFilterForRoom(user);
    
    const where = {
      ...baseWhere,
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      ...(schoolId ? { schoolId } : {}),
    };

    const [total, data] = await Promise.all([
      prisma.room.count({ where }),
      prisma.room.findMany({
        where,
        include: { school: true },
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
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN']);
    const body = await req.json();
    
    const validatedData = createRoomSchema.parse(body);

    if (user.role === 'SCHOOL_ADMIN' && validatedData.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Cannot create room for another school' }, { status: 403 });
    }
    
    const room = await prisma.room.create({
      data: validatedData,
      include: { school: true },
    });
    
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
