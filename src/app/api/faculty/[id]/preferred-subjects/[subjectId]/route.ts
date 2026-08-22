import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth/helpers';
import { handleApiError } from '@/lib/auth/api-error';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string, subjectId: string }> }) {
  try {
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPT_ADMIN']);
    const { id, subjectId } = await params;

    const faculty = await prisma.faculty.findUnique({ where: { id } });
    if (!faculty) return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });

    if (user.role === 'DEPT_ADMIN' && user.departmentId !== faculty.departmentId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.facultyPreferredSubject.delete({
      where: {
        facultyId_subjectId: {
          facultyId: id,
          subjectId: subjectId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
