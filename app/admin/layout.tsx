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
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 antialiased selection:bg-orange-500 selection:text-white overflow-y-auto">
      {children}
    </div>
  );
}
