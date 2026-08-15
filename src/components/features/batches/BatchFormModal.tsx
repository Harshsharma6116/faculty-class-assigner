'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBatchSchema, updateBatchSchema, type CreateBatchInput } from '@/lib/validators';
import { Modal, Input, Button, Select } from '@/components/ui';
import { useCreateBatch, useUpdateBatch, useDepartments, useSemesters } from '@/hooks';

interface BatchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchToEdit?: any | null;
}

export function BatchFormModal({ isOpen, onClose, batchToEdit }: BatchFormModalProps) {
  const isEditing = !!batchToEdit;
  
  const createMutation = useCreateBatch();
  const updateMutation = useUpdateBatch(batchToEdit?.id || '');

  const { data: depsData } = useDepartments({ pageSize: 100 });
  const { data: semsData } = useSemesters({ pageSize: 100 });
  
  const departments = depsData?.data || [];
  const semesters = semsData?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateBatchInput>({
    resolver: zodResolver(isEditing ? updateBatchSchema as any : createBatchSchema) as any,
    defaultValues: {
      name: '',
      departmentId: '',
      semesterId: '',
      degreeLevel: 'UG',
      yearOrSemesterNumber: 1,
      strength: 60,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (batchToEdit) {
        reset({
          name: batchToEdit.name,
          departmentId: batchToEdit.departmentId,
          semesterId: batchToEdit.semesterId,
          degreeLevel: batchToEdit.degreeLevel,
          yearOrSemesterNumber: batchToEdit.yearOrSemesterNumber,
          strength: batchToEdit.strength,
        });
      } else {
        reset({
          name: '',
          departmentId: '',
          semesterId: '',
          degreeLevel: 'UG',
          yearOrSemesterNumber: 1,
          strength: 60,
        });
      }
    }
  }, [isOpen, batchToEdit, reset]);

  const onSubmit = async (data: any) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save batch:', error);
      alert('Failed to save batch');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={isLoading}>
        Cancel
      </Button>
      <Button onClick={handleSubmit(onSubmit)} isLoading={isLoading}>
        {isEditing ? 'Save Changes' : 'Create Batch'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Batch' : 'Add New Batch'}
      footer={footer}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit as any)}>
        <Input
          label="Batch Name"
          placeholder="e.g. CSE-3A"
          {...register('name')}
          error={errors.name?.message}
        />
        
        {!isEditing && (
          <>
            <Select
              label="Department"
              {...register('departmentId')}
              error={errors.departmentId?.message}
              options={[
                { label: 'Select Department', value: '' },
                ...departments.map((dept: any) => ({ label: dept.name, value: dept.id }))
              ]}
            />

            <Select
              label="Semester"
              {...register('semesterId')}
              error={errors.semesterId?.message}
              options={[
                { label: 'Select Semester', value: '' },
                ...semesters.map((sem: any) => ({ label: sem.name, value: sem.id }))
              ]}
            />
          </>
        )}

        <Select
          label="Degree Level"
          {...register('degreeLevel')}
          error={errors.degreeLevel?.message}
          options={[
            { label: 'Undergraduate (UG)', value: 'UG' },
            { label: 'Postgraduate (PG)', value: 'PG' }
          ]}
        />

        <Input
          label="Year / Semester Number"
          type="number"
          {...register('yearOrSemesterNumber', { valueAsNumber: true })}
          error={errors.yearOrSemesterNumber?.message}
        />

        <Input
          label="Strength"
          type="number"
          {...register('strength', { valueAsNumber: true })}
          error={errors.strength?.message}
        />
      </form>
    </Modal>
  );
}
