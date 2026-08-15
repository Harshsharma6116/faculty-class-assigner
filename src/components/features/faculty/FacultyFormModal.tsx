'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFacultySchema, updateFacultySchema, type CreateFacultyInput } from '@/lib/validators';
import { Modal, Input, Button } from '@/components/ui';
import { useCreateFaculty, useUpdateFaculty, useDepartments } from '@/hooks';
import { useSession } from 'next-auth/react';

interface FacultyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  facultyToEdit?: any | null;
}

export function FacultyFormModal({ isOpen, onClose, facultyToEdit }: FacultyFormModalProps) {
  const isEditing = !!facultyToEdit;
  const { data: session } = useSession();
  
  const createMutation = useCreateFaculty();
  const updateMutation = useUpdateFaculty(facultyToEdit?.id || '');

  const { data: departmentsData } = useDepartments({ pageSize: 100 }); 
  const departments = departmentsData?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFacultyInput>({
    resolver: zodResolver(isEditing ? updateFacultySchema : createFacultySchema),
    defaultValues: {
      fullName: '',
      email: '',
      departmentId: '',
      seniorityLevel: 'ASSISTANT_PROFESSOR',
      maxClassesPerDay: 5,
      maxClassesPerWeek: 20,
      maxContinuousClasses: 3,
      minGapAfterContinuousBlock: 1,
      weeklyWorkingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      isActive: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (facultyToEdit) {
        reset({ 
          fullName: facultyToEdit.fullName,
          email: facultyToEdit.email,
          departmentId: facultyToEdit.departmentId,
          seniorityLevel: facultyToEdit.seniorityLevel,
          maxClassesPerDay: facultyToEdit.maxClassesPerDay,
          maxClassesPerWeek: facultyToEdit.maxClassesPerWeek,
          maxContinuousClasses: facultyToEdit.maxContinuousClasses,
          minGapAfterContinuousBlock: facultyToEdit.minGapAfterContinuousBlock,
          weeklyWorkingDays: facultyToEdit.weeklyWorkingDays,
          isActive: facultyToEdit.isActive,
        });
      } else {
        const defaultDeptId = session?.user?.departmentId || (departments.length > 0 ? departments[0].id : '');
        reset({ 
          fullName: '',
          email: '',
          departmentId: defaultDeptId,
          seniorityLevel: 'ASSISTANT_PROFESSOR',
          maxClassesPerDay: 5,
          maxClassesPerWeek: 20,
          maxContinuousClasses: 3,
          minGapAfterContinuousBlock: 1,
          weeklyWorkingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          isActive: true,
        });
      }
    }
  }, [isOpen, facultyToEdit, reset, session?.user?.departmentId, departments]);

  const onSubmit = async (data: CreateFacultyInput) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save faculty:', error);
      alert('Failed to save faculty');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;
  const showDeptSelect = !isEditing && (session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'SCHOOL_ADMIN');

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={isLoading}>
        Cancel
      </Button>
      <Button onClick={handleSubmit(onSubmit)} isLoading={isLoading}>
        {isEditing ? 'Save Changes' : 'Create Faculty'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Faculty' : 'Add New Faculty'}
      footer={footer}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Full Name"
          placeholder="e.g. John Doe"
          {...register('fullName')}
          error={errors.fullName?.message}
        />
        <Input
          label="Email"
          type="email"
          placeholder="e.g. john.doe@university.edu"
          {...register('email')}
          error={errors.email?.message}
        />

        {showDeptSelect && (
          <div className="w-full flex flex-col space-y-1">
            <label className="text-sm font-medium text-gray-700">Department</label>
            <select
              {...register('departmentId')}
              className={`px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${errors.departmentId ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select a department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {errors.departmentId && <p className="text-sm text-red-600">{errors.departmentId.message}</p>}
          </div>
        )}

        <div className="w-full flex flex-col space-y-1">
          <label className="text-sm font-medium text-gray-700">Seniority Level</label>
          <select
            {...register('seniorityLevel')}
            className={`px-3 py-2 border rounded-md shadow-sm bg-white text-gray-900 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${errors.seniorityLevel ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="ASSISTANT_PROFESSOR">Assistant Professor</option>
            <option value="ASSOCIATE_PROFESSOR">Associate Professor</option>
            <option value="PROFESSOR">Professor</option>
            <option value="HOD">HOD</option>
          </select>
          {errors.seniorityLevel && <p className="text-sm text-red-600">{errors.seniorityLevel.message}</p>}
        </div>
      </form>
    </Modal>
  );
}
