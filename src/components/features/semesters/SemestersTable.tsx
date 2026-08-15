'use client';

import { useState } from 'react';
import { useSemesters, useDeleteSemester } from '@/hooks';
import { DataTable, Button, Input } from '@/components/ui';
import { SemesterFormModal } from './SemesterFormModal';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function SemestersTable() {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [semesterToEdit, setSemesterToEdit] = useState<any>(null);

  const { data, isLoading } = useSemesters({ 
    page, 
    pageSize: 10, 
    search: search || undefined
  });
  
  const deleteMutation = useDeleteSemester();
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  const handleEdit = (semester: any) => {
    setSemesterToEdit(semester);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSemesterToEdit(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this semester? This cannot be undone.')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns = [
    { header: 'Name', accessorKey: 'name' as const },
    { 
      header: 'Start Date', 
      cell: (semester: any) => new Date(semester.startDate).toLocaleDateString() 
    },
    { 
      header: 'End Date', 
      cell: (semester: any) => new Date(semester.endDate).toLocaleDateString() 
    },
    { 
      header: 'Status', 
      cell: (semester: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          semester.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {semester.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'Actions',
      cell: (semester: any) => (
        <div className="flex space-x-2">
          {isSuperAdmin && (
            <>
              <Button variant="ghost" size="sm" onClick={() => handleEdit(semester)}>
                <Edit2 className="w-4 h-4 text-blue-600" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(semester.id)}>
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Semesters</h2>
        {isSuperAdmin && (
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Semester
          </Button>
        )}
      </div>

      <div className="w-64 mb-4">
        <Input 
          placeholder="Search semesters..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div>Loading semesters...</div>
      ) : (
        <DataTable
          data={data?.data || []}
          columns={columns}
          emptyMessage="No semesters found."
        />
      )}

      <SemesterFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        semesterToEdit={semesterToEdit}
      />
    </div>
  );
}
