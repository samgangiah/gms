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
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
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
  stockDate: string;
  status: string;
  notes: string | null;
  createdAt: string;
};

export default function StockReferencesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    yarnTypeId: '',
    initialQuantity: '',
    notes: '',
  });
  const [editFormData, setEditFormData] = useState({
    currentQuantity: '',
    status: '',
    notes: '',
  });

  const queryClient = useQueryClient();

  // Fetch all stock references
  const { data: stockRefs, isLoading } = useQuery({
    queryKey: ['stock-references'],
    queryFn: async () => {
      const res = await fetch('/api/stock-references');
      if (!res.ok) throw new Error('Failed to fetch stock references');
      const json = await res.json();
      return json.data as StockReference[];
    },
  });

  // Fetch yarn types for dropdown
  const { data: yarnTypes } = useQuery({
    queryKey: ['yarn-types'],
    queryFn: async () => {
      const res = await fetch('/api/yarn-types');
      if (!res.ok) throw new Error('Failed to fetch yarn types');
      const json = await res.json();
      return json.data as YarnType[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: { yarnTypeId: string; initialQuantity: number; notes?: string }) => {
      const res = await fetch('/api/stock-references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create stock reference');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-references'] });
      toast.success('Stock reference created successfully');
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
      const res = await fetch(`/api/stock-references/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update stock reference');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-references'] });
      toast.success('Stock reference updated successfully');
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
      const res = await fetch(`/api/stock-references/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete stock reference');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-references'] });
      toast.success('Stock reference deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      yarnTypeId: '',
      initialQuantity: '',
      notes: '',
    });
    setEditFormData({
      currentQuantity: '',
      status: '',
      notes: '',
    });
    setIsEditMode(false);
    setEditingId(null);
  };

  const handleCreate = () => {
    if (!formData.yarnTypeId) {
      toast.error('Please select a yarn type');
      return;
    }
    if (!formData.initialQuantity || parseFloat(formData.initialQuantity) <= 0) {
      toast.error('Please enter a valid initial quantity');
      return;
    }

    createMutation.mutate({
      yarnTypeId: formData.yarnTypeId,
      initialQuantity: parseFloat(formData.initialQuantity),
      notes: formData.notes || undefined,
    });
  };

  const handleUpdate = () => {
    if (!editingId) return;

    updateMutation.mutate({
      id: editingId,
      data: {
        currentQuantity: editFormData.currentQuantity
          ? parseFloat(editFormData.currentQuantity)
          : undefined,
        status: editFormData.status || undefined,
        notes: editFormData.notes,
      },
    });
  };

  const handleEdit = (ref: StockReference) => {
    setEditFormData({
      currentQuantity: ref.currentQuantity.toString(),
      status: ref.status,
      notes: ref.notes || '',
    });
    setIsEditMode(true);
    setEditingId(ref.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this stock reference?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredRefs = stockRefs?.filter(
    (ref) =>
      ref.stockReferenceNumber.toLowerCase().includes(search.toLowerCase()) ||
      ref.yarnType.code.toLowerCase().includes(search.toLowerCase()) ||
      (ref.yarnType.description &&
        ref.yarnType.description.toLowerCase().includes(search.toLowerCase()))
  );

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'depleted':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock References</h1>
          <p className="text-muted-foreground">
            Manage yarn stock reference numbers for inventory tracking
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Stock Reference
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by reference number or yarn type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Stock References Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Stock References</CardTitle>
          <CardDescription>
            View and manage stock reference records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredRefs?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No stock references found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stock Ref #</TableHead>
                    <TableHead>Yarn Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Current Qty</TableHead>
                    <TableHead>Stock Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRefs?.map((ref) => (
                    <TableRow key={ref.id}>
                      <TableCell className="font-mono font-medium">
                        {ref.stockReferenceNumber}
                      </TableCell>
                      <TableCell>{ref.yarnType.code}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {ref.yarnType.description || '-'}
                      </TableCell>
                      <TableCell>{formatWeight(ref.currentQuantity)}</TableCell>
                      <TableCell>{formatDate(ref.stockDate)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(ref.status)}>
                          {ref.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(ref)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(ref.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Stock Reference' : 'Create Stock Reference'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update stock reference details'
                : 'Create a new stock reference for yarn inventory tracking'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!isEditMode ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="yarnTypeId">
                    Yarn Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.yarnTypeId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, yarnTypeId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select yarn type" />
                    </SelectTrigger>
                    <SelectContent>
                      {yarnTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.code} {type.description && `- ${type.description}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="initialQuantity">
                    Initial Quantity (kg) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="initialQuantity"
                    type="number"
                    step="0.01"
                    value={formData.initialQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, initialQuantity: e.target.value })
                    }
                    placeholder="0.00"
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
                    placeholder="Optional notes..."
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="currentQuantity">Current Quantity (kg)</Label>
                  <Input
                    id="currentQuantity"
                    type="number"
                    step="0.01"
                    value={editFormData.currentQuantity}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        currentQuantity: e.target.value,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(value) =>
                      setEditFormData({ ...editFormData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="depleted">Depleted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editNotes">Notes</Label>
                  <Textarea
                    id="editNotes"
                    value={editFormData.notes}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, notes: e.target.value })
                    }
                    rows={3}
                    placeholder="Optional notes..."
                  />
                </div>
              </>
            )}
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
              type="button"
              onClick={isEditMode ? handleUpdate : handleCreate}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                ? 'Update'
                : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
