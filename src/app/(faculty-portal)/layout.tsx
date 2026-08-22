import { FacultyProtectedLayout } from '@/components/layout/FacultyProtectedLayout';

export default function FacultyPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FacultyProtectedLayout>{children}</FacultyProtectedLayout>;
}
