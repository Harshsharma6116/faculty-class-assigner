import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth/helpers';
import { handleApiError, ApiError } from '@/lib/auth/api-error';
import type { DayOfWeek, TimetableCell } from '@/types';

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await requireAuth();

    // 2. Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const semesterId = searchParams.get('semesterId');
    const facultyId = searchParams.get('facultyId');
    const batchId = searchParams.get('batchId');
    const roomId = searchParams.get('roomId');

    if (!semesterId) {
      throw new ApiError(400, 'semesterId query parameter is required');
    }

    // Validate semester existence
    const semester = await prisma.semester.findUnique({
      where: { id: semesterId },
    });
    if (!semester) {
      throw new ApiError(404, 'Semester not found');
    }

    // 3. Determine and validate filter type
    let filterType: 'faculty' | 'batch' | 'room';
    let filterId = '';
    let filterName = '';
    let targetSchoolId: string | null = null;

    if (facultyId) {
      filterType = 'faculty';
      filterId = facultyId;
      const fac = await prisma.faculty.findUnique({
        where: { id: facultyId },
        include: { department: true },
      });
      if (!fac) {
        throw new ApiError(404, 'Faculty not found');
      }
      
      // Scope validation
      if (user.role === 'SCHOOL_ADMIN' && fac.department.schoolId !== user.schoolId) {
        throw new ApiError(403, 'Permission denied: faculty belongs to another school');
      }
      if (user.role === 'DEPT_ADMIN' && fac.departmentId !== user.departmentId) {
        throw new ApiError(403, 'Permission denied: faculty belongs to another department');
      }
      
      filterName = fac.fullName;
      targetSchoolId = fac.department.schoolId;
    } else if (batchId) {
      filterType = 'batch';
      filterId = batchId;
      const bat = await prisma.batch.findUnique({
        where: { id: batchId },
        include: { department: true },
      });
      if (!bat) {
        throw new ApiError(404, 'Batch not found');
      }
      
      // Scope validation
      if (user.role === 'SCHOOL_ADMIN' && bat.department.schoolId !== user.schoolId) {
        throw new ApiError(403, 'Permission denied: batch belongs to another school');
      }
      if (user.role === 'DEPT_ADMIN' && bat.departmentId !== user.departmentId) {
        throw new ApiError(403, 'Permission denied: batch belongs to another department');
      }
      
      filterName = bat.name;
      targetSchoolId = bat.department.schoolId;
    } else if (roomId) {
      filterType = 'room';
      filterId = roomId;
      const rm = await prisma.room.findUnique({
        where: { id: roomId },
      });
      if (!rm) {
        throw new ApiError(404, 'Room not found');
      }
      
      // Scope validation
      if ((user.role === 'SCHOOL_ADMIN' || user.role === 'DEPT_ADMIN') && rm.schoolId !== user.schoolId) {
        throw new ApiError(403, 'Permission denied: room belongs to another school');
      }
      
      filterName = rm.name;
      targetSchoolId = rm.schoolId;
    } else {
      throw new ApiError(400, 'At least one filter (facultyId, batchId, or roomId) must be provided');
    }

    if (!targetSchoolId) {
      throw new ApiError(400, 'Could not determine the school context for the requested entity');
    }

    // 4. Load all time slots for this school
    const dbTimeSlots = await prisma.timeSlot.findMany({
      where: { schoolId: targetSchoolId },
    });

    if (dbTimeSlots.length === 0) {
      return NextResponse.json({
        days: [],
        periods: [],
        cells: [],
        filterType,
        filterId,
        filterName,
      });
    }

    // Define standard days order
    const daysOrder: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    
    // Sort unique days and periods from database timeslots
    const uniqueDays = Array.from(new Set(dbTimeSlots.map(ts => ts.dayOfWeek)))
      .sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b));

    const uniquePeriods = Array.from(new Set(dbTimeSlots.map(ts => ts.periodNumber)))
      .sort((a, b) => a - b);

    // 5. Query matching class requirements for the semester
    const classReqs = await prisma.classRequirement.findMany({
      where: {
        semesterId,
        status: { in: ['AUTO_ASSIGNED', 'MANUALLY_ASSIGNED'] },
        ...(filterType === 'faculty' ? { assignedFacultyId: filterId } : {}),
        ...(filterType === 'batch' ? { batchId: filterId } : {}),
        ...(filterType === 'room' ? { roomId: filterId } : {}),
      },
      include: {
        subject: true,
        batch: true,
        room: true,
        assignedFaculty: true,
      },
    });

    // 6. Build the 2D Timetable cells grid (rows: days, cols: periods)
    const cells: TimetableCell[][] = [];

    for (const day of uniqueDays) {
      const row: TimetableCell[] = [];
      for (const period of uniquePeriods) {
        const slot = dbTimeSlots.find(ts => ts.dayOfWeek === day && ts.periodNumber === period);
        
        if (!slot) {
          // Push placeholder cell if no timeslot exists for this combination
          row.push({
            timeSlotId: '',
            dayOfWeek: day,
            periodNumber: period,
            startTime: '',
            endTime: '',
            isBreak: true,
          });
          continue;
        }

        const matchingReq = classReqs.find(cr => cr.assignedTimeSlotIds.includes(slot.id));

        const cell: TimetableCell = {
          timeSlotId: slot.id,
          dayOfWeek: slot.dayOfWeek,
          periodNumber: slot.periodNumber,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBreak: slot.isBreak,
        };

        if (matchingReq) {
          cell.assignment = {
            classRequirementId: matchingReq.id,
            subjectName: matchingReq.subject.name,
            subjectCode: matchingReq.subject.code,
            batchName: matchingReq.batch.name,
            roomName: matchingReq.room.name,
            facultyName: matchingReq.assignedFaculty?.fullName || 'Unassigned',
            classType: matchingReq.classType,
            status: matchingReq.status,
          };
        }

        row.push(cell);
      }
      cells.push(row);
    }

    return NextResponse.json({
      days: uniqueDays,
      periods: uniquePeriods,
      cells,
      filterType,
      filterId,
      filterName,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
