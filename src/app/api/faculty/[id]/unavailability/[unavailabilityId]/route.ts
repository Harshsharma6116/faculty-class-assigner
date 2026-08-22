import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth/helpers';
import { handleApiError } from '@/lib/auth/api-error';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string, unavailabilityId: string }> }) {
  try {
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPT_ADMIN']);
    const { id, unavailabilityId } = await params;

    const faculty = await prisma.faculty.findUnique({ where: { id } });
    if (!faculty) return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });

    if (user.role === 'DEPT_ADMIN' && user.departmentId !== faculty.departmentId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const record = await prisma.facultyUnavailability.findUnique({ where: { id: unavailabilityId } });
    if (!record || record.facultyId !== id) {
         return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.facultyUnavailability.delete({ where: { id: unavailabilityId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
