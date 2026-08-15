'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSchoolSchema, updateSchoolSchema, type CreateSchoolInput, type UpdateSchoolInput } from '@/lib/validators';
import { Modal, Input, Button } from '@/components/ui';
import { useCreateSchool, useUpdateSchool } from '@/hooks';

interface SchoolFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolToEdit?: { id: string; name: string; shortCode: string } | null;
}

export function SchoolFormModal({ isOpen, onClose, schoolToEdit }: SchoolFormModalProps) {
  const isEditing = !!schoolToEdit;
  
  const createMutation = useCreateSchool();
  const updateMutation = useUpdateSchool(schoolToEdit?.id || '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSchoolInput>({
    resolver: zodResolver(isEditing ? updateSchoolSchema : createSchoolSchema) as any,
    defaultValues: {
      name: '',
      shortCode: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (schoolToEdit) {
        reset({ name: schoolToEdit.name, shortCode: schoolToEdit.shortCode });
      } else {
        reset({ name: '', shortCode: '' });
      }
    }
  }, [isOpen, schoolToEdit, reset]);

  const onSubmit = async (data: CreateSchoolInput) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save school:', error);
      alert('Failed to save school');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={isLoading}>
        Cancel
      </Button>
      <Button onClick={handleSubmit(onSubmit as any)} isLoading={isLoading}>
        {isEditing ? 'Save Changes' : 'Create School'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit School' : 'Add New School'}
      footer={footer}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit as any)}>
        <Input
          label="School Name"
          placeholder="e.g. Amity School of Engineering"
          {...register('name')}
          error={errors.name?.message}
        />
        <Input
          label="Short Code"
          placeholder="e.g. ASET"
          {...register('shortCode')}
          error={errors.shortCode?.message}
        />
      </form>
    </Modal>
  );
}
