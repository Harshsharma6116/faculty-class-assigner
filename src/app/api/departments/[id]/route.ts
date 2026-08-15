import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, scopeFilterForDepartment } from '@/lib/auth/helpers';
import { updateDepartmentSchema } from '@/lib/validators';
import { handleApiError, ApiError } from '@/lib/auth/api-error';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function verifyAccess(id: string, user: any) {
  const department = await prisma.department.findFirst({
    where: { id, ...scopeFilterForDepartment(user) }
  });
  if (!department) {
    throw new ApiError(404, 'Department not found or access denied');
  }
  return department;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const department = await verifyAccess(id, user);
    return NextResponse.json(department);
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
    const validatedData = updateDepartmentSchema.parse(body);

    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: validatedData,
      include: {
        school: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json(updatedDepartment);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN']);
    await verifyAccess(id, user);

    await prisma.department.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
