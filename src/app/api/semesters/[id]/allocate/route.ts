import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, scopeFilterForFaculty, scopeFilterForRoom, scopeFilterForTimeSlot } from '@/lib/auth/helpers';
import { runAllocationEngine } from '@/lib/allocation/engine';
import { handleApiError, ApiError } from '@/lib/auth/api-error';
import type { 
  AllocationClassRequirement, 
  AllocationFaculty, 
  AllocationTimeSlot, 
  AllocationEligibilityRule,
  AllocationRunStatus
} from '@/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // 1. Authenticate with role check (only admin roles allowed)
    const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPT_ADMIN']);

    // 2. Validate semester existence
    const semester = await prisma.semester.findUnique({
      where: { id },
    });
    if (!semester) {
      throw new ApiError(404, 'Semester not found');
    }

    // 3. Define scope filters based on user role
    const reqWhere: any = { semesterId: id };
    if (user.role === 'SCHOOL_ADMIN') {
      reqWhere.subject = {
        department: { schoolId: user.schoolId }
      };
    } else if (user.role === 'DEPT_ADMIN') {
      reqWhere.subject = {
        departmentId: user.departmentId
      };
    }

    // 4. Load database entities: ClassRequirements, Faculty, Rooms, TimeSlots, EligibilityRules
    const [dbClassReqs, dbFaculty, dbRooms, dbTimeSlots, dbEligibilityRules] = await Promise.all([
      prisma.classRequirement.findMany({
        where: reqWhere,
        include: {
          subject: true,
          batch: true,
          room: true,
        },
      }),
      prisma.faculty.findMany({
        where: {
          ...scopeFilterForFaculty(user),
          isActive: true,
        },
        include: {
          preferredSubjects: true,
          preferredBatches: true,
          unavailability: true,
        },
      }),
      prisma.room.findMany({
        where: scopeFilterForRoom(user),
      }),
      prisma.timeSlot.findMany({
        where: scopeFilterForTimeSlot(user),
      }),
      prisma.seniorityDegreeEligibility.findMany(),
    ]);

    // 5. Build AllocationInput mappings
    const classRequirements: AllocationClassRequirement[] = dbClassReqs.map(cr => ({
      id: cr.id,
      subjectId: cr.subjectId,
      subjectCode: cr.subject.code,
      subjectName: cr.subject.name,
      batchId: cr.batchId,
      batchName: cr.batch.name,
      roomId: cr.roomId,
      departmentId: cr.subject.departmentId,
      degreeLevel: cr.subject.degreeLevel,
      classType: cr.classType,
      sessionsPerWeek: cr.sessionsPerWeek,
    }));

    const faculty: AllocationFaculty[] = dbFaculty.map(f => ({
      id: f.id,
      fullName: f.fullName,
      departmentId: f.departmentId,
      seniorityLevel: f.seniorityLevel,
      maxClassesPerDay: f.maxClassesPerDay,
      maxClassesPerWeek: f.maxClassesPerWeek,
      maxContinuousClasses: f.maxContinuousClasses,
      minGapAfterContinuousBlock: f.minGapAfterContinuousBlock,
      weeklyWorkingDays: f.weeklyWorkingDays,
      dailyAvailableFrom: f.dailyAvailableFrom,
      dailyAvailableTo: f.dailyAvailableTo,
      unavailableDates: f.unavailability.map(u => ({
        startDate: new Date(u.startDate),
        endDate: new Date(u.endDate),
      })),
      preferredSubjects: f.preferredSubjects.map(ps => ({
        subjectId: ps.subjectId,
        preferenceRank: ps.preferenceRank,
      })),
      preferredBatches: f.preferredBatches.map(pb => ({
        batchId: pb.batchId,
        preferenceRank: pb.preferenceRank,
      })),
    }));

    const timeSlots: AllocationTimeSlot[] = dbTimeSlots.map(ts => ({
      id: ts.id,
      dayOfWeek: ts.dayOfWeek,
      periodNumber: ts.periodNumber,
      startTime: ts.startTime,
      endTime: ts.endTime,
      isBreak: ts.isBreak,
    }));

    const eligibilityRules: AllocationEligibilityRule[] = dbEligibilityRules.map(r => ({
      seniorityLevel: r.seniorityLevel,
      degreeLevel: r.degreeLevel,
      allowed: r.allowed,
    }));

    // 6. Fetch existing manual assignments to exclude them from being altered by engine
    const manualReqs = await prisma.classRequirement.findMany({
      where: {
        ...reqWhere,
        status: 'MANUALLY_ASSIGNED',
        assignedFacultyId: { not: null },
      },
    });

    const existingAssignments = manualReqs.map(cr => ({
      classRequirementId: cr.id,
      facultyId: cr.assignedFacultyId!,
      timeSlotIds: cr.assignedTimeSlotIds,
    }));

    const manualIds = new Set(manualReqs.map(r => r.id));

    // 7. Run Allocation Engine
    const result = runAllocationEngine({
      classRequirements,
      faculty,
      timeSlots,
      eligibilityRules,
      existingAssignments,
    });

    // 8. In a transaction, save results to DB
    await prisma.$transaction(async (tx) => {
      // Clear previous AUTO_ASSIGNED or CONFLICT assignments
      await tx.classRequirement.updateMany({
        where: {
          ...reqWhere,
          status: { in: ['AUTO_ASSIGNED', 'CONFLICT'] },
        },
        data: {
          assignedFacultyId: null,
          assignedTimeSlotIds: [],
          status: 'UNASSIGNED',
          conflictReason: null,
        },
      });

      // Save new assignments
      for (const assign of result.assignments) {
        if (!manualIds.has(assign.classRequirementId)) {
          await tx.classRequirement.update({
            where: { id: assign.classRequirementId },
            data: {
              assignedFacultyId: assign.facultyId,
              assignedTimeSlotIds: assign.timeSlotIds,
              status: 'AUTO_ASSIGNED',
              conflictReason: null,
            },
          });
        }
      }

      // Save conflicts
      for (const conflict of result.conflicts) {
        if (!manualIds.has(conflict.classRequirementId)) {
          await tx.classRequirement.update({
            where: { id: conflict.classRequirementId },
            data: {
              assignedFacultyId: null,
              assignedTimeSlotIds: [],
              status: 'CONFLICT',
              conflictReason: conflict.reason,
            },
          });
        }
      }

      // Determine the overall status of this allocation run
      let runStatus: AllocationRunStatus = 'SUCCESS';
      if (result.conflicts.length > 0) {
        runStatus = result.assignments.length > 0 ? 'PARTIAL' : 'FAILED';
      }

      // Save AllocationRun record
      await tx.allocationRun.create({
        data: {
          semesterId: id,
          runByUserId: user.id,
          status: runStatus,
          summaryJson: result.summary as any,
        },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
