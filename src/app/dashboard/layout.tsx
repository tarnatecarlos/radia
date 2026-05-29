import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <aside className="w-60 flex-shrink-0">
        <Sidebar />
      </aside>

      <main className="flex-1 overflow-y-auto px-6 py-5 lg:px-8">
        {children}
      </main>
    </div>
  );
}
