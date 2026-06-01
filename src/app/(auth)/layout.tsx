import { Suspense } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Radia</span>
        <span className="mt-0.5 h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
      </Link>
      <Suspense>{children}</Suspense>
    </div>
  );
}
