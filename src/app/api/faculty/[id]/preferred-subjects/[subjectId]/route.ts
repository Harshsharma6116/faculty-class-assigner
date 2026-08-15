import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, scopeFilterForFaculty } from '@/lib/auth/helpers';
import { handleApiError, ApiError } from '@/lib/auth/api-error';

interface RouteContext {
  params: Promise<{ id: string; subjectId: string }>;
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

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id, subjectId } = await params;
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPT_ADMIN']);
    await verifyAccess(id, user);

    const existing = await prisma.facultyPreferredSubject.findUnique({
      where: {
        facultyId_subjectId: {
          facultyId: id,
          subjectId: subjectId,
        },
      },
    });

    if (!existing) {
      throw new ApiError(404, 'Preferred subject not found');
    }

    await prisma.facultyPreferredSubject.delete({
      where: {
        facultyId_subjectId: {
          facultyId: id,
          subjectId: subjectId,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
