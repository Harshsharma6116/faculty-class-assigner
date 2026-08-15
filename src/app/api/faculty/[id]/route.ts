import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, scopeFilterForFaculty } from '@/lib/auth/helpers';
import { updateFacultySchema } from '@/lib/validators';
import { handleApiError, ApiError } from '@/lib/auth/api-error';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function verifyAccess(id: string, user: any) {
  const faculty = await prisma.faculty.findFirst({
    where: { id, ...scopeFilterForFaculty(user) }
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
    const faculty = await verifyAccess(id, user);
    return NextResponse.json(faculty);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPT_ADMIN']);
    await verifyAccess(id, user); 

    const body = await req.json();
    const validatedData = updateFacultySchema.parse(body);

    const updatedFaculty = await prisma.faculty.update({
      where: { id },
      data: validatedData,
      include: {
        department: {
          select: { name: true, shortCode: true }
        }
      }
    });

    return NextResponse.json(updatedFaculty);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPT_ADMIN']);
    await verifyAccess(id, user);

    await prisma.faculty.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
