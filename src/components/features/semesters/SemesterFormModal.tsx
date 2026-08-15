'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSemesterSchema, updateSemesterSchema, type CreateSemesterInput } from '@/lib/validators';
import { Modal, Input, Button } from '@/components/ui';
import { useCreateSemester, useUpdateSemester } from '@/hooks';

interface SemesterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  semesterToEdit?: any | null;
}

export function SemesterFormModal({ isOpen, onClose, semesterToEdit }: SemesterFormModalProps) {
  const isEditing = !!semesterToEdit;
  
  const createMutation = useCreateSemester();
  const updateMutation = useUpdateSemester(semesterToEdit?.id || '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSemesterInput>({
    resolver: zodResolver(isEditing ? updateSemesterSchema : createSemesterSchema),
    defaultValues: {
      name: '',
      startDate: '',
      endDate: '',
      isActive: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (semesterToEdit) {
        // Format dates as YYYY-MM-DD for the date input
        const formatDate = (dateString: string) => {
          const d = new Date(dateString);
          return d.toISOString().split('T')[0];
        };
        
        reset({ 
          name: semesterToEdit.name,
          startDate: formatDate(semesterToEdit.startDate),
          endDate: formatDate(semesterToEdit.endDate),
          isActive: semesterToEdit.isActive,
        });
      } else {
        reset({ 
          name: '',
          startDate: '',
          endDate: '',
          isActive: false,
        });
      }
    }
  }, [isOpen, semesterToEdit, reset]);

  const onSubmit = async (data: CreateSemesterInput) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save semester:', error);
      alert('Failed to save semester');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={isLoading}>
        Cancel
      </Button>
      <Button onClick={handleSubmit(onSubmit)} isLoading={isLoading}>
        {isEditing ? 'Save Changes' : 'Create Semester'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Semester' : 'Add New Semester'}
      footer={footer}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Semester Name"
          placeholder="e.g. Odd Sem 2026"
          {...register('name')}
          error={errors.name?.message}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            {...register('startDate')}
            error={errors.startDate?.message}
          />
          <Input
            label="End Date"
            type="date"
            {...register('endDate')}
            error={errors.endDate?.message}
          />
        </div>
        
        <div className="flex items-center space-x-2 mt-4">
          <input
            type="checkbox"
            id="isActive"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            {...register('isActive')}
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
            Set as Active Semester
          </label>
        </div>
        {errors.isActive?.message && (
          <p className="text-sm text-red-600">{errors.isActive.message}</p>
        )}
      </form>
    </Modal>
  );
}
