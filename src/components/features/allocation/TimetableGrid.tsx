'use client';

import { useState, useEffect } from 'react';
import { useTimetable, useFacultyList, useBatches, useRooms } from '@/hooks';
import { Select } from '@/components/ui';
import type { ClassType, DayOfWeek } from '@prisma/client';
import { Loader2, Calendar } from 'lucide-react';

interface TimetableGridProps {
  semesterId: string;
}

export function TimetableGrid({ semesterId }: TimetableGridProps) {
  const [viewMode, setViewMode] = useState<'Faculty' | 'Batch' | 'Room'>('Faculty');
  const [entityId, setEntityId] = useState<string>('');

  // Fetch all entities for dropdowns
  const { data: facultyData, isLoading: loadingFaculty } = useFacultyList({ pageSize: 1000 });
  const { data: batchData, isLoading: loadingBatches } = useBatches({ semesterId, pageSize: 1000 });
  const { data: roomData, isLoading: loadingRooms } = useRooms({ pageSize: 1000 });

  const faculties = facultyData?.data || [];
  const batches = batchData?.data || [];
  const rooms = roomData?.data || [];

  // Update selected entity when view mode or list changes
  useEffect(() => {
    if (viewMode === 'Faculty' && faculties.length > 0) {
      setEntityId(faculties[0].id);
    } else if (viewMode === 'Batch' && batches.length > 0) {
      setEntityId(batches[0].id);
    } else if (viewMode === 'Room' && rooms.length > 0) {
      setEntityId(rooms[0].id);
    } else {
      setEntityId('');
    }
  }, [viewMode, faculties.length, batches.length, rooms.length]);

  // Construct query parameters
  const isQueryEnabled = !!semesterId && !!entityId;
  const timetableParams = {
    semesterId: isQueryEnabled ? semesterId : '', // Pass empty string to disable request if no entityId
    facultyId: viewMode === 'Faculty' ? entityId : undefined,
    batchId: viewMode === 'Batch' ? entityId : undefined,
    roomId: viewMode === 'Room' ? entityId : undefined,
  };

  const { data: timetable, isLoading: loadingTimetable, error: timetableError } = useTimetable(timetableParams);

  // Generate options for target entity dropdown
  const entityOptions = (() => {
    if (viewMode === 'Faculty') {
      return faculties.map((f) => ({ label: f.fullName, value: f.id }));
    }
    if (viewMode === 'Batch') {
      return batches.map((b) => ({ label: b.name, value: b.id }));
    }
    if (viewMode === 'Room') {
      return rooms.map((r) => ({ label: r.name, value: r.id }));
    }
    return [];
  })();

  // Helper to format class type styling
  const getClassTypeStyles = (classType: ClassType) => {
    switch (classType) {
      case 'LECTURE':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'LAB':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case 'TUTORIAL':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  // Helper to capitalize day strings
  const formatDayName = (day: DayOfWeek) => {
    return day.charAt(0) + day.slice(1).toLowerCase();
  };

  // Helper to find period start/end time
  const getPeriodTimeStr = (periodNum: number) => {
    if (!timetable?.cells) return '';
    for (const dayRow of timetable.cells) {
      const cell = dayRow.find((c) => c.periodNumber === periodNum);
      if (cell && cell.startTime && cell.endTime) {
        return `${cell.startTime} - ${cell.endTime}`;
      }
    }
    return '';
  };

  const isLoading = loadingFaculty || loadingBatches || loadingRooms;

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
        <div className="w-full sm:w-64">
          <Select
            label="View Mode"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            options={[
              { label: 'Faculty View', value: 'Faculty' },
              { label: 'Batch View', value: 'Batch' },
              { label: 'Room View', value: 'Room' },
            ]}
          />
        </div>
        <div className="w-full sm:w-80">
          <Select
            label={`Select ${viewMode}`}
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            disabled={entityOptions.length === 0}
            options={[
              { label: `Select ${viewMode}...`, value: '' },
              ...entityOptions,
            ]}
            error={entityOptions.length === 0 && !isLoading ? `No ${viewMode.toLowerCase()}s found.` : undefined}
          />
        </div>
      </div>

      {/* Grid Display */}
      {loadingTimetable && isQueryEnabled ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mb-2" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading timetable grid...</p>
        </div>
      ) : timetableError ? (
        <div className="p-6 text-center text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/50">
          <p>Failed to load timetable. Please check configuration or choose another filter.</p>
        </div>
      ) : !entityId ? (
        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-300 dark:border-gray-800 rounded-lg">
          <Calendar className="w-12 h-12 text-gray-400 mb-2" />
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Please select a {viewMode.toLowerCase()} to view the timetable.
          </p>
        </div>
      ) : !timetable || timetable.days.length === 0 || timetable.periods.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
          <Calendar className="w-12 h-12 text-gray-400 mb-2" />
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            No timetable configuration or slots found for this entity.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <table className="w-full border-collapse text-sm text-left table-fixed min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                {/* Corner header */}
                <th className="w-48 px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-800">
                  Period / Time
                </th>
                {/* Days headers */}
                {timetable.days.map((day) => (
                  <th
                    key={day}
                    className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 text-center"
                  >
                    {formatDayName(day)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {timetable.periods.map((period, periodIndex) => (
                <tr key={period} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                  {/* Period name and timeslot */}
                  <td className="px-4 py-4 font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/10">
                    <div className="font-semibold">Period {period}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {getPeriodTimeStr(period)}
                    </div>
                  </td>

                  {/* Day cells (rendered horizontally for this period number) */}
                  {timetable.days.map((_, dayIndex) => {
                    const cell = timetable.cells[dayIndex]?.[periodIndex];

                    if (!cell) {
                      return (
                        <td
                          key={dayIndex}
                          className="px-2 py-2 border-r border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-900/30"
                        />
                      );
                    }

                    if (cell.isBreak) {
                      return (
                        <td
                          key={dayIndex}
                          className="px-2 py-2 border-r border-gray-200 dark:border-gray-800 text-center bg-gray-100/50 dark:bg-gray-850 dark:bg-opacity-50 text-gray-400 dark:text-gray-600 font-medium select-none"
                        >
                          <div className="text-xs tracking-wider uppercase font-semibold">
                            {cell.startTime && cell.endTime ? 'BREAK' : ''}
                          </div>
                        </td>
                      );
                    }

                    const assignment = cell.assignment;

                    return (
                      <td
                        key={dayIndex}
                        className="px-2 py-2 border-r border-gray-200 dark:border-gray-800 align-top"
                      >
                        {assignment ? (
                          <div
                            className={`p-2 rounded border text-xs flex flex-col gap-1 h-full shadow-xs transition-shadow hover:shadow-sm ${getClassTypeStyles(
                              assignment.classType
                            )}`}
                          >
                            <div className="font-semibold truncate" title={assignment.subjectName}>
                              {assignment.subjectCode}: {assignment.subjectName}
                            </div>
                            <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 text-[11px] font-medium opacity-90">
                              {viewMode !== 'Batch' && (
                                <span className="bg-white/40 dark:bg-black/20 px-1 rounded">
                                  {assignment.batchName}
                                </span>
                              )}
                              {viewMode !== 'Faculty' && (
                                <span className="bg-white/40 dark:bg-black/20 px-1 rounded truncate max-w-[100px]">
                                  {assignment.facultyName}
                                </span>
                              )}
                              {viewMode !== 'Room' && (
                                <span className="bg-white/40 dark:bg-black/20 px-1 rounded">
                                  {assignment.roomName}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] self-start px-1 py-0.2 rounded-full uppercase bg-black/5 dark:bg-white/5 font-semibold mt-0.5">
                              {assignment.classType.toLowerCase()}
                            </span>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center py-4 text-[11px] text-gray-300 dark:text-gray-700 italic font-light select-none">
                            Free
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
