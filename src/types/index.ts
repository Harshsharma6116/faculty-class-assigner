// ============================================================================
// Shared TypeScript types for the Faculty Class Allocation System
// These types are used across the application (not Prisma-generated types)
// ============================================================================

import type { UserRole, SeniorityLevel, DegreeLevel, ClassType, RoomType, DayOfWeek, ClassRequirementStatus, AllocationRunStatus } from '@prisma/client';

// Re-export Prisma enums for convenience
export type { UserRole, SeniorityLevel, DegreeLevel, ClassType, RoomType, DayOfWeek, ClassRequirementStatus, AllocationRunStatus };

// ============================================================================
// Session / Auth types
// ============================================================================

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  schoolId: string | null;
  departmentId: string | null;
}

// ============================================================================
// API Response types
// ============================================================================

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  errors?: Array<{ row?: number; field?: string; message: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// CSV Import types
// ============================================================================

export interface CsvImportRow {
  subjectCode: string;
  batchName: string;
  roomName: string;
  sessionsPerWeek: number;
  classType?: string;
}

export interface CsvValidationResult {
  valid: boolean;
  rows: CsvImportRow[];
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

// ============================================================================
// Allocation Engine types
// ============================================================================

export interface AllocationInput {
  classRequirements: AllocationClassRequirement[];
  faculty: AllocationFaculty[];
  timeSlots: AllocationTimeSlot[];
  eligibilityRules: AllocationEligibilityRule[];
  existingAssignments: AllocationAssignment[];
}

export interface AllocationClassRequirement {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  batchId: string;
  batchName: string;
  roomId: string;
  departmentId: string;
  degreeLevel: DegreeLevel;
  classType: ClassType;
  sessionsPerWeek: number;
}

export interface AllocationFaculty {
  id: string;
  fullName: string;
  departmentId: string;
  seniorityLevel: SeniorityLevel;
  maxClassesPerDay: number;
  maxClassesPerWeek: number;
  maxContinuousClasses: number;
  minGapAfterContinuousBlock: number;
  weeklyWorkingDays: DayOfWeek[];
  dailyAvailableFrom: string | null;
  dailyAvailableTo: string | null;
  unavailableDates: Array<{ startDate: Date; endDate: Date }>;
  preferredSubjects: Array<{ subjectId: string; preferenceRank: number }>;
}

export interface AllocationTimeSlot {
  id: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

export interface AllocationEligibilityRule {
  seniorityLevel: SeniorityLevel;
  degreeLevel: DegreeLevel;
  allowed: boolean;
}

export interface AllocationAssignment {
  classRequirementId: string;
  facultyId: string;
  timeSlotIds: string[];
}

export interface AllocationResult {
  assignments: AllocationAssignment[];
  conflicts: AllocationConflict[];
  summary: AllocationSummary;
}

export interface AllocationConflict {
  classRequirementId: string;
  reason: string;
}

export interface AllocationSummary {
  totalRequirements: number;
  fulfilled: number;
  unfulfilled: number;
  conflicts: number;
  perFacultyLoad: Record<string, {
    facultyName: string;
    assignedClasses: number;
    maxWeekly: number;
  }>;
  conflictReasons: Array<{
    classRequirementId: string;
    subjectName: string;
    batchName: string;
    reason: string;
  }>;
}

// ============================================================================
// Timetable view types
// ============================================================================

export interface TimetableCell {
  timeSlotId: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  assignment?: {
    classRequirementId: string;
    subjectName: string;
    subjectCode: string;
    batchName: string;
    roomName: string;
    facultyName: string;
    classType: ClassType;
    status: ClassRequirementStatus;
  };
}

export interface TimetableGrid {
  days: DayOfWeek[];
  periods: number[];
  cells: TimetableCell[][];
  filterType: 'faculty' | 'batch' | 'room';
  filterId: string;
  filterName: string;
}
