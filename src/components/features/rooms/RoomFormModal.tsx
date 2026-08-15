'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRoomSchema, updateRoomSchema } from '@/lib/validators';
import { Modal, Input, Button, Select } from '@/components/ui';
import { useCreateRoom, useUpdateRoom, useSchools } from '@/hooks';

interface RoomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomToEdit?: any | null;
}

export function RoomFormModal({ isOpen, onClose, roomToEdit }: RoomFormModalProps) {
  const isEditing = !!roomToEdit;
  
  const createMutation = useCreateRoom();
  const updateMutation = useUpdateRoom(roomToEdit?.id || '');

  const { data: schoolsData } = useSchools({ pageSize: 100 });
  const schools = schoolsData?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(isEditing ? updateRoomSchema : createRoomSchema) as any,
    defaultValues: {
      name: '',
      capacity: 60,
      roomType: 'LECTURE_HALL',
      schoolId: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (roomToEdit) {
        reset({
          name: roomToEdit.name,
          capacity: roomToEdit.capacity,
          roomType: roomToEdit.roomType,
          schoolId: roomToEdit.schoolId,
        });
      } else {
        reset({
          name: '',
          capacity: 60,
          roomType: 'LECTURE_HALL',
          schoolId: '',
        });
      }
    }
  }, [isOpen, roomToEdit, reset]);

  const onSubmit = async (data: any) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save room:', error);
      alert('Failed to save room');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={isLoading}>
        Cancel
      </Button>
      <Button onClick={handleSubmit(onSubmit as any)} isLoading={isLoading}>
        {isEditing ? 'Save Changes' : 'Create Room'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Room' : 'Add New Room'}
      footer={footer}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit as any)}>
        <Input
          label="Room Name"
          placeholder="e.g. Room 101"
          {...register('name')}
          error={errors.name?.message as string}
        />
        
        <Input
          label="Capacity"
          type="number"
          {...register('capacity', { valueAsNumber: true })}
          error={errors.capacity?.message as string}
        />

        <Select
          label="Room Type"
          {...register('roomType')}
          error={errors.roomType?.message as string}
          options={[
            { label: 'Lecture Hall', value: 'LECTURE_HALL' },
            { label: 'Lab', value: 'LAB' },
            { label: 'Seminar Room', value: 'SEMINAR_ROOM' },
          ]}
        />

        {!isEditing && (
          <Select
            label="School"
            {...register('schoolId')}
            error={errors.schoolId?.message as string}
            options={[
              { label: 'Select School', value: '' },
              ...schools.map((school: any) => ({
                label: school.name,
                value: school.id,
              })),
            ]}
          />
        )}
      </form>
    </Modal>
  );
}
