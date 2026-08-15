import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, scopeFilterForSchool } from '@/lib/auth/helpers';
import { updateSchoolSchema } from '@/lib/validators';
import { handleApiError, ApiError } from '@/lib/auth/api-error';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function verifyAccess(id: string, user: any) {
  const school = await prisma.school.findFirst({
    where: { id, ...scopeFilterForSchool(user) }
  });
  if (!school) {
    throw new ApiError(404, 'School not found or access denied');
  }
  return school;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const school = await verifyAccess(id, user);
    return NextResponse.json(school);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN']);
    await verifyAccess(id, user); // Ensure they can access THIS school

    const body = await req.json();
    const validatedData = updateSchoolSchema.parse(body);

    const updatedSchool = await prisma.school.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(updatedSchool);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireAuth(['SUPER_ADMIN']);
    await verifyAccess(id, user);

    await prisma.school.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
