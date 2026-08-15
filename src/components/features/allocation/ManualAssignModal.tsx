'use client';

import { useState, useEffect } from 'react';
import { useManualAssign, useTimetable, useFacultyList } from '@/hooks';
import { Modal, Button, Select } from '@/components/ui';
import { Loader2, AlertCircle } from 'lucide-react';

interface ClassRequirementWithRelations {
  id: string;
  semesterId: string;
  subjectId: string;
  batchId: string;
  roomId: string;
  classType: 'LECTURE' | 'LAB' | 'TUTORIAL';
  sessionsPerWeek: number;
  assignedFacultyId: string | null;
  assignedTimeSlotIds: string[];
  status: string;
  conflictReason: string | null;
  subject: {
    name: string;
    code: string;
    department: {
      name: string;
      shortCode: string;
    };
  };
  batch: {
    name: string;
    strength: number;
  };
  room: {
    name: string;
    capacity: number;
  };
  assignedFaculty?: {
    id: string;
    fullName: string;
  } | null;
}

interface ManualAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  classRequirement: ClassRequirementWithRelations | null;
}

export function ManualAssignModal({ isOpen, onClose, classRequirement }: ManualAssignModalProps) {
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('');
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { data: facultyData, isLoading: loadingFaculty } = useFacultyList({ pageSize: 1000 });
  const faculties = facultyData?.data || [];

  // Reset and pre-populate state when modal opens or classRequirement changes
  useEffect(() => {
    if (classRequirement) {
      setSelectedFacultyId(classRequirement.assignedFacultyId || '');
      setSelectedSlotIds(classRequirement.assignedTimeSlotIds || []);
      setOverrideReason('');
      setErrorMessage('');
    }
  }, [classRequirement, isOpen]);

  const semesterId = classRequirement?.semesterId || '';
  const batchId = classRequirement?.batchId || '';
  const roomId = classRequirement?.roomId || '';

  // Timetables for checking busy status
  // 1. Batch Timetable
  const { data: batchTimetable, isLoading: loadingBatchTimetable } = useTimetable({
    semesterId: isOpen && batchId ? semesterId : '',
    batchId: batchId || undefined,
  });

  // 2. Room Timetable
  const { data: roomTimetable, isLoading: loadingRoomTimetable } = useTimetable({
    semesterId: isOpen && roomId ? semesterId : '',
    roomId: roomId || undefined,
  });

  // 3. Faculty Timetable (only fetch if faculty is selected)
  const { data: facultyTimetable, isLoading: loadingFacultyTimetable } = useTimetable({
    semesterId: isOpen && selectedFacultyId ? semesterId : '',
    facultyId: selectedFacultyId || undefined,
  });

  const manualAssignMutation = useManualAssign(classRequirement?.id || '');

  // Helper to check if a specific slot is busy in a timetable
  const isSlotBusy = (timetableGrid: any, timeSlotId: string) => {
    if (!timetableGrid || !timetableGrid.cells) return false;
    for (const dayRow of timetableGrid.cells) {
      for (const cell of dayRow) {
        if (cell.timeSlotId === timeSlotId) {
          // Check if there is an assignment and it's not the current class requirement
          return !!cell.assignment && cell.assignment.classRequirementId !== classRequirement?.id;
        }
      }
    }
    return false;
  };

  if (!classRequirement) return null;

  const sessionsPerWeek = classRequirement.sessionsPerWeek;

  // Handle cell selection
  const handleCellClick = (timeSlotId: string, isBreak: boolean) => {
    if (isBreak) return;

    if (selectedSlotIds.includes(timeSlotId)) {
      setSelectedSlotIds(selectedSlotIds.filter((id) => id !== timeSlotId));
    } else {
      if (selectedSlotIds.length >= sessionsPerWeek) {
        // Remove the oldest selection to accommodate the new one, or block it.
        // Let's block it or replace the first one. Let's do block with warning or replace first.
        // Replacing is usually friendlier:
        setSelectedSlotIds([...selectedSlotIds.slice(1), timeSlotId]);
      } else {
        setSelectedSlotIds([...selectedSlotIds, timeSlotId]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacultyId) {
      setErrorMessage('Please select a faculty member.');
      return;
    }
    if (selectedSlotIds.length !== sessionsPerWeek) {
      setErrorMessage(`Please select exactly ${sessionsPerWeek} timeslot(s). Currently selected: ${selectedSlotIds.length}`);
      return;
    }

    try {
      setErrorMessage('');
      await manualAssignMutation.mutateAsync({
        facultyId: selectedFacultyId,
        timeSlotIds: selectedSlotIds,
        reason: overrideReason || 'Manual Override allocation',
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to assign class requirement.');
    }
  };

  // Grid structure can be inferred from the batch timetable cells (which contains all school timeslots)
  const gridDays = batchTimetable?.days || [];
  const gridPeriods = batchTimetable?.periods || [];

  // Helper to find cell details by day index and period index
  const getCellForGrid = (dayIndex: number, periodIndex: number) => {
    return batchTimetable?.cells?.[dayIndex]?.[periodIndex];
  };

  const isFacultyLoading = loadingFacultyTimetable && !!selectedFacultyId;
  const isGridLoading = loadingBatchTimetable || loadingRoomTimetable || loadingFaculty;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Class Assignment Override"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="outline" type="button" onClick={onClose} disabled={manualAssignMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            onClick={handleSubmit}
            isLoading={manualAssignMutation.isPending}
            disabled={!selectedFacultyId || selectedSlotIds.length !== sessionsPerWeek}
          >
            Confirm Override
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Requirement Summary */}
        <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-lg border border-gray-200 dark:border-gray-800 text-sm space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold text-gray-500 dark:text-gray-400 block text-xs uppercase">Subject</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {classRequirement.subject.code}: {classRequirement.subject.name}
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-500 dark:text-gray-400 block text-xs uppercase">Batch</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {classRequirement.batch.name} ({classRequirement.batch.strength} students)
              </span>
            </div>
            <div className="mt-2">
              <span className="font-semibold text-gray-500 dark:text-gray-400 block text-xs uppercase">Room Context</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {classRequirement.room.name} (Cap: {classRequirement.room.capacity})
              </span>
            </div>
            <div className="mt-2">
              <span className="font-semibold text-gray-500 dark:text-gray-400 block text-xs uppercase">Sessions Required</span>
              <span className="font-medium text-gray-950 dark:text-white font-bold">
                {sessionsPerWeek} session{sessionsPerWeek > 1 ? 's' : ''} / week
              </span>
            </div>
          </div>
        </div>

        {/* Faculty Dropdown */}
        <div>
          <Select
            label="Assign Faculty Member"
            value={selectedFacultyId}
            onChange={(e) => setSelectedFacultyId(e.target.value)}
            disabled={loadingFaculty}
            options={[
              { label: 'Select Faculty...', value: '' },
              ...faculties.map((f) => ({
                label: `${f.fullName} (${f.seniorityLevel.replace('_', ' ')})`,
                value: f.id,
              })),
            ]}
          />
          {loadingFaculty && <p className="text-xs text-gray-500 mt-1">Loading faculty list...</p>}
        </div>

        {/* Timeslot Selector Grid */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between">
            <span>Select Weekly Timeslots ({sessionsPerWeek} required)</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              Selected: {selectedSlotIds.length} / {sessionsPerWeek}
            </span>
          </label>

          {isGridLoading ? (
            <div className="flex items-center justify-center p-12 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50/50">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-sm text-gray-500">Loading weekly timeslot grid...</span>
            </div>
          ) : gridDays.length === 0 ? (
            <div className="p-4 border border-dashed border-gray-300 dark:border-gray-800 text-center text-gray-500 rounded-lg">
              No academic slots configured for this school.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Conflict Legend */}
              <div className="flex flex-wrap gap-4 text-xs bg-gray-50 dark:bg-gray-850 p-2.5 rounded border border-gray-200 dark:border-gray-800">
                <span className="font-semibold text-gray-600 dark:text-gray-400">Legend:</span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-red-100 dark:bg-red-950/40 rounded border border-red-200 dark:border-red-900 inline-block" /> Batch Busy
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-orange-100 dark:bg-orange-950/40 rounded border border-orange-200 dark:border-orange-900 inline-block" /> Room Busy
                </span>
                {selectedFacultyId && (
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-yellow-100 dark:bg-yellow-950/40 rounded border border-yellow-200 dark:border-yellow-900 inline-block" /> Faculty Busy
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-100 dark:bg-blue-900 rounded border border-blue-500 inline-block" /> Selected
                </span>
              </div>

              {/* Grid Scrollable Wrapper */}
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg max-h-[350px]">
                <table className="w-full border-collapse text-left text-xs table-fixed min-w-[500px]">
                  <thead className="bg-gray-50 dark:bg-gray-800/80 sticky top-0 z-10 shadow-xs border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="w-20 p-2 font-semibold border-r border-gray-200 dark:border-gray-800">Period</th>
                      {gridDays.map((day) => (
                        <th key={day} className="p-2 font-semibold text-center truncate">
                          {day.charAt(0) + day.slice(1).toLowerCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {gridPeriods.map((period, periodIndex) => (
                      <tr key={period}>
                        <td className="p-2 font-semibold bg-gray-50/50 dark:bg-gray-800/30 border-r border-gray-200 dark:border-gray-800 text-center">
                          P{period}
                        </td>
                        {gridDays.map((_, dayIndex) => {
                          const cell = getCellForGrid(dayIndex, periodIndex);

                          if (!cell) {
                            return <td key={dayIndex} className="p-1 border-r border-gray-200 dark:border-gray-800 bg-gray-50/20" />;
                          }

                          if (cell.isBreak) {
                            return (
                              <td
                                key={dayIndex}
                                className="p-1 border-r border-gray-200 dark:border-gray-800 text-center bg-gray-100/50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-600 font-medium select-none"
                              >
                                Break
                              </td>
                            );
                          }

                          const isSelected = selectedSlotIds.includes(cell.timeSlotId);
                          const isBatchOccupied = isSlotBusy(batchTimetable, cell.timeSlotId);
                          const isRoomOccupied = isSlotBusy(roomTimetable, cell.timeSlotId);
                          const isFacultyOccupied = selectedFacultyId
                            ? isSlotBusy(facultyTimetable, cell.timeSlotId)
                            : false;

                          // Class names depending on state
                          let cellBg = 'bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/50';
                          let cellBorder = 'border-gray-200 dark:border-gray-850';
                          let cellText = 'text-gray-800 dark:text-gray-200';

                          if (isSelected) {
                            cellBg = 'bg-blue-50 dark:bg-blue-900/30';
                            cellBorder = 'border-blue-500 dark:border-blue-400';
                            cellText = 'text-blue-900 dark:text-blue-200 font-semibold';
                          }

                          return (
                            <td
                              key={dayIndex}
                              onClick={() => handleCellClick(cell.timeSlotId, cell.isBreak)}
                              className={`p-1.5 border-r border-b text-center cursor-pointer transition-colors select-none ${cellBg} ${cellBorder} ${cellText}`}
                            >
                              <div className="flex flex-col items-center justify-between min-h-[36px] gap-1">
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                  {cell.startTime}
                                </span>
                                <div className="flex gap-0.5 justify-center mt-0.5">
                                  {isBatchOccupied && (
                                    <span
                                      className="px-1 text-[8px] font-bold rounded bg-red-100 text-red-800 border border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-900"
                                      title="Batch Busy"
                                    >
                                      B
                                    </span>
                                  )}
                                  {isRoomOccupied && (
                                    <span
                                      className="px-1 text-[8px] font-bold rounded bg-orange-100 text-orange-850 border border-orange-200 dark:bg-orange-950/60 dark:text-orange-400 dark:border-orange-900"
                                      title="Room Busy"
                                    >
                                      R
                                    </span>
                                  )}
                                  {isFacultyOccupied && (
                                    <span
                                      className="px-1 text-[8px] font-bold rounded bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-950/60 dark:text-yellow-400 dark:border-yellow-900"
                                      title="Faculty Busy"
                                    >
                                      F
                                    </span>
                                  )}
                                  {!isBatchOccupied && !isRoomOccupied && !isFacultyOccupied && !isSelected && (
                                    <span className="text-[9px] text-gray-300 dark:text-gray-700 italic">Free</span>
                                  )}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Override Reason */}
        <div className="flex flex-col space-y-1">
          <label htmlFor="reason" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Reason for Override
          </label>
          <textarea
            id="reason"
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px] text-sm"
            placeholder="Provide a justification for manually assigning this faculty/timeslot (e.g. Special expertise, Scheduling override)"
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
          />
        </div>

        {/* Error Alert */}
        {(errorMessage || isFacultyLoading) && (
          <div className="flex gap-2 p-3 text-sm rounded bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              {isFacultyLoading && <p>Checking faculty timetable for conflicts...</p>}
              {errorMessage && <p>{errorMessage}</p>}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
