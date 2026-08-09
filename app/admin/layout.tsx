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
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
      {children}
    </div>
  );
}
