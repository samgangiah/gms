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
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { formatDate, formatWeight } from '@/lib/utils';

type YarnType = {
  id: string;
  code: string;
  description: string | null;
};

type StockReference = {
  id: string;
  stockReferenceNumber: string;
  yarnType: YarnType;
  currentQuantity: number;
};

type JobCard = {
  id: string;
  jobCardNumber: string;
  customer: {
    name: string;
  };
  fabricQuality: {
    qualityCode: string;
  };
};

type YarnStock = {
  id: string;
  quantityReceived: number;
  quantityUsed: number;
  quantityLoss: number;
  receivedDate: string;
  lotNumber: string | null;
  notes: string | null;
  jobCard: JobCard;
  stockRef: StockReference;
  createdAt: string;
};

export default function YarnStockPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    jobCardId: '',
    stockRefId: '',
    quantityReceived: '',
    quantityUsed: '',
    quantityLoss: '',
    receivedDate: new Date().toISOString().split('T')[0],
    lotNumber: '',
    notes: '',
  });

  const queryClient = useQueryClient();

  // Fetch all yarn stock allocations
  const { data: yarnStock, isLoading } = useQuery({
    queryKey: ['yarn-stock'],
    queryFn: async () => {
      const res = await fetch('/api/yarn-stock');
      if (!res.ok) throw new Error('Failed to fetch yarn stock');
      const json = await res.json();
      return json.data as YarnStock[];
    },
  });

  // Fetch active job cards for dropdown
  const { data: jobCards } = useQuery({
    queryKey: ['job-cards', 'active'],
    queryFn: async () => {
      const res = await fetch('/api/job-cards?status=active');
      if (!res.ok) throw new Error('Failed to fetch job cards');
      const json = await res.json();
      return json.data as JobCard[];
    },
  });

  // Fetch stock references for dropdown
  const { data: stockRefs } = useQuery({
    queryKey: ['stock-references'],
    queryFn: async () => {
      const res = await fetch('/api/stock-references');
      if (!res.ok) throw new Error('Failed to fetch stock references');
      const json = await res.json();
      return json.data as StockReference[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/yarn-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create yarn stock allocation');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-stock'] });
      queryClient.invalidateQueries({ queryKey: ['job-cards'] });
      toast.success('Yarn stock allocation created successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/yarn-stock/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update yarn stock allocation');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-stock'] });
      toast.success('Yarn stock allocation updated successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/yarn-stock/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete yarn stock allocation');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-stock'] });
      toast.success('Yarn stock allocation deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      jobCardId: '',
      stockRefId: '',
      quantityReceived: '',
      quantityUsed: '',
      quantityLoss: '',
      receivedDate: new Date().toISOString().split('T')[0],
      lotNumber: '',
      notes: '',
    });
    setIsEditMode(false);
    setEditingId(null);
  };

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
      toast.error('Please enter a valid quantity received');
      return;
    }

    const submitData = {
      ...formData,
      quantityReceived: parseFloat(formData.quantityReceived),
      quantityUsed: formData.quantityUsed ? parseFloat(formData.quantityUsed) : 0,
      quantityLoss: formData.quantityLoss ? parseFloat(formData.quantityLoss) : 0,
    };

    if (isEditMode && editingId) {
      updateMutation.mutate({ id: editingId, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (stock: YarnStock) => {
    setFormData({
      jobCardId: stock.jobCard.id,
      stockRefId: stock.stockRef.id,
      quantityReceived: stock.quantityReceived.toString(),
      quantityUsed: stock.quantityUsed.toString(),
      quantityLoss: stock.quantityLoss.toString(),
      receivedDate: stock.receivedDate.split('T')[0],
      lotNumber: stock.lotNumber || '',
      notes: stock.notes || '',
    });
    setIsEditMode(true);
    setEditingId(stock.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this yarn stock allocation?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredStock = yarnStock?.filter(
    (stock) =>
      stock.jobCard.jobCardNumber.toLowerCase().includes(search.toLowerCase()) ||
      stock.jobCard.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      stock.stockRef.yarnType.code.toLowerCase().includes(search.toLowerCase()) ||
      (stock.lotNumber && stock.lotNumber.toLowerCase().includes(search.toLowerCase()))
  );

  // Calculate summary statistics
  const stats = yarnStock
    ? {
        totalAllocations: yarnStock.length,
        totalReceived: yarnStock.reduce((sum, s) => sum + s.quantityReceived, 0),
        totalUsed: yarnStock.reduce((sum, s) => sum + s.quantityUsed, 0),
        totalLoss: yarnStock.reduce((sum, s) => sum + s.quantityLoss, 0),
      }
    : { totalAllocations: 0, totalReceived: 0, totalUsed: 0, totalLoss: 0 };

  const totalRemaining = stats.totalReceived - stats.totalUsed - stats.totalLoss;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yarn Stock Management</h1>
          <p className="text-muted-foreground">
            Track yarn allocation, usage, and inventory levels
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Allocate Yarn Stock
        </Button>
      </div>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Allocations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAllocations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatWeight(stats.totalReceived)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatWeight(stats.totalUsed)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatWeight(totalRemaining)}
            </div>
            {stats.totalLoss > 0 && (
              <p className="text-xs text-destructive mt-1">
                Loss: {formatWeight(stats.totalLoss)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by job card, customer, yarn type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Yarn Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Yarn Stock Allocations</CardTitle>
          <CardDescription>
            View and manage yarn allocations to job cards
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredStock?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No yarn stock allocations found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Card</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Yarn Type</TableHead>
                    <TableHead>Stock Ref</TableHead>
                    <TableHead>Lot #</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Loss</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock?.map((stock) => {
                    const remaining =
                      stock.quantityReceived - stock.quantityUsed - stock.quantityLoss;
                    return (
                      <TableRow key={stock.id}>
                        <TableCell className="font-medium">
                          {stock.jobCard.jobCardNumber}
                        </TableCell>
                        <TableCell>{stock.jobCard.customer.name}</TableCell>
                        <TableCell>
                          {stock.stockRef.yarnType.code}
                          {stock.stockRef.yarnType.description && (
                            <p className="text-xs text-muted-foreground">
                              {stock.stockRef.yarnType.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {stock.stockRef.stockReferenceNumber}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {stock.lotNumber || '-'}
                        </TableCell>
                        <TableCell>{formatWeight(stock.quantityReceived)}</TableCell>
                        <TableCell>{formatWeight(stock.quantityUsed)}</TableCell>
                        <TableCell>
                          {stock.quantityLoss > 0 ? (
                            <span className="text-destructive">
                              {formatWeight(stock.quantityLoss)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={remaining > 0 ? 'default' : 'secondary'}>
                            {formatWeight(remaining)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(stock.receivedDate)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(stock)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(stock.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Allocate/Edit Yarn Stock Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'Edit Yarn Stock Allocation' : 'Allocate Yarn Stock'}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? 'Update yarn stock allocation details'
                  : 'Allocate yarn stock to a job card'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="jobCardId">
                    Job Card <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.jobCardId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, jobCardId: value })
                    }
                    disabled={isEditMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job card" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobCards?.map((jobCard) => (
                        <SelectItem key={jobCard.id} value={jobCard.id}>
                          {jobCard.jobCardNumber} - {jobCard.customer.name}
                        </SelectItem>
                      ))}
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
                    disabled={isEditMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stock reference" />
                    </SelectTrigger>
                    <SelectContent>
                      {stockRefs?.map((ref) => (
                        <SelectItem key={ref.id} value={ref.id}>
                          {ref.stockReferenceNumber} - {ref.yarnType.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantityReceived">
                    Quantity Received (kg) <span className="text-destructive">*</span>
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
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantityUsed">Quantity Used (kg)</Label>
                  <Input
                    id="quantityUsed"
                    type="number"
                    step="0.01"
                    value={formData.quantityUsed}
                    onChange={(e) =>
                      setFormData({ ...formData, quantityUsed: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantityLoss">Loss (kg)</Label>
                  <Input
                    id="quantityLoss"
                    type="number"
                    step="0.01"
                    value={formData.quantityLoss}
                    onChange={(e) =>
                      setFormData({ ...formData, quantityLoss: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="receivedDate">Received Date</Label>
                  <Input
                    id="receivedDate"
                    type="date"
                    value={formData.receivedDate}
                    onChange={(e) =>
                      setFormData({ ...formData, receivedDate: e.target.value })
                    }
                  />
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
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? isEditMode
                    ? 'Updating...'
                    : 'Creating...'
                  : isEditMode
                  ? 'Update Allocation'
                  : 'Create Allocation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
