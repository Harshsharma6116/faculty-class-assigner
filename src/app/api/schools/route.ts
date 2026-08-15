import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, scopeFilterForSchool } from '@/lib/auth/helpers';
import { createSchoolSchema } from '@/lib/validators';
import { handleApiError } from '@/lib/auth/api-error';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Pagination params
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';

    const where = {
      ...scopeFilterForSchool(user),
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    const [total, data] = await Promise.all([
      prisma.school.count({ where }),
      prisma.school.findMany({
        where,
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
    const user = await requireAuth(['SUPER_ADMIN']); // Only super admin can create schools
    const body = await req.json();
    
    const validatedData = createSchoolSchema.parse(body);
    
    const school = await prisma.school.create({
      data: validatedData,
    });
    
    return NextResponse.json(school, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
