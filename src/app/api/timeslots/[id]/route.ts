import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, scopeFilterForTimeSlot } from '@/lib/auth/helpers';
import { updateTimeSlotSchema } from '@/lib/validators';
import { handleApiError, ApiError } from '@/lib/auth/api-error';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function verifyAccess(id: string, user: any) {
  const timeSlot = await prisma.timeSlot.findFirst({
    where: { id, ...scopeFilterForTimeSlot(user) },
    include: { school: true },
  });
  if (!timeSlot) {
    throw new ApiError(404, 'TimeSlot not found or access denied');
  }
  return timeSlot;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const timeSlot = await verifyAccess(id, user);
    return NextResponse.json(timeSlot);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN']);
    await verifyAccess(id, user);

    const body = await req.json();
    const validatedData = updateTimeSlotSchema.parse(body);

    if (user.role === 'SCHOOL_ADMIN' && (validatedData as any).schoolId && (validatedData as any).schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Cannot move time slot to another school' }, { status: 403 });
    }

    const updatedTimeSlot = await prisma.timeSlot.update({
      where: { id },
      data: validatedData,
      include: { school: true },
    });

    return NextResponse.json(updatedTimeSlot);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN']);
    await verifyAccess(id, user);

    await prisma.timeSlot.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
