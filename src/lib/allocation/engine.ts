import type {
  AllocationInput,
  AllocationResult,
  AllocationAssignment,
  AllocationConflict,
  AllocationSummary,
  AllocationClassRequirement,
  AllocationFaculty,
  AllocationTimeSlot,
  DayOfWeek
} from '@/types';

export function runAllocationEngine(input: AllocationInput): AllocationResult {
  const { classRequirements, faculty, timeSlots, eligibilityRules, existingAssignments } = input;

  const assignments: AllocationAssignment[] = [];
  const conflicts: AllocationConflict[] = [];

  // 1. Data Indexes & Mappings
  const eligibilityMap = new Map<string, boolean>();
  eligibilityRules.forEach(rule => {
    eligibilityMap.set(`${rule.seniorityLevel}-${rule.degreeLevel}`, rule.allowed);
  });

  const slotsMap = new Map<string, AllocationTimeSlot>();
  timeSlots.forEach(slot => slotsMap.set(slot.id, slot));

  // Sort timeslots by day and period for consecutive calculations
  const sortedSlots = [...timeSlots].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) {
      const daysOrder: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      return daysOrder.indexOf(a.dayOfWeek) - daysOrder.indexOf(b.dayOfWeek);
    }
    return a.periodNumber - b.periodNumber;
  });

  // Trackers for busy slots
  const facultyBusy = new Map<string, Set<string>>(); // facultyId -> Set of timeSlotIds
  const roomBusy = new Map<string, Set<string>>();    // roomId -> Set of timeSlotIds
  const batchBusy = new Map<string, Set<string>>();   // batchId -> Set of timeSlotIds

  // Trackers for faculty loads
  const facultyWeeklyLoad = new Map<string, number>(); // facultyId -> count
  const facultyDailyLoad = new Map<string, Map<DayOfWeek, number>>(); // facultyId -> day -> count

  // Initialize trackers
  faculty.forEach(f => {
    facultyBusy.set(f.id, new Set<string>());
    facultyWeeklyLoad.set(f.id, 0);
    const dayMap = new Map<DayOfWeek, number>();
    facultyDailyLoad.set(f.id, dayMap);
  });

  // Initialize room & batch trackers
  const roomIds = new Set(classRequirements.map(r => r.roomId));
  roomIds.forEach(id => roomBusy.set(id, new Set<string>()));

  const batchIds = new Set(classRequirements.map(r => r.batchId));
  batchIds.forEach(id => batchBusy.set(id, new Set<string>()));

  // 2. Load Existing Assignments (Manual/Previous)
  existingAssignments.forEach(assign => {
    assignments.push(assign);
    
    // Mark trackers
    const fBusy = facultyBusy.get(assign.facultyId);
    if (fBusy) assign.timeSlotIds.forEach(id => fBusy.add(id));

    const req = classRequirements.find(r => r.id === assign.classRequirementId);
    if (req) {
      const roomB = roomBusy.get(req.roomId);
      if (roomB) assign.timeSlotIds.forEach(id => roomB.add(id));

      const batchB = batchBusy.get(req.batchId);
      if (batchB) assign.timeSlotIds.forEach(id => batchB.add(id));
    }

    // Update faculty loads
    const currentWeekly = facultyWeeklyLoad.get(assign.facultyId) || 0;
    facultyWeeklyLoad.set(assign.facultyId, currentWeekly + assign.timeSlotIds.length);

    assign.timeSlotIds.forEach(slotId => {
      const slot = slotsMap.get(slotId);
      if (slot) {
        const dayMap = facultyDailyLoad.get(assign.facultyId);
        if (dayMap) {
          const currentDaily = dayMap.get(slot.dayOfWeek) || 0;
          dayMap.set(slot.dayOfWeek, currentDaily + 1);
        }
      }
    });
  });

  // Filter out requirements already assigned
  const assignedReqIds = new Set(existingAssignments.map(a => a.classRequirementId));
  const unassignedRequirements = classRequirements.filter(req => !assignedReqIds.has(req.id));

  // 3. Sort Unassigned Requirements by difficulty
  // PG is harder (fewer faculty), then LABs (fewer rooms/larger blocks), then sessionsPerWeek desc
  const sortedRequirements = [...unassignedRequirements].sort((a, b) => {
    if (a.degreeLevel !== b.degreeLevel) {
      return a.degreeLevel === 'PG' ? -1 : 1; // PG first
    }
    if (a.classType !== b.classType) {
      return a.classType === 'LAB' ? -1 : 1; // LAB first
    }
    return b.sessionsPerWeek - a.sessionsPerWeek; // More sessions first
  });

  // Helper: consecutive hour check
  function violatesConsecutiveLimit(
    fac: AllocationFaculty,
    day: DayOfWeek,
    proposedPeriod: number,
    facBusySlots: Set<string>
  ): boolean {
    const activePeriodsOnDay: number[] = [];
    facBusySlots.forEach(sId => {
      const s = slotsMap.get(sId);
      if (s && s.dayOfWeek === day) {
        activePeriodsOnDay.push(s.periodNumber);
      }
    });
    activePeriodsOnDay.push(proposedPeriod);
    activePeriodsOnDay.sort((a, b) => a - b);

    // Find continuous blocks
    let currentBlock = 1;
    let maxBlock = 1;
    for (let i = 1; i < activePeriodsOnDay.length; i++) {
      if (activePeriodsOnDay[i] === activePeriodsOnDay[i - 1] + 1) {
        currentBlock++;
      } else {
        maxBlock = Math.max(maxBlock, currentBlock);
        currentBlock = 1;
      }
    }
    maxBlock = Math.max(maxBlock, currentBlock);

    if (maxBlock > fac.maxContinuousClasses) {
      return true;
    }
    
    return false;
  }

  // 4. Heuristic Loop
  sortedRequirements.forEach(req => {
    // A. Find Eligible Faculty candidates
    const eligibleFaculty = faculty.filter(fac => {
      // Must be same department
      if (fac.departmentId !== req.departmentId) return false;
      
      // Must be eligible for degree level
      const isEligible = eligibilityMap.get(`${fac.seniorityLevel}-${req.degreeLevel}`);
      if (isEligible === false) return false;

      // Has capacity in weekly workload
      const currentWeekly = facultyWeeklyLoad.get(fac.id) || 0;
      if (currentWeekly + req.sessionsPerWeek > fac.maxClassesPerWeek) return false;

      return true;
    });

    if (eligibleFaculty.length === 0) {
      conflicts.push({
        classRequirementId: req.id,
        reason: `No faculty in department are eligible to teach at the ${req.degreeLevel} level or they all exceeded weekly workload caps.`
      });
      return;
    }

    // B. Find best timeslot combinations
    let bestFaculty: AllocationFaculty | null = null;
    let bestSlots: AllocationTimeSlot[] = [];
    let bestScore = -Infinity;

    eligibleFaculty.forEach(fac => {
      const fBusy = facultyBusy.get(fac.id) || new Set<string>();
      const pref = fac.preferredSubjects.find(ps => ps.subjectId === req.subjectId);
      const prefRank = pref ? pref.preferenceRank : 10; // default lower preference

      // Find all timeslots that are theoretically open for this faculty, room, and batch
      const candidateSlots = sortedSlots.filter(slot => {
        if (slot.isBreak) return false;
        
        // Faculty must work on this day
        if (!fac.weeklyWorkingDays.includes(slot.dayOfWeek)) return false;

        // Faculty must not be busy
        if (fBusy.has(slot.id)) return false;

        // Room must not be busy
        const rBusy = roomBusy.get(req.roomId);
        if (rBusy && rBusy.has(slot.id)) return false;

        // Batch must not be busy
        const bBusy = batchBusy.get(req.batchId);
        if (bBusy && bBusy.has(slot.id)) return false;

        // Check daily limit for faculty
        const dayMap = facultyDailyLoad.get(fac.id);
        const dayCount = dayMap ? (dayMap.get(slot.dayOfWeek) || 0) : 0;
        if (dayCount >= fac.maxClassesPerDay) return false;

        // Check consecutive block limits
        if (violatesConsecutiveLimit(fac, slot.dayOfWeek, slot.periodNumber, fBusy)) return false;

        // Time window constraints (dailyAvailableFrom / To)
        if (fac.dailyAvailableFrom && slot.startTime < fac.dailyAvailableFrom) return false;
        if (fac.dailyAvailableTo && slot.endTime > fac.dailyAvailableTo) return false;

        return true;
      });

      if (candidateSlots.length < req.sessionsPerWeek) {
        return; // Not enough total available slots for this faculty
      }

      // Heuristic: pick the first N slots that group nicely
      const candidateComb = candidateSlots.slice(0, req.sessionsPerWeek);
      if (candidateComb.length === req.sessionsPerWeek) {
        // Fetch batch preference rank (default to 10 if not preferred)
        const batchPref = fac.preferredBatches?.find(pb => pb.batchId === req.batchId);
        const batchPrefRank = batchPref ? batchPref.preferenceRank : 10;

        // Subject pref is primary (weighted 10x), Batch pref is secondary (weighted 5x)
        const score = (10 - prefRank) * 10 + (10 - batchPrefRank) * 5;

        if (score > bestScore) {
          bestScore = score;
          bestFaculty = fac;
          bestSlots = candidateComb;
        }
      }
    });

    // C. Assign or flag conflict
    if (bestFaculty && bestSlots.length === req.sessionsPerWeek) {
      const assignment: AllocationAssignment = {
        classRequirementId: req.id,
        facultyId: (bestFaculty as AllocationFaculty).id,
        timeSlotIds: bestSlots.map(s => s.id)
      };

      assignments.push(assignment);

      // Book trackers
      const fBusy = facultyBusy.get(assignment.facultyId);
      if (fBusy) assignment.timeSlotIds.forEach(id => fBusy.add(id));

      const rBusy = roomBusy.get(req.roomId);
      if (rBusy) assignment.timeSlotIds.forEach(id => rBusy.add(id));

      const bBusy = batchBusy.get(req.batchId);
      if (bBusy) assignment.timeSlotIds.forEach(id => bBusy.add(id));

      // Update faculty loads
      const currentWeekly = facultyWeeklyLoad.get(assignment.facultyId) || 0;
      facultyWeeklyLoad.set(assignment.facultyId, currentWeekly + req.sessionsPerWeek);

      bestSlots.forEach(slot => {
        const dayMap = facultyDailyLoad.get((bestFaculty as AllocationFaculty).id);
        if (dayMap) {
          const currentDaily = dayMap.get(slot.dayOfWeek) || 0;
          dayMap.set(slot.dayOfWeek, currentDaily + 1);
        }
      });
    } else {
      conflicts.push({
        classRequirementId: req.id,
        reason: `Could not find ${req.sessionsPerWeek} overlapping available timeslots where the batch, room, and an eligible faculty member were all free.`
      });
    }
  });

  // 5. Generate Summary
  const perFacultyLoad: Record<string, { facultyName: string; assignedClasses: number; maxWeekly: number }> = {};
  faculty.forEach(f => {
    perFacultyLoad[f.id] = {
      facultyName: f.fullName,
      assignedClasses: facultyWeeklyLoad.get(f.id) || 0,
      maxWeekly: f.maxClassesPerWeek
    };
  });

  const conflictReasons = conflicts.map(c => {
    const req = classRequirements.find(r => r.id === c.classRequirementId);
    return {
      classRequirementId: c.classRequirementId,
      subjectName: req?.subjectName || 'Unknown Subject',
      batchName: req?.batchName || 'Unknown Batch',
      reason: c.reason
    };
  });

  const summary: AllocationSummary = {
    totalRequirements: classRequirements.length,
    fulfilled: assignments.length,
    unfulfilled: classRequirements.length - assignments.length,
    conflicts: conflicts.length,
    perFacultyLoad,
    conflictReasons
  };

  return {
    assignments,
    conflicts,
    summary
  };
}
