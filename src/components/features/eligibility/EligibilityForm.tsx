'use client';

import { useState, useEffect } from 'react';
import { useEligibilityRules, useUpdateEligibilityRules } from '@/hooks/useEligibility';
import { Button } from '@/components/ui';

type Seniority = 'ASSISTANT_PROFESSOR' | 'ASSOCIATE_PROFESSOR' | 'PROFESSOR' | 'HOD';
type Degree = 'UG' | 'PG';

export function EligibilityForm() {
  const { data: rules, isLoading } = useEligibilityRules();
  const updateMutation = useUpdateEligibilityRules();

  // Local state to track checkbox changes
  const [matrix, setMatrix] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (rules) {
      const initialMatrix: Record<string, boolean> = {};
      rules.forEach(rule => {
        initialMatrix[`${rule.seniorityLevel}-${rule.degreeLevel}`] = rule.allowed;
      });
      setMatrix(initialMatrix);
    }
  }, [rules]);

  const handleToggle = (seniority: Seniority, degree: Degree) => {
    const key = `${seniority}-${degree}`;
    setMatrix(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    const payload = {
      rules: Object.entries(matrix).map(([key, allowed]) => {
        const [seniorityLevel, degreeLevel] = key.split('-') as [Seniority, Degree];
        return { seniorityLevel, degreeLevel, allowed };
      })
    };

    try {
      await updateMutation.mutateAsync(payload);
      alert('Eligibility rules updated successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to update rules');
    }
  };

  if (isLoading) return <div>Loading eligibility rules...</div>;

  const seniorities: { key: Seniority; label: string }[] = [
    { key: 'HOD', label: 'Head of Department (HOD)' },
    { key: 'PROFESSOR', label: 'Professor' },
    { key: 'ASSOCIATE_PROFESSOR', label: 'Associate Professor' },
    { key: 'ASSISTANT_PROFESSOR', label: 'Assistant Professor' }
  ];

  const degrees: Degree[] = ['UG', 'PG'];

  return (
    <div className="space-y-6 bg-card p-6 rounded-xl border border-border">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Degree Level Eligibility</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure which faculty seniority levels are allowed to teach Undergraduate (UG) and Postgraduate (PG) courses.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse border border-border">
          <thead>
            <tr className="bg-muted">
              <th className="p-4 border border-border font-medium text-foreground">Faculty Seniority</th>
              {degrees.map(degree => (
                <th key={degree} className="p-4 border border-border text-center font-medium text-foreground">
                  {degree} Courses
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {seniorities.map(seniority => (
              <tr key={seniority.key} className="hover:bg-muted/50">
                <td className="p-4 border border-border font-medium text-foreground">
                  {seniority.label}
                </td>
                {degrees.map(degree => {
                  const key = `${seniority.key}-${degree}`;
                  return (
                    <td key={degree} className="p-4 border border-border text-center">
                      <input
                        type="checkbox"
                        checked={matrix[key] || false}
                        onChange={() => handleToggle(seniority.key, degree)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={updateMutation.isPending}>
          Save Rules
        </Button>
      </div>
    </div>
  );
}
