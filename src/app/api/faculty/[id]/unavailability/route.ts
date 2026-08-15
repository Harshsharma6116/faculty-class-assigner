import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, scopeFilterForFaculty } from '@/lib/auth/helpers';
import { createFacultyUnavailabilitySchema } from '@/lib/validators';
import { handleApiError, ApiError } from '@/lib/auth/api-error';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function verifyAccess(id: string, user: any) {
  const faculty = await prisma.faculty.findFirst({
    where: { id, ...scopeFilterForFaculty(user) },
  });
  if (!faculty) {
    throw new ApiError(404, 'Faculty not found or access denied');
  }
  return faculty;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    await verifyAccess(id, user);

    const unavailability = await prisma.facultyUnavailability.findMany({
      where: { facultyId: id },
      orderBy: {
        startDate: 'asc',
      },
    });

    return NextResponse.json(unavailability);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPT_ADMIN']);
    await verifyAccess(id, user);

    const body = await req.json();
    const validatedData = createFacultyUnavailabilitySchema.parse(body);

    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (endDate < startDate) {
      throw new ApiError(400, 'End date cannot be before start date');
    }

    const unavailability = await prisma.facultyUnavailability.create({
      data: {
        facultyId: id,
        startDate,
        endDate,
        reason: validatedData.reason,
      },
    });

    return NextResponse.json(unavailability, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
