'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Select, Input } from '@/components/ui';
import {
  useFacultyPreferredSubjects,
  useFacultyUnavailability,
  useAddPreferredSubject,
  useRemovePreferredSubject,
  useAddUnavailability,
  useRemoveUnavailability,
  useSubjects,
} from '@/hooks';
import { Heart, Calendar, Trash2, Plus, Loader2, AlertCircle } from 'lucide-react';

interface FacultyPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  faculty: {
    id: string;
    fullName: string;
    departmentId: string;
  } | null;
}

export function FacultyPreferencesModal({ isOpen, onClose, faculty }: FacultyPreferencesModalProps) {
  const [activeTab, setActiveTab] = useState<'preferences' | 'unavailability'>('preferences');

  // Form states - preferences
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedRank, setSelectedRank] = useState('1');
  const [prefError, setPrefError] = useState('');

  // Form states - unavailability
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [unavailError, setUnavailError] = useState('');

  // Clear errors and form inputs when modal opens/closes or faculty changes
  useEffect(() => {
    if (isOpen) {
      setSelectedSubjectId('');
      setSelectedRank('1');
      setStartDate('');
      setEndDate('');
      setReason('');
      setPrefError('');
      setUnavailError('');
    }
  }, [isOpen, faculty]);

  // React Query hooks for Preferences
  const { data: preferredSubjects, isLoading: loadingPreferences } = useFacultyPreferredSubjects(faculty?.id || '');
  const { data: subjectsData, isLoading: loadingSubjects } = useSubjects({
    departmentId: faculty?.departmentId || '',
    pageSize: 100,
  });
  const addPreferenceMutation = useAddPreferredSubject(faculty?.id || '');
  const removePreferenceMutation = useRemovePreferredSubject(faculty?.id || '');

  // React Query hooks for Unavailability
  const { data: unavailabilityList, isLoading: loadingUnavailability } = useFacultyUnavailability(faculty?.id || '');
  const addUnavailabilityMutation = useAddUnavailability(faculty?.id || '');
  const removeUnavailabilityMutation = useRemoveUnavailability(faculty?.id || '');

  if (!faculty) return null;

  const subjects = subjectsData?.data || [];

  // Filter out subjects that are already in preferences
  const preferredSubjectIds = new Set(preferredSubjects?.map((p) => p.subjectId) || []);
  const availableSubjects = subjects.filter((s) => !preferredSubjectIds.has(s.id));

  // Subject Preferences Handlers
  const handleAddPreference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) {
      setPrefError('Please select a subject.');
      return;
    }
    try {
      setPrefError('');
      await addPreferenceMutation.mutateAsync({
        subjectId: selectedSubjectId,
        preferenceRank: parseInt(selectedRank, 10),
      });
      setSelectedSubjectId('');
      setSelectedRank('1');
    } catch (err: any) {
      setPrefError(err?.message || 'Failed to add preferred subject.');
    }
  };

  const handleDeletePreference = async (subjectId: string) => {
    try {
      setPrefError('');
      await removePreferenceMutation.mutateAsync(subjectId);
    } catch (err: any) {
      setPrefError(err?.message || 'Failed to remove preferred subject.');
    }
  };

  // Unavailability Handlers
  const handleAddUnavailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setUnavailError('Start and end dates are required.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setUnavailError('End date cannot be before start date.');
      return;
    }
    try {
      setUnavailError('');
      await addUnavailabilityMutation.mutateAsync({
        startDate,
        endDate,
        reason: reason.trim() || undefined,
      });
      setStartDate('');
      setEndDate('');
      setReason('');
    } catch (err: any) {
      setUnavailError(err?.message || 'Failed to add unavailability block.');
    }
  };

  const handleDeleteUnavailability = async (id: string) => {
    try {
      setUnavailError('');
      await removeUnavailabilityMutation.mutateAsync(id);
    } catch (err: any) {
      setUnavailError(err?.message || 'Failed to remove unavailability record.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Preferences & Availability — ${faculty.fullName}`}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 -mx-6 px-6">
          {[
            { id: 'preferences', label: 'Subject Preferences', icon: Heart },
            { id: 'unavailability', label: 'Unavailability', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors outline-none -mb-px ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Subject Preferences */}
        {activeTab === 'preferences' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wider">
              Preferred Subjects
            </h3>

            {loadingPreferences || loadingSubjects ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-650 mr-2" />
                <span className="text-sm text-gray-500">Loading preferences...</span>
              </div>
            ) : !preferredSubjects || preferredSubjects.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-gray-250 dark:border-gray-800 rounded-lg text-sm text-gray-500">
                No preferred subjects configured.
              </div>
            ) : (
              <div className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-lg">
                <table className="w-full border-collapse text-left text-sm text-gray-900 dark:text-gray-100">
                  <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-4 py-2">Subject</th>
                      <th className="px-4 py-2">Rank</th>
                      <th className="px-4 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {preferredSubjects.map((pref) => (
                      <tr key={pref.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                        <td className="px-4 py-2.5">
                          <span className="font-semibold block text-gray-900 dark:text-white">
                            {pref.subject?.code}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {pref.subject?.name}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-755 dark:bg-blue-900/30 dark:text-blue-300">
                            Rank {pref.preferenceRank}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePreference(pref.subjectId)}
                            disabled={removePreferenceMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-650" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add Preference Form */}
            <form onSubmit={handleAddPreference} className="space-y-4 border-t border-gray-200 dark:border-gray-800 pt-4 mt-6">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Add Subject Preference
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <Select
                    label="Subject"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    options={[
                      { label: 'Select a subject...', value: '' },
                      ...availableSubjects.map((s) => ({
                        label: `${s.code} - ${s.name}`,
                        value: s.id,
                      })),
                    ]}
                  />
                </div>
                <div>
                  <Select
                    label="Preference Rank"
                    value={selectedRank}
                    onChange={(e) => setSelectedRank(e.target.value)}
                    options={[
                      { label: '1 (Highest)', value: '1' },
                      { label: '2', value: '2' },
                      { label: '3', value: '3' },
                      { label: '4', value: '4' },
                      { label: '5 (Lowest)', value: '5' },
                    ]}
                  />
                </div>
              </div>

              {prefError && (
                <div className="flex gap-2 p-3 text-sm rounded bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{prefError}</span>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!selectedSubjectId || addPreferenceMutation.isPending}
                  isLoading={addPreferenceMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Preference
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Unavailability Date Blocks */}
        {activeTab === 'unavailability' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wider">
              Unavailable Date Blocks
            </h3>

            {loadingUnavailability ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                <span className="text-sm text-gray-500">Loading unavailability...</span>
              </div>
            ) : !unavailabilityList || unavailabilityList.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-gray-250 dark:border-gray-800 rounded-lg text-sm text-gray-500">
                No unavailability dates configured.
              </div>
            ) : (
              <div className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-lg">
                <table className="w-full border-collapse text-left text-sm text-gray-900 dark:text-gray-100">
                  <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 font-semibold border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-4 py-2">Start Date</th>
                      <th className="px-4 py-2">End Date</th>
                      <th className="px-4 py-2">Reason</th>
                      <th className="px-4 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {unavailabilityList.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                        <td className="px-4 py-2.5">
                          {new Date(item.startDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5">
                          {new Date(item.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                          {item.reason || <span className="italic text-gray-450">None</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUnavailability(item.id)}
                            disabled={removeUnavailabilityMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-650" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add Unavailability Block Form */}
            <form onSubmit={handleAddUnavailability} className="space-y-4 border-t border-gray-200 dark:border-gray-800 pt-4 mt-6">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Add Unavailability Block
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <Input
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
              <Input
                label="Reason / Description"
                placeholder="e.g. Leave, Academic Conference"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />

              {unavailError && (
                <div className="flex gap-2 p-3 text-sm rounded bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{unavailError}</span>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!startDate || !endDate || addUnavailabilityMutation.isPending}
                  isLoading={addUnavailabilityMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Block
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Modal>
  );
}
