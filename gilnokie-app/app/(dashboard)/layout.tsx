import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userEmail={user.email} />
      <Sidebar />
      <main className="md:pl-64 pt-16">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
