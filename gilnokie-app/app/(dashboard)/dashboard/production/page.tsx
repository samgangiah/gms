'use client';

import { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Search, Layers } from 'lucide-react';
import { formatDate, formatWeight } from '@/lib/utils';

type JobCard = {
  id: string;
  jobCardNumber: string;
  customer: {
    name: string;
  };
  fabricQuality: {
    qualityCode: string;
  };
  status: string;
};

type Production = {
  id: string;
  pieceNumber: string;
  weight: number;
  productionDate: string;
  machineNumber: string | null;
  operatorName: string | null;
  qualityGrade: string | null;
  jobCard: JobCard;
};

const MACHINES = Array.from({ length: 11 }, (_, i) => `Machine ${i + 1}`);
const QUALITY_GRADES = ['Pass', 'Minor', 'Defect', 'Rework'];

export default function ProductionPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    jobCardId: '',
    weight: '',
    productionDate: new Date().toISOString().split('T')[0],
    productionTime: new Date().toTimeString().slice(0, 5),
    machineNumber: '',
    operatorName: '',
    qualityGrade: 'Pass',
    notes: '',
  });

  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkFormData, setBulkFormData] = useState({
    jobCardId: '',
    numberOfRolls: 1,
    productionDate: new Date().toISOString().split('T')[0],
    productionTime: new Date().toTimeString().slice(0, 5),
    machineNumber: '',
    operatorName: '',
    qualityGrade: 'Pass',
    notes: '',
  });
  const [rollWeights, setRollWeights] = useState<string[]>(['']);

  const queryClient = useQueryClient();

  const { data: activeJobCards } = useQuery({
    queryKey: ['job-cards', 'active'],
    queryFn: async () => {
      const res = await fetch('/api/job-cards?status=active');
      if (!res.ok) throw new Error('Failed to fetch job cards');
      const json = await res.json();
      return json.data as JobCard[];
    },
  });

  const { data: production, isLoading } = useQuery({
    queryKey: ['production', dateFilter],
    queryFn: async () => {
      const res = await fetch(`/api/production?date=${dateFilter}`);
      if (!res.ok) throw new Error('Failed to fetch production');
      const json = await res.json();
      return json.data as Production[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
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
      toast.success('Production entry created successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/production/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create production entries');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['production'] });
      const count = data.data?.length || 0;
      toast.success(`${count} production ${count === 1 ? 'entry' : 'entries'} created successfully`);
      setIsBulkDialogOpen(false);
      resetBulkForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      jobCardId: '',
      weight: '',
      productionDate: new Date().toISOString().split('T')[0],
      productionTime: new Date().toTimeString().slice(0, 5),
      machineNumber: '',
      operatorName: '',
      qualityGrade: 'Pass',
      notes: '',
    });
  };

  const resetBulkForm = () => {
    setBulkFormData({
      jobCardId: '',
      numberOfRolls: 1,
      productionDate: new Date().toISOString().split('T')[0],
      productionTime: new Date().toTimeString().slice(0, 5),
      machineNumber: '',
      operatorName: '',
      qualityGrade: 'Pass',
      notes: '',
    });
    setRollWeights(['']);
  };

  const handleNumberOfRollsChange = (num: number) => {
    const clamped = Math.max(1, Math.min(50, num));
    setBulkFormData({ ...bulkFormData, numberOfRolls: clamped });
    setRollWeights((prev) => {
      const newWeights = [...prev];
      while (newWeights.length < clamped) newWeights.push('');
      return newWeights.slice(0, clamped);
    });
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!bulkFormData.jobCardId) {
      toast.error('Please select a job card');
      return;
    }

    const rolls = rollWeights.map((w) => ({ weight: parseFloat(w) }));
    const invalidRolls = rolls.filter((r) => isNaN(r.weight) || r.weight <= 0);
    if (invalidRolls.length > 0) {
      toast.error('Please enter a valid weight for all rolls');
      return;
    }

    bulkCreateMutation.mutate({
      jobCardId: bulkFormData.jobCardId,
      productionDate: bulkFormData.productionDate,
      productionTime: bulkFormData.productionTime,
      machineNumber: bulkFormData.machineNumber,
      operatorName: bulkFormData.operatorName,
      qualityGrade: bulkFormData.qualityGrade,
      notes: bulkFormData.notes,
      rolls,
    });
  };

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

  const selectedJobCard = activeJobCards?.find(jc => jc.id === formData.jobCardId);
  const selectedBulkJobCard = activeJobCards?.find(jc => jc.id === bulkFormData.jobCardId);

  // Calculate today's statistics
  const todayStats = production
    ? {
        totalPieces: production.length,
        totalWeight: production.reduce((sum, p) => sum + p.weight, 0),
        byGrade: production.reduce((acc, p) => {
          const grade = p.qualityGrade || 'Unknown';
          acc[grade] = (acc[grade] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      }
    : { totalPieces: 0, totalWeight: 0, byGrade: {} };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Entry</h1>
          <p className="text-muted-foreground">
            Record fabric pieces produced on the shop floor
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsDialogOpen(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Single Roll
          </Button>
          <Button onClick={() => { resetBulkForm(); setIsBulkDialogOpen(true); }}>
            <Layers className="mr-2 h-4 w-4" />
            Bulk Add Rolls
          </Button>
        </div>
      </div>

      {/* Today's Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pieces Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.totalPieces}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatWeight(todayStats.totalWeight)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayStats.totalPieces > 0
                ? (
                    ((todayStats.byGrade['Pass'] || 0) / todayStats.totalPieces) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Defects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {todayStats.byGrade['Defect'] || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Production Records</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="dateFilter">Date:</Label>
              <Input
                id="dateFilter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : production?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No production records for this date
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Piece #</TableHead>
                    <TableHead>Job Card</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Machine</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {production?.map((prod) => (
                    <TableRow key={prod.id}>
                      <TableCell className="font-medium">
                        {prod.pieceNumber}
                      </TableCell>
                      <TableCell>{prod.jobCard.jobCardNumber}</TableCell>
                      <TableCell>{prod.jobCard.customer.name}</TableCell>
                      <TableCell>{formatWeight(prod.weight)}</TableCell>
                      <TableCell>{prod.machineNumber || '-'}</TableCell>
                      <TableCell>{prod.operatorName || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            prod.qualityGrade === 'Pass'
                              ? 'default'
                              : prod.qualityGrade === 'Defect'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {prod.qualityGrade || 'N/A'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Production Entry Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Add Production Entry</DialogTitle>
              <DialogDescription>
                Record a new fabric piece produced
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="jobCardId">
                  Job Card <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.jobCardId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, jobCardId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job card" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeJobCards?.map((jobCard) => (
                      <SelectItem key={jobCard.id} value={jobCard.id}>
                        {jobCard.jobCardNumber} - {jobCard.customer.name} ({jobCard.fabricQuality.qualityCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedJobCard && (
                  <p className="text-xs text-muted-foreground">
                    Customer: {selectedJobCard.customer.name} | Quality: {selectedJobCard.fabricQuality.qualityCode}
                  </p>
                )}
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
                  rows={2}
                  placeholder="Any issues, observations, or comments..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Entry'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Production Entry Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleBulkSubmit}>
            <DialogHeader>
              <DialogTitle>Bulk Add Production Rolls</DialogTitle>
              <DialogDescription>
                Add multiple rolls at once. Set the shared details, then enter individual weights.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="bulkJobCardId">
                  Job Card <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={bulkFormData.jobCardId}
                  onValueChange={(value) =>
                    setBulkFormData({ ...bulkFormData, jobCardId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job card" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeJobCards?.map((jobCard) => (
                      <SelectItem key={jobCard.id} value={jobCard.id}>
                        {jobCard.jobCardNumber} - {jobCard.customer.name} ({jobCard.fabricQuality.qualityCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBulkJobCard && (
                  <p className="text-xs text-muted-foreground">
                    Customer: {selectedBulkJobCard.customer.name} | Quality: {selectedBulkJobCard.fabricQuality.qualityCode}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bulkProductionDate">Production Date</Label>
                  <Input
                    id="bulkProductionDate"
                    type="date"
                    value={bulkFormData.productionDate}
                    onChange={(e) =>
                      setBulkFormData({ ...bulkFormData, productionDate: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bulkProductionTime">Production Time</Label>
                  <Input
                    id="bulkProductionTime"
                    type="time"
                    value={bulkFormData.productionTime}
                    onChange={(e) =>
                      setBulkFormData({ ...bulkFormData, productionTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bulkMachine">Machine</Label>
                  <Select
                    value={bulkFormData.machineNumber}
                    onValueChange={(value) =>
                      setBulkFormData({ ...bulkFormData, machineNumber: value })
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
                  <Label htmlFor="bulkOperator">Operator Name</Label>
                  <Input
                    id="bulkOperator"
                    value={bulkFormData.operatorName}
                    onChange={(e) =>
                      setBulkFormData({ ...bulkFormData, operatorName: e.target.value })
                    }
                    placeholder="e.g., John Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bulkGrade">Quality Grade</Label>
                  <Select
                    value={bulkFormData.qualityGrade}
                    onValueChange={(value) =>
                      setBulkFormData({ ...bulkFormData, qualityGrade: value })
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
                <div className="grid gap-2">
                  <Label htmlFor="bulkNumberOfRolls">
                    Number of Rolls <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="bulkNumberOfRolls"
                    type="number"
                    min={1}
                    max={50}
                    value={bulkFormData.numberOfRolls}
                    onChange={(e) => handleNumberOfRollsChange(parseInt(e.target.value) || 1)}
                    className="text-lg"
                  />
                </div>
              </div>

              {/* Individual Roll Weights */}
              <div className="grid gap-2">
                <Label>
                  Roll Weights (kg) <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Enter the weight for each roll. Piece numbers will be auto-generated.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto rounded-md border p-3">
                  {rollWeights.map((weight, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground w-6 text-right shrink-0">
                        {index + 1}.
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        value={weight}
                        onChange={(e) => {
                          const newWeights = [...rollWeights];
                          newWeights[index] = e.target.value;
                          setRollWeights(newWeights);
                        }}
                        placeholder="0.00"
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
                {rollWeights.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Total: {formatWeight(rollWeights.reduce((sum, w) => sum + (parseFloat(w) || 0), 0))} across {rollWeights.filter(w => parseFloat(w) > 0).length} rolls
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bulkNotes">Notes</Label>
                <Textarea
                  id="bulkNotes"
                  value={bulkFormData.notes}
                  onChange={(e) =>
                    setBulkFormData({ ...bulkFormData, notes: e.target.value })
                  }
                  rows={2}
                  placeholder="Any issues, observations, or comments..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBulkDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={bulkCreateMutation.isPending}>
                {bulkCreateMutation.isPending
                  ? 'Creating...'
                  : `Add ${rollWeights.filter(w => parseFloat(w) > 0).length} Rolls`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
