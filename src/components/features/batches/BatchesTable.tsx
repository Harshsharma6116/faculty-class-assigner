'use client';

import { useState } from 'react';
import { useBatches, useDeleteBatch } from '@/hooks';
import { DataTable, Button } from '@/components/ui';
import { BatchFormModal } from './BatchFormModal';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function BatchesTable() {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [batchToEdit, setBatchToEdit] = useState<any>(null);

  const { data, isLoading } = useBatches({ page, pageSize: 10 });
  const deleteMutation = useDeleteBatch();

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';
  const isSchoolAdmin = session?.user?.role === 'SCHOOL_ADMIN';
  const isDeptAdmin = session?.user?.role === 'DEPT_ADMIN';

  const handleEdit = (batch: any) => {
    setBatchToEdit(batch);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setBatchToEdit(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this batch?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns = [
    { header: 'Name', accessorKey: 'name' as const },
    { 
      header: 'Department', 
      cell: (batch: any) => batch.department?.name || 'Unknown'
    },
    { header: 'Degree', accessorKey: 'degreeLevel' as const },
    { header: 'Year/Sem', accessorKey: 'yearOrSemesterNumber' as const },
    { header: 'Strength', accessorKey: 'strength' as const },
    {
      header: 'Actions',
      cell: (batch: any) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(batch)}>
            <Edit2 className="w-4 h-4 text-blue-600" />
          </Button>
          {(isSuperAdmin || isSchoolAdmin || (isDeptAdmin && session?.user?.departmentId === batch.departmentId)) && (
            <Button variant="ghost" size="sm" onClick={() => handleDelete(batch.id)}>
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) return <div>Loading batches...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Batches</h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Batch
        </Button>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        emptyMessage="No batches found."
      />

      <BatchFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        batchToEdit={batchToEdit}
      />
    </div>
  );
}
