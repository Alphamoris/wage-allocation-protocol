"use client";

import { Sidebar } from "@/components/shared/Sidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const role = pathname.includes("employer") ? "employer" : "employee";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FDF8F3] text-[#1A1A2E] flex">
        <Sidebar role={role} />
        <main className="flex-1 ml-0 lg:ml-[72px] xl:ml-[260px] p-4 md:p-6 lg:p-8 pt-16 lg:pt-8 transition-all duration-300">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
