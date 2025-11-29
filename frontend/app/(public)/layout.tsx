import { Header } from "@/components/shared/Header";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FDF8F3] text-[#1A1A2E] overflow-x-hidden">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="py-12 bg-white border-t border-[#E8DED4]">
        <div className="container mx-auto px-4 text-center text-[#718096]">
          <p>&copy; 2025 WAP. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
