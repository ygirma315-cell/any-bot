import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AnyAi Store — Admin Control Center',
  description: 'Manage products, categories, pricing, and approve customer orders.',
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-[#F6F8FB] text-slate-900 antialiased selection:bg-[#FF6B00] selection:text-white overflow-y-auto font-sans">
      {children}
    </div>
  );
}
