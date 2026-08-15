'use client';

import { useState } from 'react';
import { useDepartments, useDeleteDepartment } from '@/hooks';
import { DataTable, Button } from '@/components/ui';
import { DepartmentFormModal } from './DepartmentFormModal';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function DepartmentsTable() {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [departmentToEdit, setDepartmentToEdit] = useState<any>(null);

  const { data, isLoading } = useDepartments({ page, pageSize: 10 });
  const deleteMutation = useDeleteDepartment();

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';
  const isSchoolAdmin = session?.user?.role === 'SCHOOL_ADMIN';

  const handleEdit = (dept: any) => {
    setDepartmentToEdit(dept);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setDepartmentToEdit(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this department? This will cascade delete all faculty within it.')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns = [
    { header: 'Name', accessorKey: 'name' as const },
    { header: 'Short Code', accessorKey: 'shortCode' as const },
    { 
      header: 'School', 
      cell: (dept: any) => dept.school?.name || 'N/A' 
    },
    {
      header: 'Actions',
      cell: (dept: any) => {
        const canEdit = isSuperAdmin || 
                        (isSchoolAdmin && session?.user?.schoolId === dept.schoolId) ||
                        (session?.user?.role === 'DEPT_ADMIN' && session?.user?.departmentId === dept.id);
        const canDelete = isSuperAdmin || (isSchoolAdmin && session?.user?.schoolId === dept.schoolId);

        return (
          <div className="flex space-x-2">
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={() => handleEdit(dept)}>
                <Edit2 className="w-4 h-4 text-blue-600" />
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" onClick={() => handleDelete(dept.id)}>
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (isLoading) return <div>Loading departments...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Departments</h2>
        {(isSuperAdmin || isSchoolAdmin) && (
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Department
          </Button>
        )}
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        emptyMessage="No departments found."
      />

      <DepartmentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        departmentToEdit={departmentToEdit}
      />
    </div>
  );
}
