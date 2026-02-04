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
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { formatWeight } from '@/lib/utils';

type JobCard = {
  id: string;
  jobCardNumber: string;
  stockReference: string;
  quantityRequired: number | string;
  customer: {
    name: string;
  };
  fabricQuality: {
    qualityCode: string;
    description: string | null;
  };
  status: string;
  _count?: {
    production: number;
  };
};

const MACHINES = Array.from({ length: 11 }, (_, i) => `Machine ${i + 1}`);
const QUALITY_GRADES = ['Pass', 'Minor', 'Defect', 'Rework'];

export default function NewProductionEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedJobCardId = searchParams.get('jobCardId');
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    jobCardId: preselectedJobCardId || '',
    weight: '',
    productionDate: new Date().toISOString().split('T')[0],
    productionTime: new Date().toTimeString().slice(0, 5),
    machineNumber: '',
    operatorName: '',
    qualityGrade: 'Pass',
    defectType: '',
    notes: '',
  });

  // Fetch active job cards for selection
  const { data: activeJobCards, isLoading: loadingJobCards } = useQuery({
    queryKey: ['job-cards', 'active'],
    queryFn: async () => {
      const res = await fetch('/api/job-cards?status=active');
      if (!res.ok) throw new Error('Failed to fetch job cards');
      const json = await res.json();
      return json.data as JobCard[];
    },
  });

  // If preselected job card, fetch its details
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

  // Update jobCardId when preselected from URL
  useEffect(() => {
    if (preselectedJobCardId && !formData.jobCardId) {
      setFormData(prev => ({ ...prev, jobCardId: preselectedJobCardId }));
    }
  }, [preselectedJobCardId, formData.jobCardId]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          weight: parseFloat(data.weight),
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create production entry');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production'] });
      queryClient.invalidateQueries({ queryKey: ['job-card', formData.jobCardId] });
      toast.success('Production entry created successfully');

      // Navigate back to job card if we came from there
      if (preselectedJobCardId) {
        router.push(`/dashboard/job-cards/${preselectedJobCardId}`);
      } else {
        router.push('/dashboard/production');
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
    if (!formData.weight || parseFloat(formData.weight) <= 0) {
      toast.error('Please enter a valid weight');
      return;
    }

    createMutation.mutate(formData);
  };

  const displayJobCard = selectedJobCard || activeJobCards?.find(jc => jc.id === formData.jobCardId);

  // Calculate production progress if we have job card data
  const getQuantityRequired = (jc: JobCard | undefined) => {
    if (!jc) return 0;
    const qty = jc.quantityRequired;
    return typeof qty === 'string' ? parseFloat(qty) : qty;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={preselectedJobCardId ? `/dashboard/job-cards/${preselectedJobCardId}` : '/dashboard/production'}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Production Entry</h1>
          <p className="text-muted-foreground">
            Record a new fabric piece produced
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Production Details</CardTitle>
                <CardDescription>
                  Enter the details for this production piece
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
                        <SelectItem value="__loading__" disabled>Loading...</SelectItem>
                      ) : activeJobCards?.length === 0 ? (
                        <SelectItem value="__empty__" disabled>No active job cards</SelectItem>
                      ) : (
                        activeJobCards?.map((jobCard) => (
                          <SelectItem key={jobCard.id} value={jobCard.id}>
                            {jobCard.jobCardNumber} - {jobCard.customer.name} ({jobCard.fabricQuality.qualityCode})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="weight">
                      Weight (kg) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData({ ...formData, weight: e.target.value })
                      }
                      required
                      placeholder="0.00"
                      className="text-lg"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="qualityGrade">Quality Grade</Label>
                    <Select
                      value={formData.qualityGrade}
                      onValueChange={(value) =>
                        setFormData({ ...formData, qualityGrade: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {QUALITY_GRADES.map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.qualityGrade !== 'Pass' && (
                  <div className="grid gap-2">
                    <Label htmlFor="defectType">Defect Type</Label>
                    <Input
                      id="defectType"
                      value={formData.defectType}
                      onChange={(e) =>
                        setFormData({ ...formData, defectType: e.target.value })
                      }
                      placeholder="Describe the defect..."
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="productionDate">Production Date</Label>
                    <Input
                      id="productionDate"
                      type="date"
                      value={formData.productionDate}
                      onChange={(e) =>
                        setFormData({ ...formData, productionDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="productionTime">Production Time</Label>
                    <Input
                      id="productionTime"
                      type="time"
                      value={formData.productionTime}
                      onChange={(e) =>
                        setFormData({ ...formData, productionTime: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="machineNumber">Machine</Label>
                    <Select
                      value={formData.machineNumber}
                      onValueChange={(value) =>
                        setFormData({ ...formData, machineNumber: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select machine" />
                      </SelectTrigger>
                      <SelectContent>
                        {MACHINES.map((machine) => (
                          <SelectItem key={machine} value={machine}>
                            {machine}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="operatorName">Operator Name</Label>
                    <Input
                      id="operatorName"
                      value={formData.operatorName}
                      onChange={(e) =>
                        setFormData({ ...formData, operatorName: e.target.value })
                      }
                      placeholder="e.g., John Doe"
                    />
                  </div>
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
                    placeholder="Any issues, observations, or comments..."
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Link href={preselectedJobCardId ? `/dashboard/job-cards/${preselectedJobCardId}` : '/dashboard/production'}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {createMutation.isPending ? 'Creating...' : 'Create Entry'}
              </Button>
            </div>
          </div>

          {/* Job Card Summary Sidebar */}
          <div className="space-y-6">
            {displayJobCard && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Job Card Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Job Card Number</p>
                    <p className="font-medium">{displayJobCard.jobCardNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="font-medium">{displayJobCard.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fabric Quality</p>
                    <p className="font-medium">{displayJobCard.fabricQuality.qualityCode}</p>
                    {displayJobCard.fabricQuality.description && (
                      <p className="text-xs text-muted-foreground">{displayJobCard.fabricQuality.description}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Stock Reference</p>
                    <p className="font-medium">{displayJobCard.stockReference}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Quantity Required</p>
                    <p className="font-medium">{formatWeight(getQuantityRequired(displayJobCard))}</p>
                  </div>
                  {displayJobCard._count && (
                    <div>
                      <p className="text-xs text-muted-foreground">Pieces Produced</p>
                      <p className="font-medium">{displayJobCard._count.production}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {!displayJobCard && formData.jobCardId && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Loading job card details...
                </CardContent>
              </Card>
            )}

            {!formData.jobCardId && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Select a job card to see details
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
