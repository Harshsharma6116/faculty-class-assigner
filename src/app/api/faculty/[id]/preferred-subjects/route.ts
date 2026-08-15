import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, scopeFilterForFaculty } from '@/lib/auth/helpers';
import { createFacultyPreferredSubjectSchema } from '@/lib/validators';
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

    const preferredSubjects = await prisma.facultyPreferredSubject.findMany({
      where: { facultyId: id },
      include: {
        subject: true,
      },
      orderBy: {
        preferenceRank: 'asc',
      },
    });

    return NextResponse.json(preferredSubjects);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPT_ADMIN']);
    const faculty = await verifyAccess(id, user);

    const body = await req.json();
    const validatedData = createFacultyPreferredSubjectSchema.parse(body);

    // Verify that the subject belongs to the same department as the faculty
    const subject = await prisma.subject.findFirst({
      where: {
        id: validatedData.subjectId,
        departmentId: faculty.departmentId,
      },
    });

    if (!subject) {
      throw new ApiError(400, 'Subject not found or does not belong to the same department as the faculty');
    }

    // Check if the preference already exists
    const existing = await prisma.facultyPreferredSubject.findUnique({
      where: {
        facultyId_subjectId: {
          facultyId: id,
          subjectId: validatedData.subjectId,
        },
      },
    });

    if (existing) {
      throw new ApiError(400, 'Subject is already in the preferred subjects list');
    }

    const preferredSubject = await prisma.facultyPreferredSubject.create({
      data: {
        facultyId: id,
        subjectId: validatedData.subjectId,
        preferenceRank: validatedData.preferenceRank,
      },
      include: {
        subject: true,
      },
    });

    return NextResponse.json(preferredSubject, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
