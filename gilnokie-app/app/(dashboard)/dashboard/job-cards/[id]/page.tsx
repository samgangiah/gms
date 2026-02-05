import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, formatWeight, formatWeightWithMeters, formatCurrency } from '@/lib/utils';
import { ArrowLeft, Edit, FileText, Printer } from 'lucide-react';
import Link from 'next/link';
import { JobCardStatusChange } from '@/components/job-card-status-change';

export default async function JobCardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const jobCard = await prisma.customerOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      fabricQuality: {
        include: {
          fabricContent: {
            include: {
              yarnType: true,
            },
            orderBy: { position: 'asc' },
          },
        },
      },
      production: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      yarnStock: {
        include: {
          stockRef: {
            include: {
              yarnType: true,
            },
          },
        },
      },
      _count: {
        select: {
          production: true,
          yarnStock: true,
        },
      },
    },
  });

  if (!jobCard) {
    notFound();
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'in_production':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'on_hold':
        return 'outline';
      case 'draft':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Calculate production progress
  const totalProduced = jobCard.production.reduce(
    (sum, prod) => sum + prod.weight.toNumber(),
    0
  );
  const progressPercentage =
    (totalProduced / jobCard.quantityRequired.toNumber()) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/job-cards">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {jobCard.jobCardNumber}
              </h1>
              <JobCardStatusChange
                jobCardId={jobCard.id}
                currentStatus={jobCard.status as any}
                jobCardNumber={jobCard.jobCardNumber}
              />
            </div>
            <p className="text-muted-foreground">
              {jobCard.customer.name} | {jobCard.fabricQuality.qualityCode}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <a href={`/api/pdf/job-card/${id}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Generate PDF
            </Button>
          </a>
          <Link href={`/dashboard/job-cards/${id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Production Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">
                {formatWeightWithMeters(totalProduced, jobCard.fabricQuality.metersPerKg)} / {formatWeightWithMeters(jobCard.quantityRequired, jobCard.fabricQuality.metersPerKg)}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div>
                <p className="text-xs text-muted-foreground">Pieces Produced</p>
                <p className="text-2xl font-bold">{jobCard._count.production}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completion</p>
                <p className="text-2xl font-bold">{progressPercentage.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="text-2xl font-bold">
                  {formatWeightWithMeters(
                    Math.max(0, jobCard.quantityRequired.toNumber() - totalProduced),
                    jobCard.fabricQuality.metersPerKg
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="production">
            Production ({jobCard._count.production})
          </TabsTrigger>
          <TabsTrigger value="yarn">
            Yarn Stock ({jobCard._count.yarnStock})
          </TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{jobCard.customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stock Reference</p>
                  <p className="font-medium">{jobCard.stockReference}</p>
                </div>
                {jobCard.orderNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Order Number</p>
                    <p className="font-medium">{jobCard.orderNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">{formatDate(jobCard.orderDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(jobCard.createdAt)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Production Details */}
            <Card>
              <CardHeader>
                <CardTitle>Production Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Fabric Quality</p>
                  <p className="font-medium">{jobCard.fabricQuality.qualityCode}</p>
                  {jobCard.fabricQuality.description && (
                    <p className="text-xs text-muted-foreground">
                      {jobCard.fabricQuality.description}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity Required</p>
                  <p className="font-medium">{formatWeightWithMeters(jobCard.quantityRequired, jobCard.fabricQuality.metersPerKg)}</p>
                </div>
                {jobCard.machineAssigned && (
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned Machine</p>
                    <p className="font-medium">{jobCard.machineAssigned}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusColor(jobCard.status)}>
                    {jobCard.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fabric Content */}
          {jobCard.fabricQuality.fabricContent.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Fabric Composition</CardTitle>
                <CardDescription>Yarn content breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {jobCard.fabricQuality.fabricContent.map((content, idx) => (
                    <div key={content.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{idx + 1}.</span>
                        <span className="text-sm">
                          {content.yarnType.code}
                          {content.yarnType.description &&
                            ` - ${content.yarnType.description}`}
                        </span>
                      </div>
                      <Badge variant="outline">{content.percentage.toNumber()}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Production Tab */}
        <TabsContent value="production" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Production Records</CardTitle>
                  <CardDescription>
                    Individual pieces produced for this job card
                  </CardDescription>
                </div>
                <Link href={`/dashboard/production/new?jobCardId=${id}`}>
                  <Button>Add Production Entry</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {jobCard.production.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No production records yet. Start recording production pieces.
                </div>
              ) : (
                <div className="space-y-2">
                  {jobCard.production.map((prod) => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{prod.pieceNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(prod.productionDate)}
                          {prod.operatorName && ` • ${prod.operatorName}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatWeight(prod.weight)}</p>
                        {prod.qualityGrade && (
                          <Badge variant="outline" className="text-xs">
                            {prod.qualityGrade}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Yarn Stock Tab */}
        <TabsContent value="yarn" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Yarn Stock Allocation</CardTitle>
                  <CardDescription>
                    Yarn allocated to this job card
                  </CardDescription>
                </div>
<Link href={`/dashboard/yarn-stock/allocate?jobCardId=${id}`}>
                  <Button>Allocate Yarn</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {jobCard.yarnStock.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No yarn allocated yet. Allocate yarn stock to begin production.
                </div>
              ) : (
                <div className="space-y-2">
                  {jobCard.yarnStock.map((stock) => (
                    <div
                      key={stock.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">
                          {stock.stockRef.yarnType.code}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stock.stockRef.yarnType.description || 'No description'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          Received: {formatWeight(stock.quantityReceived)}
                        </p>
                        <p className="text-sm">
                          Used: {formatWeight(stock.quantityUsed)}
                        </p>
                        {stock.quantityLoss.toNumber() > 0 && (
                          <p className="text-xs text-destructive">
                            Loss: {formatWeight(stock.quantityLoss)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notes & Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {jobCard.notes && (
                <div>
                  <p className="text-sm font-medium mb-2">General Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {jobCard.notes}
                  </p>
                </div>
              )}
              {!jobCard.notes && (
                <p className="text-sm text-muted-foreground">No notes available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
