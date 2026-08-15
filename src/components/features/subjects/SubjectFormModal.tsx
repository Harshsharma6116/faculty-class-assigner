'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSubjectSchema, updateSubjectSchema, type CreateSubjectInput } from '@/lib/validators';
import { Modal, Input, Button, Select } from '@/components/ui';
import { useCreateSubject, useUpdateSubject } from '@/hooks';

interface SubjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectToEdit?: any | null;
  departments: any[];
}

export function SubjectFormModal({ isOpen, onClose, subjectToEdit, departments }: SubjectFormModalProps) {
  const isEditing = !!subjectToEdit;
  
  const createMutation = useCreateSubject();
  const updateMutation = useUpdateSubject(subjectToEdit?.id || '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSubjectInput>({
    resolver: zodResolver(isEditing ? updateSubjectSchema : createSubjectSchema),
    defaultValues: {
      name: '',
      code: '',
      departmentId: '',
      degreeLevel: 'UG',
      classType: 'LECTURE',
      weeklyClassesRequired: 3,
      creditHours: 3,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (subjectToEdit) {
        reset({ 
          name: subjectToEdit.name, 
          code: subjectToEdit.code,
          departmentId: subjectToEdit.departmentId,
          degreeLevel: subjectToEdit.degreeLevel,
          classType: subjectToEdit.classType,
          weeklyClassesRequired: subjectToEdit.weeklyClassesRequired,
          creditHours: subjectToEdit.creditHours ?? undefined,
        });
      } else {
        reset({ 
          name: '', 
          code: '',
          departmentId: departments.length === 1 ? departments[0].id : '',
          degreeLevel: 'UG',
          classType: 'LECTURE',
          weeklyClassesRequired: 3,
          creditHours: 3,
        });
      }
    }
  }, [isOpen, subjectToEdit, departments, reset]);

  const onSubmit = async (data: CreateSubjectInput) => {
    try {
      if (isEditing) {
        // Omit departmentId from update data if we follow strict validation
        const { departmentId, ...updateData } = data;
        await updateMutation.mutateAsync(updateData as any);
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save subject:', error);
      alert('Failed to save subject');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={isLoading}>
        Cancel
      </Button>
      <Button onClick={handleSubmit(onSubmit)} isLoading={isLoading}>
        {isEditing ? 'Save Changes' : 'Create Subject'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Subject' : 'Add New Subject'}
      footer={footer}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Subject Name"
          placeholder="e.g. Data Structures"
          {...register('name')}
          error={errors.name?.message}
        />
        <Input
          label="Subject Code"
          placeholder="e.g. CS201"
          {...register('code')}
          error={errors.code?.message}
        />
        
        {!isEditing && (
          <Select
            label="Department"
            {...register('departmentId')}
            error={errors.departmentId?.message}
            options={departments.map(d => ({ label: d.name, value: d.id }))}
          />
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Degree Level"
            {...register('degreeLevel')}
            error={errors.degreeLevel?.message}
            options={[
              { label: 'UG (Undergraduate)', value: 'UG' },
              { label: 'PG (Postgraduate)', value: 'PG' },
            ]}
          />
          <Select
            label="Class Type"
            {...register('classType')}
            error={errors.classType?.message}
            options={[
              { label: 'Lecture', value: 'LECTURE' },
              { label: 'Lab', value: 'LAB' },
              { label: 'Tutorial', value: 'TUTORIAL' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Weekly Classes Required"
            type="number"
            {...register('weeklyClassesRequired', { valueAsNumber: true })}
            error={errors.weeklyClassesRequired?.message}
          />
          <Input
            label="Credit Hours"
            type="number"
            {...register('creditHours', { valueAsNumber: true })}
            error={errors.creditHours?.message}
          />
        </div>
      </form>
    </Modal>
  );
}
