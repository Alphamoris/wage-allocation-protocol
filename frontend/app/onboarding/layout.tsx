import Link from "next/link";
import Image from "next/image";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FDF8F3] flex flex-col">
      <header className="h-20 flex items-center justify-center border-b border-[#E8DED4] bg-white/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-36 h-12">
            <Image src="/logo.svg" alt="WAP - Wage Allocation Protocol" fill className="object-contain" priority />
          </div>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
