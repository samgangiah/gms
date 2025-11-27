import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, ClipboardList, Factory } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  // Fetch dashboard statistics
  const [customersCount, yarnTypesCount, activeJobCards, productionToday] =
    await Promise.all([
      prisma.customer.count({ where: { active: true } }),
      prisma.yarnType.count({ where: { active: true } }),
      prisma.customerOrder.count({ where: { status: 'active' } }),
      prisma.productionInfo.count({
        where: {
          productionDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

  const stats = [
    {
      title: 'Active Customers',
      value: customersCount,
      icon: Users,
      description: 'Total active customers',
    },
    {
      title: 'Yarn Types',
      value: yarnTypesCount,
      icon: Package,
      description: 'Available yarn types',
    },
    {
      title: 'Active Job Cards',
      value: activeJobCards,
      icon: ClipboardList,
      description: 'Currently in production',
    },
    {
      title: 'Production Today',
      value: productionToday,
      icon: Factory,
      description: 'Pieces produced today',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your textile production system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <a
              href="/dashboard/job-cards/new"
              className="flex items-center space-x-4 rounded-lg border p-4 hover:bg-accent transition-colors"
            >
              <ClipboardList className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium">Create Job Card</p>
                <p className="text-xs text-muted-foreground">
                  Start a new production order
                </p>
              </div>
            </a>
            <a
              href="/dashboard/production"
              className="flex items-center space-x-4 rounded-lg border p-4 hover:bg-accent transition-colors"
            >
              <Factory className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium">Production Entry</p>
                <p className="text-xs text-muted-foreground">
                  Record production pieces
                </p>
              </div>
            </a>
            <a
              href="/dashboard/yarn-stock"
              className="flex items-center space-x-4 rounded-lg border p-4 hover:bg-accent transition-colors"
            >
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium">Yarn Stock</p>
                <p className="text-xs text-muted-foreground">
                  Manage yarn inventory
                </p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
