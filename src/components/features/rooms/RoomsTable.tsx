'use client';

import { useState } from 'react';
import { useRooms, useDeleteRoom } from '@/hooks';
import { DataTable, Button } from '@/components/ui';
import { RoomFormModal } from './RoomFormModal';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function RoomsTable() {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<any>(null);

  const { data, isLoading } = useRooms({ page, pageSize: 10 });
  const deleteMutation = useDeleteRoom();

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';
  const isSchoolAdmin = session?.user?.role === 'SCHOOL_ADMIN';

  const handleEdit = (room: any) => {
    setRoomToEdit(room);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setRoomToEdit(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this room?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns = [
    { header: 'Name', accessorKey: 'name' as const },
    { 
      header: 'School', 
      cell: (room: any) => room.school?.shortCode || room.school?.name || 'Unknown'
    },
    { header: 'Capacity', accessorKey: 'capacity' as const },
    { header: 'Type', accessorKey: 'roomType' as const },
    {
      header: 'Actions',
      cell: (room: any) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(room)}>
            <Edit2 className="w-4 h-4 text-blue-600" />
          </Button>
          {(isSuperAdmin || (isSchoolAdmin && session?.user?.schoolId === room.schoolId)) && (
            <Button variant="ghost" size="sm" onClick={() => handleDelete(room.id)}>
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) return <div>Loading rooms...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Rooms</h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Room
        </Button>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        emptyMessage="No rooms found."
      />

      <RoomFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        roomToEdit={roomToEdit}
      />
    </div>
  );
}
