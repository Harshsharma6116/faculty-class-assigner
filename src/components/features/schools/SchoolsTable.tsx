'use client';

import { useState } from 'react';
import { useSchools, useDeleteSchool } from '@/hooks';
import { DataTable, Button } from '@/components/ui';
import { SchoolFormModal } from './SchoolFormModal';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function SchoolsTable() {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schoolToEdit, setSchoolToEdit] = useState<any>(null);

  const { data, isLoading } = useSchools({ page, pageSize: 10 });
  const deleteMutation = useDeleteSchool();

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  const handleEdit = (school: any) => {
    setSchoolToEdit(school);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSchoolToEdit(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this school? This will cascade delete all departments and faculty within it.')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns = [
    { header: 'Name', accessorKey: 'name' as const },
    { header: 'Short Code', accessorKey: 'shortCode' as const },
    {
      header: 'Actions',
      cell: (school: any) => (
        <div className="flex space-x-2">
          {(isSuperAdmin || session?.user?.schoolId === school.id) && (
            <Button variant="ghost" size="sm" onClick={() => handleEdit(school)}>
              <Edit2 className="w-4 h-4 text-blue-600" />
            </Button>
          )}
          {isSuperAdmin && (
            <Button variant="ghost" size="sm" onClick={() => handleDelete(school.id)}>
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) return <div>Loading schools...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Schools</h2>
        {isSuperAdmin && (
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add School
          </Button>
        )}
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        emptyMessage="No schools found."
      />

      <SchoolFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        schoolToEdit={schoolToEdit}
      />
    </div>
  );
}
