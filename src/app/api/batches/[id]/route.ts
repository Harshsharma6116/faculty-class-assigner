import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, scopeFilterForBatch } from '@/lib/auth/helpers';
import { updateBatchSchema } from '@/lib/validators';
import { handleApiError, ApiError } from '@/lib/auth/api-error';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function verifyAccess(id: string, user: any) {
  const batch = await prisma.batch.findFirst({
    where: { id, ...scopeFilterForBatch(user) },
    include: { department: true, semester: true },
  });
  if (!batch) {
    throw new ApiError(404, 'Batch not found or access denied');
  }
  return batch;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const batch = await verifyAccess(id, user);
    return NextResponse.json(batch);
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
    const validatedData = updateBatchSchema.parse(body);

    // DEPT_ADMIN can only change department to their own department
    if (user.role === 'DEPT_ADMIN' && validatedData.departmentId && validatedData.departmentId !== user.departmentId) {
      return NextResponse.json({ error: 'Cannot move batch to another department' }, { status: 403 });
    }

    const updatedBatch = await prisma.batch.update({
      where: { id },
      data: validatedData,
      include: { department: true, semester: true },
    });

    return NextResponse.json(updatedBatch);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPT_ADMIN']);
    await verifyAccess(id, user);

    await prisma.batch.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
