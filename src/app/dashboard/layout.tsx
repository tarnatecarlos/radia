import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser, SESSION_COOKIE } from "@/lib/auth";
import { MobileNav, Sidebar } from "@/components/layout/sidebar";
import { UserProvider } from "@/lib/user-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  const session = getSessionUser(sessionId);

  if (!session) {
    redirect("/login");
  }

  return (
    <UserProvider>
      <div className="flex min-h-[100dvh] bg-slate-50 dark:bg-slate-950">
        <aside className="hidden w-60 flex-shrink-0 md:block">
          <Sidebar />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav />
          <main id="main-content" className="min-w-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </UserProvider>
  );
}
