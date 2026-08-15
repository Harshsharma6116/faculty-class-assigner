import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, scopeFilterForRoom } from '@/lib/auth/helpers';
import { updateRoomSchema } from '@/lib/validators';
import { handleApiError, ApiError } from '@/lib/auth/api-error';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function verifyAccess(id: string, user: any) {
  const room = await prisma.room.findFirst({
    where: { id, ...scopeFilterForRoom(user) },
    include: { school: true },
  });
  if (!room) {
    throw new ApiError(404, 'Room not found or access denied');
  }
  return room;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const room = await verifyAccess(id, user);
    return NextResponse.json(room);
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
    const validatedData = updateRoomSchema.parse(body);

    if (user.role === 'SCHOOL_ADMIN' && validatedData.schoolId && validatedData.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Cannot move room to another school' }, { status: 403 });
    }

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: validatedData,
      include: { school: true },
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN']);
    await verifyAccess(id, user);

    await prisma.room.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
