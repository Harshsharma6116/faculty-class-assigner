import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth/helpers';
import { updateSemesterSchema } from '@/lib/validators';
import { handleApiError, ApiError } from '@/lib/auth/api-error';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAuth();
    
    const semester = await prisma.semester.findUnique({
      where: { id },
    });

    if (!semester) {
      throw new ApiError(404, 'Semester not found');
    }

    return NextResponse.json(semester);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAuth(['SUPER_ADMIN']);
    
    const existingSemester = await prisma.semester.findUnique({
      where: { id },
    });

    if (!existingSemester) {
      throw new ApiError(404, 'Semester not found');
    }

    const body = await req.json();
    const validatedData = updateSemesterSchema.parse(body);
    
    const updateData: any = { ...validatedData };
    if (validatedData.startDate) updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate) updateData.endDate = new Date(validatedData.endDate);

    const semester = await prisma.semester.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(semester);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAuth(['SUPER_ADMIN']);
    
    const existingSemester = await prisma.semester.findUnique({
      where: { id },
    });

    if (!existingSemester) {
      throw new ApiError(404, 'Semester not found');
    }

    await prisma.semester.delete({
      where: { id },
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Check for foreign key constraint errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete semester because it is referenced by other records (e.g. batches, classes)' },
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}
