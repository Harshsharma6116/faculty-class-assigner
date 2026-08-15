'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTimeSlotSchema, updateTimeSlotSchema, CreateTimeSlotInput } from '@/lib/validators/timeslot';
import { Modal, Input, Button, Select } from '@/components/ui';
import { useCreateTimeSlot, useUpdateTimeSlot, useSchools } from '@/hooks';

interface TimeSlotFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeSlotToEdit?: any | null;
}

export function TimeSlotFormModal({ isOpen, onClose, timeSlotToEdit }: TimeSlotFormModalProps) {
  const isEditing = !!timeSlotToEdit;
  
  const createMutation = useCreateTimeSlot();
  const updateMutation = useUpdateTimeSlot(timeSlotToEdit?.id || '');

  const { data: schoolsData } = useSchools({ pageSize: 100 });
  const schools = schoolsData?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTimeSlotInput>({
    resolver: zodResolver(isEditing ? updateTimeSlotSchema : createTimeSlotSchema) as any,
    defaultValues: {
      dayOfWeek: 'MONDAY',
      periodNumber: 1,
      startTime: '',
      endTime: '',
      isBreak: false,
      schoolId: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (timeSlotToEdit) {
        reset({
          dayOfWeek: timeSlotToEdit.dayOfWeek,
          periodNumber: timeSlotToEdit.periodNumber,
          startTime: timeSlotToEdit.startTime,
          endTime: timeSlotToEdit.endTime,
          isBreak: timeSlotToEdit.isBreak,
          schoolId: timeSlotToEdit.schoolId,
        });
      } else {
        reset({
          dayOfWeek: 'MONDAY',
          periodNumber: 1,
          startTime: '',
          endTime: '',
          isBreak: false,
          schoolId: '',
        });
      }
    }
  }, [isOpen, timeSlotToEdit, reset]);

  const onSubmit = async (data: any) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to save time slot:', error);
      alert(error?.response?.data?.error || 'Failed to save time slot. Please check for duplicate periods.');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={isLoading}>
        Cancel
      </Button>
      <Button onClick={handleSubmit(onSubmit as any)} isLoading={isLoading}>
        {isEditing ? 'Save Changes' : 'Create Time Slot'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Time Slot' : 'Add New Time Slot'}
      footer={footer}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit as any)}>
        {!isEditing && (
          <Select
            label="School"
            {...register('schoolId')}
            error={errors.schoolId?.message as string}
            options={[
              { label: 'Select School...', value: '' },
              ...schools.map((school: any) => ({
                label: school.name,
                value: school.id,
              })),
            ]}
          />
        )}

        <Select
          label="Day of Week"
          {...register('dayOfWeek')}
          error={errors.dayOfWeek?.message as string}
          options={[
            { label: 'Monday', value: 'MONDAY' },
            { label: 'Tuesday', value: 'TUESDAY' },
            { label: 'Wednesday', value: 'WEDNESDAY' },
            { label: 'Thursday', value: 'THURSDAY' },
            { label: 'Friday', value: 'FRIDAY' },
            { label: 'Saturday', value: 'SATURDAY' },
          ]}
        />

        <Input
          label="Period Number"
          type="number"
          placeholder="e.g. 1"
          {...register('periodNumber', { valueAsNumber: true })}
          error={errors.periodNumber?.message as string}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Time"
            type="time"
            {...register('startTime')}
            error={errors.startTime?.message as string}
          />
          
          <Input
            label="End Time"
            type="time"
            {...register('endTime')}
            error={errors.endTime?.message as string}
          />
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <input
            type="checkbox"
            id="isBreak"
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            {...register('isBreak')}
          />
          <label htmlFor="isBreak" className="text-sm font-medium text-gray-700">
            Is Break Period? (e.g. Lunch)
          </label>
        </div>
      </form>
    </Modal>
  );
}
