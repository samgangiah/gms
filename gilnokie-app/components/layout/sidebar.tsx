'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Package,
  Shirt,
  ClipboardList,
  Factory,
  Warehouse,
  PackageCheck,
  Truck,
  FileText,
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Customers',
    href: '/dashboard/customers',
    icon: Users,
  },
  {
    name: 'Yarn Types',
    href: '/dashboard/yarn-types',
    icon: Package,
  },
  {
    name: 'Fabric Quality',
    href: '/dashboard/fabric-quality',
    icon: Shirt,
  },
  {
    name: 'Job Cards',
    href: '/dashboard/job-cards',
    icon: ClipboardList,
  },
  {
    name: 'Production',
    href: '/dashboard/production',
    icon: Factory,
  },
  {
    name: 'Yarn Stock',
    href: '/dashboard/yarn-stock',
    icon: Warehouse,
  },
  {
    name: 'Packing & Delivery',
    href: '/dashboard/packing-delivery',
    icon: PackageCheck,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16 border-r bg-muted/10">
      <div className="flex-1 flex flex-col min-h-0">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
