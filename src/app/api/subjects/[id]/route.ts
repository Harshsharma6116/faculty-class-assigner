import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, scopeFilterForSubject } from '@/lib/auth/helpers';
import { updateSubjectSchema } from '@/lib/validators';
import { handleApiError, ApiError } from '@/lib/auth/api-error';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    
    const subject = await prisma.subject.findFirst({
      where: {
        id,
        ...scopeFilterForSubject(user),
      },
      include: {
        department: {
          select: { id: true, name: true, shortCode: true }
        }
      }
    });

    if (!subject) {
      throw new ApiError(404, 'Subject not found');
    }

    return NextResponse.json(subject);
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
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPT_ADMIN']);
    
    // First verify the subject exists and user has access to it
    const existingSubject = await prisma.subject.findFirst({
      where: {
        id,
        ...scopeFilterForSubject(user),
      },
    });

    if (!existingSubject) {
      throw new ApiError(404, 'Subject not found or you do not have permission');
    }

    const body = await req.json();
    const validatedData = updateSubjectSchema.parse(body);
    
    const subject = await prisma.subject.update({
      where: { id },
      data: validatedData,
    });
    
    return NextResponse.json(subject);
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
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPT_ADMIN']);
    
    const existingSubject = await prisma.subject.findFirst({
      where: {
        id,
        ...scopeFilterForSubject(user),
      },
    });

    if (!existingSubject) {
      throw new ApiError(404, 'Subject not found or you do not have permission');
    }

    await prisma.subject.delete({
      where: { id },
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Check for foreign key constraint errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete subject because it is referenced by other records' },
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}
