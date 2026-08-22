'use client';

import { useState, useEffect } from 'react';
import {
  useSemesters,
  useClassRequirements,
  useRunAllocation,
  useAllocationRuns,
  useAuditLogs,
} from '@/hooks';
import { DataTable, Button, Input, Select } from '@/components/ui';
import { TimetableGrid } from './TimetableGrid';
import { ManualAssignModal } from './ManualAssignModal';
import {
  Play,
  AlertTriangle,
  CheckCircle,
  FileText,
  Calendar,
  Layers,
  History,
  Activity,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Loader2,
} from 'lucide-react';
import type { ClassRequirementStatus } from '@prisma/client';

export function AllocationDashboard() {
  const [semesterId, setSemesterId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'requirements' | 'timetable' | 'conflicts' | 'history' | 'audit'>('requirements');
  const [activeRequirement, setActiveRequirement] = useState<any>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // States for tab features
  const [reqPage, setReqPage] = useState(1);
  const [reqSearch, setReqSearch] = useState('');
  const [reqStatus, setReqStatus] = useState<string>('');
  const [auditPage, setAuditPage] = useState(1);

  // Run Results display states
  const [runResult, setRunResult] = useState<any>(null);
  const [runError, setRunError] = useState<string>('');

  // Fetch semesters
  const { data: semestersRes, isLoading: loadingSemesters } = useSemesters({ pageSize: 100 });
  const semesters = semestersRes?.data || [];

  // Auto-select active semester
  useEffect(() => {
    if (semesters.length > 0 && !semesterId) {
      const activeSem = semesters.find((s) => s.isActive);
      if (activeSem) {
        setSemesterId(activeSem.id);
      } else {
        setSemesterId(semesters[0].id);
      }
    }
  }, [semesters, semesterId]);

  // Fetch class requirements for stats calculation (large page size to capture all)
  const { data: allReqsRes, isLoading: loadingStats, refetch: refetchStats } = useClassRequirements({
    semesterId,
    pageSize: 1000,
  });
  const allRequirements = allReqsRes?.data || [];

  // Calculate real-time stats
  const totalReqs = allRequirements.length;
  const fulfilledReqs = allRequirements.filter(
    (r) => r.status === 'AUTO_ASSIGNED' || r.status === 'MANUALLY_ASSIGNED'
  ).length;
  const unfulfilledReqs = allRequirements.filter((r) => r.status === 'UNASSIGNED').length;
  const conflictReqs = allRequirements.filter((r) => r.status === 'CONFLICT').length;

  // Mutation for running auto-allocation
  const runAllocationMutation = useRunAllocation(semesterId);

  // 1. Requirements Tab query
  const { data: reqTableRes, isLoading: loadingReqTable } = useClassRequirements({
    semesterId,
    page: reqPage,
    pageSize: 10,
    search: reqSearch || undefined, // @ts-ignore
    status: reqStatus || undefined,
  } as any);
  const requirements = reqTableRes?.data || [];
  const reqMetadata = (reqTableRes as any)?.metadata || { total: 0, totalPages: 1 };

  // 2. Conflicts Tab query
  const { data: conflictsRes, isLoading: loadingConflicts } = useClassRequirements({
    semesterId,
    status: 'CONFLICT',
    pageSize: 100,
  });
  const conflictsList = conflictsRes?.data || [];

  // 3. Runs History query
  const { data: runs, isLoading: loadingRuns } = useAllocationRuns(semesterId);

  // 4. Audit Logs query
  const { data: auditLogsRes, isLoading: loadingAuditLogs } = useAuditLogs({
    page: auditPage,
    pageSize: 10,
  });
  const auditLogs = auditLogsRes?.data || [];
  const auditMetadata = (auditLogsRes as any)?.metadata || { total: 0, totalPages: 1 };

  const handleRunAllocation = async () => {
    if (!semesterId) return;
    try {
      setRunError('');
      setRunResult(null);
      const res = await runAllocationMutation.mutateAsync();
      setRunResult(res);
      refetchStats();
    } catch (err: any) {
      setRunError(err?.message || 'Failed to execute auto-allocation run.');
    }
  };

  const handleOpenOverride = (requirement: any) => {
    setActiveRequirement(requirement);
    setIsManualModalOpen(true);
  };

  // Helper to parse summaryJson safely
  const parseSummaryJson = (summaryJson: any) => {
    try {
      if (!summaryJson) return {};
      return typeof summaryJson === 'string' ? JSON.parse(summaryJson) : summaryJson;
    } catch {
      return {};
    }
  };

  // Badges helper
  const getStatusBadge = (status: ClassRequirementStatus) => {
    switch (status) {
      case 'UNASSIGNED':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">Unassigned</span>;
      case 'AUTO_ASSIGNED':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">Auto Assigned</span>;
      case 'MANUALLY_ASSIGNED':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">Manually Assigned</span>;
      case 'CONFLICT':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 animate-pulse">Conflict</span>;
      default:
        return null;
    }
  };

  if (loadingSemesters) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mb-2" />
        <p className="text-gray-500 text-sm">Loading Allocation Dashboard...</p>
      </div>
    );
  }

  if (semesters.length === 0) {
    return (
      <div className="p-6 text-center bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 rounded-xl max-w-lg mx-auto mt-12">
        <AlertTriangle className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No Semesters Found</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          You must define and configure at least one semester before scheduling class allocations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-card/40 backdrop-blur-xl border border-border/50 rounded-xl shadow-xs relative overflow-hidden">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Class Allocation Control</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monitor timetable allocations, resolve conflicts, and run the auto-scheduling engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Semester Selector */}
          <div className="w-56">
            <Select
              value={semesterId}
              onChange={(e) => {
                setSemesterId(e.target.value);
                setReqPage(1);
              }}
              options={semesters.map((s) => ({
                label: `${s.name} ${s.isActive ? '(Active)' : ''}`,
                value: s.id,
              }))}
            />
          </div>

          {/* Auto Allocation Trigger */}
          <Button
            variant="primary"
            onClick={handleRunAllocation}
            isLoading={runAllocationMutation.isPending}
            disabled={!semesterId}
          >
            <Play className="w-4 h-4 mr-2" />
            Run Auto-Allocation
          </Button>
        </div>
      </div>

      {/* Auto-Allocation Success Results Banner */}
      {runResult && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 p-5 rounded-xl flex gap-3 text-sm">
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <h4 className="font-bold text-green-900 dark:text-green-300 text-base">Allocation Engine Executed Successfully</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-green-850 dark:text-green-400 font-medium">
              <div>Total Requirements: <span className="font-bold text-sm text-green-900 dark:text-green-200">{runResult.summary?.totalRequirements}</span></div>
              <div>Allocated: <span className="font-bold text-sm text-green-900 dark:text-green-200">{runResult.summary?.fulfilled}</span></div>
              <div>Unfulfilled: <span className="font-bold text-sm text-green-900 dark:text-green-200">{runResult.summary?.unfulfilled}</span></div>
              <div>Conflicts Found: <span className="font-bold text-sm text-green-900 dark:text-green-200">{runResult.summary?.conflicts}</span></div>
            </div>
            {runResult.summary?.conflicts > 0 && (
              <p className="text-xs text-green-700 dark:text-green-400 font-medium pt-1">
                Tip: You can view specific conflict descriptions under the <strong className="cursor-pointer underline" onClick={() => setActiveTab('conflicts')}>Conflicts Log</strong> tab and resolve them using manual overrides.
              </p>
            )}
            <Button size="sm" variant="outline" className="text-green-700 dark:text-green-350 border-green-300 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40" onClick={() => setRunResult(null)}>
              Dismiss Summary
            </Button>
          </div>
        </div>
      )}

      {/* Auto-Allocation Error Banner */}
      {runError && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-4 rounded-xl flex gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <h4 className="font-bold text-red-900 dark:text-red-300">Engine Execution Failed</h4>
            <p className="text-xs text-red-700 dark:text-red-400">{runError}</p>
            <Button size="sm" variant="outline" className="text-red-700 dark:text-red-350 border-red-300 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40" onClick={() => setRunError('')}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 p-5 rounded-xl shadow-xs flex items-center gap-4 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Required</div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5">
              {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : totalReqs}
            </div>
          </div>
        </div>

        {/* Card 2: Fulfilled */}
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 p-5 rounded-xl shadow-xs flex items-center gap-4 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fulfilled</div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5">
              {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : fulfilledReqs}
            </div>
          </div>
        </div>

        {/* Card 3: Unfulfilled */}
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 p-5 rounded-xl shadow-xs flex items-center gap-4 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unfulfilled</div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5">
              {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : unfulfilledReqs}
            </div>
          </div>
        </div>

        {/* Card 4: Conflicts */}
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 p-5 rounded-xl shadow-xs flex items-center gap-4 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Conflicts</div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white mt-0.5">
              {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : conflictReqs}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher Layout */}
      <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden shadow-xs relative">
        <div className="flex border-b border-border/50 overflow-x-auto">
          {[
            { id: 'requirements', label: 'Requirements List', icon: FileText },
            { id: 'timetable', label: 'Timetable Grid', icon: Calendar },
            { id: 'conflicts', label: 'Conflicts Log', icon: AlertTriangle },
            { id: 'history', label: 'Runs History', icon: History },
            { id: 'audit', label: 'Audit Logs', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors outline-none ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-gray-50/50 dark:bg-gray-850'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'conflicts' && conflictReqs > 0 && (
                  <span className="ml-1 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                    {conflictReqs}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {/* REQUIREMENTS TAB */}
          {activeTab === 'requirements' && (
            <div className="space-y-4">
              {/* Requirements Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search subject code, batch, room..."
                    value={reqSearch}
                    onChange={(e) => {
                      setReqSearch(e.target.value);
                      setReqPage(1);
                    }}
                    className="pl-9"
                  />
                </div>

                <div className="w-full sm:w-48">
                  <Select
                    value={reqStatus}
                    onChange={(e) => {
                      setReqStatus(e.target.value);
                      setReqPage(1);
                    }}
                    options={[
                      { label: 'All Statuses', value: '' },
                      { label: 'Unassigned', value: 'UNASSIGNED' },
                      { label: 'Auto Assigned', value: 'AUTO_ASSIGNED' },
                      { label: 'Manually Assigned', value: 'MANUALLY_ASSIGNED' },
                      { label: 'Conflict', value: 'CONFLICT' },
                    ]}
                  />
                </div>
              </div>

              {/* Requirements Table */}
              {loadingReqTable ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="text-gray-500 text-sm">Loading requirements...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <DataTable
                    data={requirements}
                    columns={[
                      {
                        header: 'Subject',
                        cell: (row) => (
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {(row as any).subject?.code}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {(row as any).subject?.name}
                            </div>
                          </div>
                        ),
                      },
                      { header: 'Batch', cell: (row) => (row as any).batch?.name },
                      { header: 'Room Context', cell: (row) => (row as any).room?.name },
                      {
                        header: 'Type',
                        cell: (row) => (
                          <span className="text-xs font-medium uppercase px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            {row.classType.toLowerCase()}
                          </span>
                        ),
                      },
                      { header: 'Sessions/Wk', accessorKey: 'sessionsPerWeek' },
                      {
                        header: 'Assigned Faculty',
                        cell: (row) =>
                          (row as any).assignedFaculty ? (
                            <span className="font-medium flex items-center gap-1.5 text-gray-900 dark:text-white">
                              <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              {(row as any).assignedFaculty.fullName}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Unassigned</span>
                          ),
                      },
                      {
                        header: 'Status',
                        cell: (row) => getStatusBadge(row.status),
                      },
                      {
                        header: 'Actions',
                        cell: (row) => (
                          <Button variant="outline" size="sm" onClick={() => handleOpenOverride(row)}>
                            Override
                          </Button>
                        ),
                      },
                    ]}
                    emptyMessage="No class requirements found."
                  />

                  {/* Requirements Pagination */}
                  {reqMetadata.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
                      <span className="text-xs text-gray-500">
                        Page {reqPage} of {reqMetadata.totalPages}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReqPage((p) => Math.max(1, p - 1))}
                          disabled={reqPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReqPage((p) => Math.min(reqMetadata.totalPages, p + 1))}
                          disabled={reqPage === reqMetadata.totalPages}
                        >
                          Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TIMETABLE TAB */}
          {activeTab === 'timetable' && (
            <TimetableGrid semesterId={semesterId} />
          )}

          {/* CONFLICTS TAB */}
          {activeTab === 'conflicts' && (
            <div className="space-y-4">
              {loadingConflicts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="text-gray-500 text-sm">Checking for conflicts...</span>
                </div>
              ) : conflictsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-250 dark:border-gray-800 rounded-xl bg-green-50/10">
                  <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mb-2" />
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">All Clear!</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    No active scheduling conflicts found in the database.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-lg text-xs flex gap-2 border border-red-200 dark:border-red-900/50">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 animate-pulse" />
                    <div>
                      Found <strong>{conflictsList.length} conflict(s)</strong> that need scheduling overrides. Assigning a different faculty member or rescheduling timeslots will resolve these conflicts.
                    </div>
                  </div>

                  <DataTable
                    data={conflictsList}
                    columns={[
                      {
                        header: 'Subject',
                        cell: (row) => (
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{(row as any).subject?.code}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{(row as any).subject?.name}</div>
                          </div>
                        ),
                      },
                      { header: 'Batch', cell: (row) => (row as any).batch?.name },
                      { header: 'Room Context', cell: (row) => (row as any).room?.name },
                      { header: 'Sessions/Wk', accessorKey: 'sessionsPerWeek' },
                      {
                        header: 'Conflict Description',
                        cell: (row) => (
                          <div className="text-xs font-medium text-red-650 dark:text-red-400 max-w-md whitespace-normal break-words leading-relaxed">
                            {row.conflictReason || 'Unknown allocation conflict.'}
                          </div>
                        ),
                      },
                      {
                        header: 'Actions',
                        cell: (row) => (
                          <Button variant="danger" size="sm" onClick={() => handleOpenOverride(row)}>
                            Resolve Override
                          </Button>
                        ),
                      },
                    ]}
                    emptyMessage="No conflicts log available."
                  />
                </div>
              )}
            </div>
          )}

          {/* RUNS HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {loadingRuns ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="text-gray-500 text-sm">Loading history...</span>
                </div>
              ) : (
                <DataTable
                  data={runs || []}
                  columns={[
                    {
                      header: 'Run Date / Time',
                      cell: (row) => (
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {new Date(row.runAt).toLocaleString()}
                        </span>
                      ),
                    },
                    {
                      header: 'Engine Status',
                      cell: (row) => {
                        const success = row.status === 'SUCCESS';
                        const partial = row.status === 'PARTIAL';
                        return (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              success
                                ? 'bg-green-100 text-green-800'
                                : partial
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {row.status}
                          </span>
                        );
                      },
                    },
                    {
                      header: 'Fulfilled Rate',
                      cell: (row) => {
                        const summary = parseSummaryJson(row.summaryJson);
                        if (!summary.totalRequirements) return 'N/A';
                        const pct = Math.round((summary.fulfilled / summary.totalRequirements) * 100);
                        return (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{summary.fulfilled} / {summary.totalRequirements}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">({pct}%)</span>
                          </div>
                        );
                      },
                    },
                    {
                      header: 'Conflicts Logged',
                      cell: (row) => {
                        const summary = parseSummaryJson(row.summaryJson);
                        const cnt = summary.conflicts || 0;
                        return (
                          <span className={`font-semibold ${cnt > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-650 dark:text-gray-350'}`}>
                            {cnt}
                          </span>
                        );
                      },
                    },
                    {
                      header: 'Triggered By User ID',
                      accessorKey: 'runByUserId',
                    },
                  ]}
                  emptyMessage="No auto-allocation runs found."
                />
              )}
            </div>
          )}

          {/* AUDIT LOGS TAB */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              {loadingAuditLogs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="text-gray-500 text-sm">Loading audit logs...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <DataTable
                    data={auditLogs}
                    columns={[
                      {
                        header: 'Timestamp',
                        cell: (row) => (
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {new Date(row.createdAt).toLocaleString()}
                          </span>
                        ),
                      },
                      {
                        header: 'Action',
                        cell: (row) => (
                          <span className="font-semibold text-gray-900 dark:text-white uppercase text-xs">
                            {row.action.replace(/_/g, ' ')}
                          </span>
                        ),
                      },
                      {
                        header: 'Admin Actor',
                        cell: (row) => (
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{(row as any).user?.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{(row as any).user?.email}</div>
                          </div>
                        ),
                      },
                      {
                        header: 'Affected Record',
                        cell: (row) => (
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                            {row.entityType} ({row.entityId.slice(-6)})
                          </span>
                        ),
                      },
                      {
                        header: 'Override Notes / Reason',
                        cell: (row) => (
                          <div className="text-xs text-gray-700 dark:text-gray-300 max-w-sm whitespace-normal break-words leading-relaxed font-medium">
                            {row.reason || 'No justification log provided.'}
                          </div>
                        ),
                      },
                    ]}
                    emptyMessage="No manual override audit logs found."
                  />

                  {/* Audit Logs Pagination */}
                  {auditMetadata.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
                      <span className="text-xs text-gray-500">
                        Page {auditPage} of {auditMetadata.totalPages}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                          disabled={auditPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAuditPage((p) => Math.min(auditMetadata.totalPages, p + 1))}
                          disabled={auditPage === auditMetadata.totalPages}
                        >
                          Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Manual Override Assignment Modal */}
      <ManualAssignModal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setActiveRequirement(null);
          refetchStats(); // Refresh stats when modal closes
        }}
        classRequirement={activeRequirement}
      />
    </div>
  );
}
