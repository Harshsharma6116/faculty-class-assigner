'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDepartmentSchema, updateDepartmentSchema, type CreateDepartmentInput } from '@/lib/validators';
import { Modal, Input, Button } from '@/components/ui';
import { useCreateDepartment, useUpdateDepartment, useSchools } from '@/hooks';
import { useSession } from 'next-auth/react';

interface DepartmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentToEdit?: { id: string; name: string; shortCode: string; schoolId: string } | null;
}

export function DepartmentFormModal({ isOpen, onClose, departmentToEdit }: DepartmentFormModalProps) {
  const isEditing = !!departmentToEdit;
  const { data: session } = useSession();
  
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment(departmentToEdit?.id || '');

  // Fetch schools for the select dropdown (only needed for super admin to choose a school)
  const { data: schoolsData } = useSchools({ pageSize: 100 }); 
  const schools = schoolsData?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateDepartmentInput>({
    resolver: zodResolver(isEditing ? updateDepartmentSchema : createDepartmentSchema) as any,
    defaultValues: {
      name: '',
      shortCode: '',
      schoolId: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (departmentToEdit) {
        reset({ 
          name: departmentToEdit.name, 
          shortCode: departmentToEdit.shortCode,
          schoolId: departmentToEdit.schoolId
        });
      } else {
        const defaultSchoolId = session?.user?.schoolId || (schools.length > 0 ? schools[0].id : '');
        reset({ name: '', shortCode: '', schoolId: defaultSchoolId });
      }
    }
  }, [isOpen, departmentToEdit, reset, session?.user?.schoolId, schools]);

  const onSubmit = async (data: CreateDepartmentInput) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save department:', error);
      alert('Failed to save department');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={isLoading}>
        Cancel
      </Button>
      <Button onClick={handleSubmit(onSubmit)} isLoading={isLoading}>
        {isEditing ? 'Save Changes' : 'Create Department'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Department' : 'Add New Department'}
      footer={footer}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit as any)}>
        <Input
          label="Department Name"
          placeholder="e.g. Computer Science"
          {...register('name')}
          error={errors.name?.message}
        />
        <Input
          label="Short Code"
          placeholder="e.g. CS"
          {...register('shortCode')}
          error={errors.shortCode?.message}
        />

        {!isEditing && isSuperAdmin && (
          <div className="w-full flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">School</label>
            <select
              {...register('schoolId')}
              className={`px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${errors.schoolId ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select a school</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.schoolId && <p className="text-sm text-red-600">{errors.schoolId.message}</p>}
          </div>
        )}
      </form>
    </Modal>
  );
}
