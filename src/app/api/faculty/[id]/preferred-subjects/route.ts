import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth/helpers';
import { createFacultyPreferredSubjectSchema } from '@/lib/validators/faculty';
import { handleApiError } from '@/lib/auth/api-error';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    
    const preferredSubjects = await prisma.facultyPreferredSubject.findMany({
      where: { facultyId: id },
      include: { subject: true },
      orderBy: { preferenceRank: 'asc' }
    });
    
    return NextResponse.json(preferredSubjects);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPT_ADMIN']);
    const { id } = await params;
    const body = await req.json();
    const validatedData = createFacultyPreferredSubjectSchema.parse(body);

    const faculty = await prisma.faculty.findUnique({ where: { id } });
    if (!faculty) return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });

    const subject = await prisma.subject.findUnique({ where: { id: validatedData.subjectId } });
    if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 });

    if (faculty.departmentId !== subject.departmentId) {
        return NextResponse.json({ error: 'Subject does not belong to faculty department' }, { status: 400 });
    }

    if (user.role === 'DEPT_ADMIN' && user.departmentId !== faculty.departmentId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if the subject is already preferred
    const alreadyPreferred = await prisma.facultyPreferredSubject.findFirst({
        where: { facultyId: id, subjectId: validatedData.subjectId }
    });
    if (alreadyPreferred) {
        return NextResponse.json({ error: 'This subject is already in the preferred list' }, { status: 400 });
    }

    // Check if the rank is already taken by another subject
    const existingRank = await prisma.facultyPreferredSubject.findFirst({
        where: { facultyId: id, preferenceRank: validatedData.preferenceRank }
    });
    if (existingRank) {
        return NextResponse.json({ error: `Rank ${validatedData.preferenceRank} is already assigned to another subject` }, { status: 400 });
    }

    const record = await prisma.facultyPreferredSubject.create({
      data: {
        facultyId: id,
        subjectId: validatedData.subjectId,
        preferenceRank: validatedData.preferenceRank,
      },
      include: { subject: true }
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
