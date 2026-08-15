-- Enable Row Level Security (RLS) on all tables to prevent public access via Supabase REST APIs.
-- Because Prisma connects via a superuser or service role, it bypasses RLS entirely,
-- ensuring our Next.js backend continues to function perfectly while locking down the public API.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "School" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Department" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Faculty" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FacultyPreferredSubject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FacultyPreferredBatch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FacultyUnavailability" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Semester" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Batch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Room" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimeSlot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeniorityDegreeEligibility" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClassRequirement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AllocationRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;