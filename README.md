Created readme_git.md

I have created a comprehensive, professional **Git README.md** for you! 

I saved it as a separate file in your artifact folder here: [`readme_git.md`](file:///C:/Users/govin/.gemini/antigravity/brain/15a2ac50-5097-42e5-9e6a-4deba777353b/readme_git.md), ensuring that no modifications were made to your project's local workspace files.

You can copy the raw markdown contents directly from the panel or from the block below to add it to your repository:

```markdown
# Faculty Class Allocation & Timetabling System

A modern, role-based scheduling and timetabling application built using **Next.js 16 (App Router)**, **Prisma ORM**, **Supabase (PostgreSQL)**, and **React Query**. The system features a deterministic greedy Constraint Satisfaction Problem (CSP) solver that automatically schedules faculty members to class requirements based on workloads, available hours, and ranked subject/batch preferences.

---

## 🚀 Key Features

* **Multi-Tiered Authentication (RBAC):** NextAuth-gated roles for `SUPER_ADMIN`, `SCHOOL_ADMIN`, and `DEPT_ADMIN`.
* **Automated Scheduling Solver:** Greedy-heuristics engine mapping Faculty to Room, Batch, and Timeslots matching workload caps and consecutive class limits.
* **Batch & Subject Preferences:** Allows teachers to submit ranked preferences for both subjects (e.g. Data Structures) and specific sections/batches (e.g. CSE-3A) to guide auto-allocations.
* **Interactive Timetable Grid:** A calendar-style schedule rendering periods (rows) vs days of the week (columns) with filtering for Faculty, Batch, or Room views.
* **Manual Override & Auditing:** Admins can manually override scheduled slots. Evaluates and warns for conflicts while logging overrides to a secure Audit Log.
* **Degree Level Eligibility:** A customizable matrix to govern which faculty seniority levels (HOD, Professor, etc.) are allowed to teach UG or PG courses.

---

## 🛠️ Tech Stack

* **Core Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
* **Library:** [React 19](https://react.dev/)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **ORM:** [Prisma ORM](https://www.prisma.io/)
* **Database:** [PostgreSQL (Supabase-hosted)](https://supabase.com/)
* **Auth:** [NextAuth.js v4 (Credentials Provider)](https://next-auth.js.org/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

---

## 📂 Project Structure

```bash
src/
├── app/                  # Next.js App Router (pages and API endpoints)
│   ├── (dashboard)/      # Protected dashboard views (Schools, Allocation, etc.)
│   ├── api/              # Rest APIs (gated with requireAuth & scopeFilter)
│   └── login/            # Authentication interface
├── components/           # Reusable UI & Layout Components
│   ├── ui/               # Core Design System (Button, Table, Modal, Select)
│   ├── layout/           # Sidebar, Header, Protected Layout Shell
│   └── features/         # Decoupled UI/UX feature modules (allocation, faculty)
├── hooks/                # React Query hooks (Barrel exported from index.ts)
├── lib/                  # Backend utilities
│   ├── db.ts             # Prisma Client instance
│   ├── auth/             # requireAuth, scope filters, and api-error handles
│   └── allocation/       # Greedy CSP constraints solver algorithm
├── types/                # TypeScript shared contracts (Timetable, Allocation)
└── validators/           # Zod validation schemas
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd faculty-class-assigner/faculty-class-assigner
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the project root and add your configuration details:
```env
# Database Connections (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"

# NextAuth Config
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-generate-32-char-random-secret"

# Default Super Admin Seed Configuration
SEED_ADMIN_EMAIL="admin@university.edu"
SEED_ADMIN_PASSWORD="change-this-password"
```

### 4. Run Migrations & Generate Prisma Client
Push the schema to your Supabase PostgreSQL instance:
```bash
npx prisma migrate dev
```

### 5. Seed the Database
Populate the database with default metadata, timeslots, and a complete set of testing dummy data (schools, departments, faculty preferences, and class requirements):
```bash
npx prisma db seed
```

### 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 🧠 The Scheduling Solver Logic

The scheduling solver implements a greedy deterministic heuristic constraint-satisfaction algorithm:
1. **Difficulty Sorting:** Sorts `ClassRequirements` with PG courses first (restricted faculty eligibility) and LAB classes first (requires longer slots).
2. **Workload Filtering:** Excludes faculty candidates who exceed daily/weekly hour limits or violate consecutive teaching hour thresholds.
3. **Double-Booking Prevention:** Excludes timeslots where the teacher, room, or student batch is already scheduled.
4. **Scoring Function:** Calculates candidate scores combining both Subject Preferences and Batch Preferences:
   $$\text{Score} = (10 - \text{subjectPrefRank}) \times 10 + (10 - \text{batchPrefRank}) \times 5$$
   *Subject preferences remain the primary driver, while batch preferences break ties.*
5. **Conflict Resolution:** Unresolved classes are flagged in the UI as `CONFLICT` along with detailed overlap explanations.
```
