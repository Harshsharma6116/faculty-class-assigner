import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth/helpers';
import { manualAssignSchema } from '@/lib/validators/class-requirement';
import { handleApiError, ApiError } from '@/lib/auth/api-error';
import { ZodError } from 'zod';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // 1. Authenticate user (SUPER_ADMIN, SCHOOL_ADMIN, DEPT_ADMIN allowed)
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPT_ADMIN']);

    // 2. Parse and validate request body
    const body = await req.json();
    const validated = manualAssignSchema.parse(body);

    // 3. Load the target ClassRequirement and verify it exists
    const classReq = await prisma.classRequirement.findUnique({
      where: { id },
      include: {
        subject: {
          include: { department: true },
        },
        batch: true,
        room: true,
      },
    });

    if (!classReq) {
      throw new ApiError(404, 'Class requirement not found');
    }

    // 4. Role-based gating: ensure requirement belongs to the user's school/department
    if (user.role === 'SCHOOL_ADMIN' && classReq.subject.department.schoolId !== user.schoolId) {
      throw new ApiError(403, 'Permission denied: class requirement belongs to another school');
    }
    if (user.role === 'DEPT_ADMIN' && classReq.subject.departmentId !== user.departmentId) {
      throw new ApiError(403, 'Permission denied: class requirement belongs to another department');
    }

    // 5. Load and validate target Faculty
    const faculty = await prisma.faculty.findUnique({
      where: { id: validated.facultyId },
      include: { department: true },
    });

    if (!faculty) {
      throw new ApiError(404, 'Faculty not found');
    }

    // Faculty role scope check
    if (user.role === 'SCHOOL_ADMIN' && faculty.department.schoolId !== user.schoolId) {
      throw new ApiError(403, 'Permission denied: Faculty belongs to another school');
    }
    if (user.role === 'DEPT_ADMIN' && faculty.departmentId !== user.departmentId) {
      throw new ApiError(403, 'Permission denied: Faculty belongs to another department');
    }

    // 6. Check for conflict warnings
    // Look for other assignments in the same semester and slots for faculty, batch, or room
    const overlaps = await prisma.classRequirement.findMany({
      where: {
        semesterId: classReq.semesterId,
        id: { not: id },
        status: { in: ['AUTO_ASSIGNED', 'MANUALLY_ASSIGNED'] },
        assignedTimeSlotIds: { hasSome: validated.timeSlotIds },
        OR: [
          { assignedFacultyId: validated.facultyId },
          { batchId: classReq.batchId },
          { roomId: classReq.roomId },
        ],
      },
      include: {
        subject: true,
        batch: true,
        room: true,
        assignedFaculty: true,
      },
    });

    const warnings: string[] = [];
    for (const overlap of overlaps) {
      const commonSlots = overlap.assignedTimeSlotIds.filter(id => validated.timeSlotIds.includes(id));
      if (overlap.assignedFacultyId === validated.facultyId) {
        warnings.push(
          `Faculty ${overlap.assignedFaculty?.fullName || validated.facultyId} is already assigned to "${overlap.subject.name} (${overlap.subject.code})" for Batch "${overlap.batch.name}" during slot(s): ${commonSlots.join(', ')}.`
        );
      }
      if (overlap.batchId === classReq.batchId) {
        warnings.push(
          `Batch "${overlap.batch.name}" is already scheduled for "${overlap.subject.name} (${overlap.subject.code})" in room "${overlap.room.name}" during slot(s): ${commonSlots.join(', ')}.`
        );
      }
      if (overlap.roomId === classReq.roomId) {
        warnings.push(
          `Room "${overlap.room.name}" is already occupied by "${overlap.subject.name} (${overlap.subject.code})" for Batch "${overlap.batch.name}" during slot(s): ${commonSlots.join(', ')}.`
        );
      }
    }

    if (warnings.length > 0) {
      console.warn(`Manual assignment conflict warnings for requirement ${id}:`, warnings);
    }

    // 7. Prepare audit log parameters
    const previousValues = {
      assignedFacultyId: classReq.assignedFacultyId,
      assignedTimeSlotIds: classReq.assignedTimeSlotIds,
      status: classReq.status,
    };
    const newValues = {
      assignedFacultyId: validated.facultyId,
      assignedTimeSlotIds: validated.timeSlotIds,
      status: 'MANUALLY_ASSIGNED',
    };

    // 8. Execute update and logging in a database transaction
    let updatedClassReq;
    await prisma.$transaction(async (tx) => {
      updatedClassReq = await tx.classRequirement.update({
        where: { id },
        data: {
          status: 'MANUALLY_ASSIGNED',
          assignedFacultyId: validated.facultyId,
          assignedTimeSlotIds: validated.timeSlotIds,
          conflictReason: null, // clear any scheduling conflict messages
        },
        include: {
          subject: true,
          batch: true,
          room: true,
          assignedFaculty: true,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'MANUAL_ASSIGN',
          entityType: 'ClassRequirement',
          entityId: id,
          previousValues: previousValues as any,
          newValues: newValues as any,
          reason: validated.reason || 'Manual assignment override',
        },
      });
    });

    return NextResponse.json({
      classRequirement: updatedClassReq,
      warnings,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        },
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}
