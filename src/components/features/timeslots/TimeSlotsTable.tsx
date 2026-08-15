'use client';

import { useState } from 'react';
import { useTimeSlots, useDeleteTimeSlot } from '@/hooks';
import { DataTable, Button } from '@/components/ui';
import { TimeSlotFormModal } from './TimeSlotFormModal';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function TimeSlotsTable() {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeSlotToEdit, setTimeSlotToEdit] = useState<any>(null);

  const { data, isLoading } = useTimeSlots({ page, pageSize: 50 });
  const deleteMutation = useDeleteTimeSlot();

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';
  const isSchoolAdmin = session?.user?.role === 'SCHOOL_ADMIN';

  const handleEdit = (timeSlot: any) => {
    setTimeSlotToEdit(timeSlot);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setTimeSlotToEdit(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this time slot?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns = [
    { 
      header: 'School', 
      cell: (slot: any) => slot.school?.shortCode || slot.school?.name || 'Unknown'
    },
    { header: 'Day', accessorKey: 'dayOfWeek' as const },
    { header: 'Period', accessorKey: 'periodNumber' as const },
    { header: 'Start Time', accessorKey: 'startTime' as const },
    { header: 'End Time', accessorKey: 'endTime' as const },
    { 
      header: 'Type', 
      cell: (slot: any) => slot.isBreak ? <span className="text-amber-600 font-medium">Break</span> : 'Class'
    },
    {
      header: 'Actions',
      cell: (slot: any) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(slot)}>
            <Edit2 className="w-4 h-4 text-blue-600" />
          </Button>
          {(isSuperAdmin || (isSchoolAdmin && session?.user?.schoolId === slot.schoolId)) && (
            <Button variant="ghost" size="sm" onClick={() => handleDelete(slot.id)}>
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) return <div>Loading time slots...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Time Slots</h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Time Slot
        </Button>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        emptyMessage="No time slots found."
      />

      <TimeSlotFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        timeSlotToEdit={timeSlotToEdit}
      />
    </div>
  );
}
