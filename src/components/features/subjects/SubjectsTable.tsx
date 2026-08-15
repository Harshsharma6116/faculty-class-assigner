'use client';

import { useState } from 'react';
import { useSubjects, useDeleteSubject } from '@/hooks/useSubjects';
import { useDepartments } from '@/hooks/useDepartments';
import { DataTable, Button, Input, Select } from '@/components/ui';
import { SubjectFormModal } from './SubjectFormModal';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function SubjectsTable() {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<any>(null);

  const { data, isLoading } = useSubjects({ 
    page, 
    pageSize: 10, 
    search: search || undefined,
    departmentId: departmentFilter || undefined
  });
  
  // Use departments to populate filter dropdown if needed
  const { data: departmentsData } = useDepartments({ pageSize: 100 });
  const deleteMutation = useDeleteSubject();

  const handleEdit = (subject: any) => {
    setSubjectToEdit(subject);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSubjectToEdit(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns = [
    { header: 'Code', accessorKey: 'code' as const },
    { header: 'Name', accessorKey: 'name' as const },
    { 
      header: 'Department', 
      cell: (subject: any) => subject.department?.shortCode || 'N/A'
    },
    { header: 'Type', accessorKey: 'classType' as const },
    { header: 'Level', accessorKey: 'degreeLevel' as const },
    { header: 'Weekly Classes', accessorKey: 'weeklyClassesRequired' as const },
    {
      header: 'Actions',
      cell: (subject: any) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(subject)}>
            <Edit2 className="w-4 h-4 text-blue-600" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(subject.id)}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Subjects</h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Subject
        </Button>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="w-64">
          <Input 
            placeholder="Search subjects..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-64">
          <Select 
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            options={
              departmentsData?.data.map(d => ({ label: d.shortCode, value: d.id })) || []
            }
          />
        </div>
      </div>

      {isLoading ? (
        <div>Loading subjects...</div>
      ) : (
        <DataTable
          data={data?.data || []}
          columns={columns}
          emptyMessage="No subjects found."
        />
      )}

      <SubjectFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subjectToEdit={subjectToEdit}
        departments={departmentsData?.data || []}
      />
    </div>
  );
}
