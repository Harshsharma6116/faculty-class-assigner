import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth/helpers';
import { createFacultyUnavailabilitySchema } from '@/lib/validators/faculty';
import { handleApiError } from '@/lib/auth/api-error';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    
    const unavailability = await prisma.facultyUnavailability.findMany({
      where: { facultyId: id },
      orderBy: { startDate: 'asc' }
    });
    
    return NextResponse.json(unavailability);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPT_ADMIN']);
    const { id } = await params;
    const body = await req.json();
    const validatedData = createFacultyUnavailabilitySchema.parse(body);

    const faculty = await prisma.faculty.findUnique({ where: { id } });
    if (!faculty) return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });

    if (user.role === 'DEPT_ADMIN' && user.departmentId !== faculty.departmentId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const start = new Date(validatedData.startDate);
    const end = new Date(validatedData.endDate);

    const overlapping = await prisma.facultyUnavailability.findFirst({
      where: {
        facultyId: id,
        startDate: { lte: end },
        endDate: { gte: start }
      }
    });

    if (overlapping) {
      return NextResponse.json({ error: 'This period overlaps with an existing unavailability block.' }, { status: 400 });
    }

    const record = await prisma.facultyUnavailability.create({
      data: {
        facultyId: id,
        startDate: start,
        endDate: end,
        reason: validatedData.reason
      }
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
