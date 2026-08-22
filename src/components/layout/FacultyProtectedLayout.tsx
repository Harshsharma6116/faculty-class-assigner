import { requireAuth } from '@/lib/auth/helpers';
import { FacultySidebar } from './FacultySidebar';
import { Header } from './Header';

interface FacultyProtectedLayoutProps {
  children: React.ReactNode;
}

export async function FacultyProtectedLayout({ children }: FacultyProtectedLayoutProps) {
  await requireAuth(['FACULTY']);

  return (
    <div className="flex h-screen bg-background/40 overflow-hidden relative">
      {/* Sidebar */}
      <FacultySidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 bg-background/40">
        <Header />

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
