'use client';

import { useState } from 'react';
import { useFacultyList, useDeleteFaculty } from '@/hooks';
import { DataTable, Button } from '@/components/ui';
import { FacultyFormModal } from './FacultyFormModal';
import { FacultyPreferencesModal } from './FacultyPreferencesModal';
import { Plus, Edit2, Trash2, Settings } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function FacultyTable() {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [facultyToEdit, setFacultyToEdit] = useState<any>(null);
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);
  const [selectedFacultyForPrefs, setSelectedFacultyForPrefs] = useState<any>(null);

  const { data, isLoading } = useFacultyList({ page, pageSize: 10 });
  const deleteMutation = useDeleteFaculty();

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';
  const isSchoolAdmin = session?.user?.role === 'SCHOOL_ADMIN';
  const isDeptAdmin = session?.user?.role === 'DEPT_ADMIN';

  const handleEdit = (faculty: any) => {
    setFacultyToEdit(faculty);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setFacultyToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenPrefs = (faculty: any) => {
    setSelectedFacultyForPrefs(faculty);
    setIsPrefsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this faculty member?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns = [
    { header: 'Full Name', accessorKey: 'fullName' as const },
    { header: 'Email', accessorKey: 'email' as const },
    { 
      header: 'Department', 
      cell: (faculty: any) => faculty.department?.name || 'N/A' 
    },
    { header: 'Seniority Level', accessorKey: 'seniorityLevel' as const },
    {
      header: 'Actions',
      cell: (faculty: any) => {
        // Simple permission check: all these roles can edit and delete if they see it in the scope.
        // Wait, the API already scopes the list, so they can edit/delete what they see.
        const canEdit = isSuperAdmin || isSchoolAdmin || isDeptAdmin;
        const canDelete = isSuperAdmin || isSchoolAdmin || isDeptAdmin;

        return (
          <div className="flex space-x-2">
            {canEdit && (
              <>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(faculty)} title="Edit Faculty">
                  <Edit2 className="w-4 h-4 text-blue-600" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleOpenPrefs(faculty)} title="Preferences & Availability">
                  <Settings className="w-4 h-4 text-gray-650 dark:text-gray-350" />
                </Button>
              </>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" onClick={() => handleDelete(faculty.id)} title="Delete Faculty">
                <Trash2 className="w-4 h-4 text-red-650" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (isLoading) return <div>Loading faculty...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Faculty</h2>
        {(isSuperAdmin || isSchoolAdmin || isDeptAdmin) && (
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Faculty
          </Button>
        )}
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        emptyMessage="No faculty found."
      />

      <FacultyFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        facultyToEdit={facultyToEdit}
      />

      <FacultyPreferencesModal
        isOpen={isPrefsOpen}
        onClose={() => {
          setIsPrefsOpen(false);
          setSelectedFacultyForPrefs(null);
        }}
        faculty={selectedFacultyForPrefs}
      />
    </div>
  );
}
