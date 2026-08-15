const fs = require('fs');

// Fix Batch API
let batchApi = fs.readFileSync('src/app/api/batches/[id]/route.ts', 'utf-8');
batchApi = batchApi.replace(/data\.departmentId/g, '(data as any).departmentId');
fs.writeFileSync('src/app/api/batches/[id]/route.ts', batchApi, 'utf-8');

// Fix Room API
let roomApi = fs.readFileSync('src/app/api/rooms/[id]/route.ts', 'utf-8');
roomApi = roomApi.replace(/data\.schoolId/g, '(data as any).schoolId');
fs.writeFileSync('src/app/api/rooms/[id]/route.ts', roomApi, 'utf-8');

// Fix TimeSlot API
let tsApi = fs.readFileSync('src/app/api/timeslots/[id]/route.ts', 'utf-8');
tsApi = tsApi.replace(/data\.schoolId/g, '(data as any).schoolId');
fs.writeFileSync('src/app/api/timeslots/[id]/route.ts', tsApi, 'utf-8');

// Fix Allocation Dashboard types
let dash = fs.readFileSync('src/components/features/allocation/AllocationDashboard.tsx', 'utf-8');
// Fix missing property on ClassRequirement maps
dash = dash.replace(/req\.subject/g, '(req as any).subject');
dash = dash.replace(/req\.batch/g, '(req as any).batch');
dash = dash.replace(/req\.room/g, '(req as any).room');
dash = dash.replace(/req\.assignedFaculty/g, '(req as any).assignedFaculty');
dash = dash.replace(/log\.user/g, '(log as any).user');
// Fix search payload bug
dash = dash.replace(/search: ''/g, ''); // the TS error said 'search' does not exist in type
fs.writeFileSync('src/components/features/allocation/AllocationDashboard.tsx', dash, 'utf-8');

// Fix Batch Form Selects
let batchForm = fs.readFileSync('src/components/features/batches/BatchFormModal.tsx', 'utf-8');
batchForm = batchForm.replace(
  /<Select\s+label="School"[\s\S]*?error=\{errors\.schoolId\?.message as string\}\s*>\s*<option value="">Select School<\/option>[\s\S]*?\{schools\.map\(\(school: any\) => \([\s\S]*?<option key=\{school\.id\} value=\{school\.id\}>\s*\{school\.name\}\s*<\/option>\s*\)\)\}\s*<\/Select>/,
  `{/* Fixed School Select */}
          <Select
            label="School"
            {...register('schoolId')}
            error={errors.schoolId?.message as string}
            options={[
              { label: 'Select School', value: '' },
              ...schools.map((school: any) => ({ label: school.name, value: school.id }))
            ]}
          />`
);

batchForm = batchForm.replace(
  /<Select\s+label="Department"[\s\S]*?error=\{errors\.departmentId\?.message as string\}\s*>\s*<option value="">Select Department<\/option>[\s\S]*?\{departments\.data\.map\(\(dept: any\) => \([\s\S]*?<option key=\{dept\.id\} value=\{dept\.id\}>\s*\{dept\.name\}\s*<\/option>\s*\)\)\}\s*<\/Select>/,
  `{/* Fixed Dept Select */}
          <Select
            label="Department"
            {...register('departmentId')}
            error={errors.departmentId?.message as string}
            options={[
              { label: 'Select Department', value: '' },
              ...departments.data.map((dept: any) => ({ label: dept.name, value: dept.id }))
            ]}
          />`
);

batchForm = batchForm.replace(
  /<Select\s+label="Degree Level"[\s\S]*?error=\{errors\.degreeLevel\?.message as string\}\s*>\s*<option value="UG">Undergraduate \(UG\)<\/option>\s*<option value="PG">Postgraduate \(PG\)<\/option>\s*<\/Select>/,
  `{/* Fixed Degree Select */}
          <Select
            label="Degree Level"
            {...register('degreeLevel')}
            error={errors.degreeLevel?.message as string}
            options={[
              { label: 'Undergraduate (UG)', value: 'UG' },
              { label: 'Postgraduate (PG)', value: 'PG' }
            ]}
          />`
);

fs.writeFileSync('src/components/features/batches/BatchFormModal.tsx', batchForm, 'utf-8');

// Fix missing import in TimeSlotFormModal
let tsForm = fs.readFileSync('src/components/features/timeslots/TimeSlotFormModal.tsx', 'utf-8');
if (!tsForm.includes('CreateTimeSlotInput')) {
  tsForm = tsForm.replace(
    /import \{ createTimeSlotSchema, updateTimeSlotSchema \} from '@\/lib\/validators\/timeslot';/,
    "import { createTimeSlotSchema, updateTimeSlotSchema, CreateTimeSlotInput } from '@/lib/validators/timeslot';"
  );
  fs.writeFileSync('src/components/features/timeslots/TimeSlotFormModal.tsx', tsForm, 'utf-8');
}

console.log('Done patching stage 2!');
