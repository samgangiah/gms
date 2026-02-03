'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Save, Package } from 'lucide-react';
import Link from 'next/link';
import { formatWeight } from '@/lib/utils';

type YarnType = {
  id: string;
  code: string;
  description: string | null;
  color: string | null;
  material: string | null;
};

type StockReference = {
  id: string;
  stockReferenceNumber: string;
  currentQuantity: number | string;
  yarnType: YarnType;
  status: string;
};

type JobCard = {
  id: string;
  jobCardNumber: string;
  stockReference: string;
  quantityRequired: number | string;
  estimatedYarnRequired: number | string | null;
  customer: {
    name: string;
  };
  fabricQuality: {
    qualityCode: string;
    description: string | null;
    fabricContent: Array<{
      id: string;
      percentage: number | string;
      yarnType: YarnType;
    }>;
  };
  yarnStock: Array<{
    id: string;
    quantityReceived: number | string;
    quantityUsed: number | string;
    quantityLoss: number | string;
    stockRef: {
      yarnType: YarnType;
    };
  }>;
};

export default function AllocateYarnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedJobCardId = searchParams.get('jobCardId');
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    jobCardId: preselectedJobCardId || '',
    stockRefId: '',
    quantityReceived: '',
    receivedDate: new Date().toISOString().split('T')[0],
    lotNumber: '',
    notes: '',
  });

  // Fetch active job cards for selection
  const { data: jobCards, isLoading: loadingJobCards } = useQuery({
    queryKey: ['job-cards', 'active'],
    queryFn: async () => {
      const res = await fetch('/api/job-cards?status=active');
      if (!res.ok) throw new Error('Failed to fetch job cards');
      const json = await res.json();
      return json.data as JobCard[];
    },
  });

  // Fetch job card details when selected
  const { data: selectedJobCard } = useQuery({
    queryKey: ['job-card', formData.jobCardId],
    queryFn: async () => {
      if (!formData.jobCardId) return null;
      const res = await fetch(`/api/job-cards/${formData.jobCardId}`);
      if (!res.ok) throw new Error('Failed to fetch job card');
      const json = await res.json();
      return json.data as JobCard;
    },
    enabled: !!formData.jobCardId,
  });

  // Fetch available stock references
  const { data: stockRefs, isLoading: loadingStockRefs } = useQuery({
    queryKey: ['stock-references', 'active'],
    queryFn: async () => {
      const res = await fetch('/api/stock-references?status=active');
      if (!res.ok) throw new Error('Failed to fetch stock references');
      const json = await res.json();
      return json.data as StockReference[];
    },
  });

  // Update jobCardId when preselected from URL
  useEffect(() => {
    if (preselectedJobCardId && !formData.jobCardId) {
      setFormData(prev => ({ ...prev, jobCardId: preselectedJobCardId }));
    }
  }, [preselectedJobCardId, formData.jobCardId]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/yarn-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          quantityReceived: parseFloat(data.quantityReceived),
          quantityUsed: 0,
          quantityLoss: 0,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to allocate yarn stock');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-stock'] });
      queryClient.invalidateQueries({ queryKey: ['job-card', formData.jobCardId] });
      toast.success('Yarn stock allocated successfully');

      // Navigate back to job card if we came from there
      if (preselectedJobCardId) {
        router.push(`/dashboard/job-cards/${preselectedJobCardId}`);
      } else {
        router.push('/dashboard/yarn-stock');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.jobCardId) {
      toast.error('Please select a job card');
      return;
    }
    if (!formData.stockRefId) {
      toast.error('Please select a stock reference');
      return;
    }
    if (!formData.quantityReceived || parseFloat(formData.quantityReceived) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    createMutation.mutate(formData);
  };

  const selectedStockRef = stockRefs?.find(ref => ref.id === formData.stockRefId);

  // Calculate already allocated yarn for the selected job card
  const getAllocatedYarn = () => {
    if (!selectedJobCard?.yarnStock) return [];
    return selectedJobCard.yarnStock.map(stock => ({
      yarnType: stock.stockRef.yarnType.code,
      received: typeof stock.quantityReceived === 'string'
        ? parseFloat(stock.quantityReceived)
        : stock.quantityReceived,
      used: typeof stock.quantityUsed === 'string'
        ? parseFloat(stock.quantityUsed)
        : stock.quantityUsed,
      loss: typeof stock.quantityLoss === 'string'
        ? parseFloat(stock.quantityLoss)
        : stock.quantityLoss,
    }));
  };

  const allocatedYarn = getAllocatedYarn();
  const totalAllocated = allocatedYarn.reduce((sum, y) => sum + y.received, 0);

  const getEstimatedYarnRequired = () => {
    if (!selectedJobCard?.estimatedYarnRequired) return null;
    const val = selectedJobCard.estimatedYarnRequired;
    return typeof val === 'string' ? parseFloat(val) : val;
  };

  const estimatedRequired = getEstimatedYarnRequired();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={preselectedJobCardId ? `/dashboard/job-cards/${preselectedJobCardId}` : '/dashboard/yarn-stock'}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Allocate Yarn Stock</h1>
          <p className="text-muted-foreground">
            Allocate yarn from stock to a job card
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Allocation Details</CardTitle>
                <CardDescription>
                  Select the job card and yarn stock to allocate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="jobCardId">
                    Job Card <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.jobCardId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, jobCardId: value })
                    }
                    disabled={!!preselectedJobCardId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job card" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingJobCards ? (
                        <SelectItem value="" disabled>Loading...</SelectItem>
                      ) : (
                        jobCards?.map((jobCard) => (
                          <SelectItem key={jobCard.id} value={jobCard.id}>
                            {jobCard.jobCardNumber} - {jobCard.customer.name} ({jobCard.fabricQuality.qualityCode})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="stockRefId">
                    Stock Reference <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.stockRefId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, stockRefId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stock reference" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingStockRefs ? (
                        <SelectItem value="" disabled>Loading...</SelectItem>
                      ) : (
                        stockRefs?.map((ref) => {
                          const qty = typeof ref.currentQuantity === 'string'
                            ? parseFloat(ref.currentQuantity)
                            : ref.currentQuantity;
                          return (
                            <SelectItem key={ref.id} value={ref.id}>
                              {ref.stockReferenceNumber} - {ref.yarnType.code}
                              {ref.yarnType.color && ` (${ref.yarnType.color})`}
                              {' '}- Available: {formatWeight(qty)}
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                  {selectedStockRef && (
                    <div className="rounded-lg border p-3 bg-muted/50 space-y-1">
                      <p className="text-sm font-medium">{selectedStockRef.yarnType.code}</p>
                      {selectedStockRef.yarnType.description && (
                        <p className="text-xs text-muted-foreground">{selectedStockRef.yarnType.description}</p>
                      )}
                      <div className="flex gap-4 text-xs">
                        {selectedStockRef.yarnType.material && (
                          <span>Material: {selectedStockRef.yarnType.material}</span>
                        )}
                        {selectedStockRef.yarnType.color && (
                          <span>Color: {selectedStockRef.yarnType.color}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-primary mt-2">
                        Available: {formatWeight(
                          typeof selectedStockRef.currentQuantity === 'string'
                            ? parseFloat(selectedStockRef.currentQuantity)
                            : selectedStockRef.currentQuantity
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quantityReceived">
                      Quantity to Allocate (kg) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="quantityReceived"
                      type="number"
                      step="0.01"
                      value={formData.quantityReceived}
                      onChange={(e) =>
                        setFormData({ ...formData, quantityReceived: e.target.value })
                      }
                      required
                      placeholder="0.00"
                      className="text-lg"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="receivedDate">Allocation Date</Label>
                    <Input
                      id="receivedDate"
                      type="date"
                      value={formData.receivedDate}
                      onChange={(e) =>
                        setFormData({ ...formData, receivedDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="lotNumber">Lot Number</Label>
                  <Input
                    id="lotNumber"
                    value={formData.lotNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, lotNumber: e.target.value })
                    }
                    placeholder="e.g., LOT-2025-001"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    placeholder="Any additional notes about this allocation..."
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Link href={preselectedJobCardId ? `/dashboard/job-cards/${preselectedJobCardId}` : '/dashboard/yarn-stock'}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {createMutation.isPending ? 'Allocating...' : 'Allocate Yarn'}
              </Button>
            </div>
          </div>

          {/* Job Card Summary Sidebar */}
          <div className="space-y-6">
            {selectedJobCard && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Job Card Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Job Card Number</p>
                      <p className="font-medium">{selectedJobCard.jobCardNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Customer</p>
                      <p className="font-medium">{selectedJobCard.customer.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fabric Quality</p>
                      <p className="font-medium">{selectedJobCard.fabricQuality.qualityCode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Stock Reference</p>
                      <p className="font-medium">{selectedJobCard.stockReference}</p>
                    </div>
                    {estimatedRequired && (
                      <div>
                        <p className="text-xs text-muted-foreground">Estimated Yarn Required</p>
                        <p className="font-medium">{formatWeight(estimatedRequired)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Fabric Composition */}
                {selectedJobCard.fabricQuality.fabricContent?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Fabric Composition</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedJobCard.fabricQuality.fabricContent.map((content) => (
                        <div key={content.id} className="flex justify-between items-center">
                          <span className="text-sm">{content.yarnType.code}</span>
                          <Badge variant="outline">
                            {typeof content.percentage === 'string'
                              ? content.percentage
                              : content.percentage}%
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Already Allocated */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Already Allocated</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {allocatedYarn.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No yarn allocated yet</p>
                    ) : (
                      <div className="space-y-2">
                        {allocatedYarn.map((yarn, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-sm">{yarn.yarnType}</span>
                            <Badge variant="secondary">{formatWeight(yarn.received)}</Badge>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2 flex justify-between items-center font-medium">
                          <span className="text-sm">Total Allocated</span>
                          <span>{formatWeight(totalAllocated)}</span>
                        </div>
                        {estimatedRequired && (
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>Remaining to Allocate</span>
                            <span>{formatWeight(Math.max(0, estimatedRequired - totalAllocated))}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {!selectedJobCard && formData.jobCardId && (
              <Card>
                <CardContent className="py-8 text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading job card details...</p>
                </CardContent>
              </Card>
            )}

            {!formData.jobCardId && (
              <Card>
                <CardContent className="py-8 text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Select a job card to see details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
