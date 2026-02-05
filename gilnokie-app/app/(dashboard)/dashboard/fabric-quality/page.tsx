'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

type FabricQuality = {
  id: string;
  qualityCode: string;
  description: string | null;
  greigeDimensions: string | null;
  finishedDimensions: string | null;
  width: number | null;
  weight: number | null;
  machineGauge: string | null;
  machineType: string | null;
  slittingRequired: boolean;
  active: boolean;
  metersPerKg: number | null;
};

export default function FabricQualityPage() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuality, setEditingQuality] = useState<FabricQuality | null>(null);
  const [formData, setFormData] = useState({
    qualityCode: '',
    description: '',
    greigeDimensions: '',
    finishedDimensions: '',
    greigeDensity: '',
    finishedDensity: '',
    width: '',
    weight: '',
    machineGauge: '',
    machineType: '',
    specSheetRef: '',
    metersPerKg: '',
    slittingRequired: false,
    active: true,
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['fabric-quality'],
    queryFn: async () => {
      const res = await fetch('/api/fabric-quality');
      if (!res.ok) throw new Error('Failed to fetch fabric qualities');
      const json = await res.json();
      return json.data as FabricQuality[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/fabric-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          width: data.width ? parseFloat(data.width) : null,
          weight: data.weight ? parseFloat(data.weight) : null,
          metersPerKg: data.metersPerKg ? parseFloat(data.metersPerKg) : null,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create fabric quality');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fabric-quality'] });
      toast.success('Fabric quality created successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/fabric-quality/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          width: data.width ? parseFloat(data.width) : null,
          weight: data.weight ? parseFloat(data.weight) : null,
          metersPerKg: data.metersPerKg ? parseFloat(data.metersPerKg) : null,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update fabric quality');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fabric-quality'] });
      toast.success('Fabric quality updated successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/fabric-quality/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete fabric quality');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fabric-quality'] });
      toast.success('Fabric quality deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      qualityCode: '',
      description: '',
      greigeDimensions: '',
      finishedDimensions: '',
      greigeDensity: '',
      finishedDensity: '',
      width: '',
      weight: '',
      machineGauge: '',
      machineType: '',
      specSheetRef: '',
      metersPerKg: '',
      slittingRequired: false,
      active: true,
    });
    setEditingQuality(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingQuality) {
      updateMutation.mutate({ id: editingQuality.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (quality: FabricQuality) => {
    setEditingQuality(quality);
    setFormData({
      qualityCode: quality.qualityCode,
      description: quality.description || '',
      greigeDimensions: quality.greigeDimensions || '',
      finishedDimensions: quality.finishedDimensions || '',
      greigeDensity: '',
      finishedDensity: '',
      width: quality.width?.toString() || '',
      weight: quality.weight?.toString() || '',
      machineGauge: quality.machineGauge || '',
      machineType: quality.machineType || '',
      specSheetRef: '',
      metersPerKg: quality.metersPerKg?.toString() || '',
      slittingRequired: quality.slittingRequired,
      active: quality.active,
    });
    setIsDialogOpen(true);
  };

  const filteredQualities = data?.filter((quality) =>
    quality.qualityCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fabric Quality</h1>
          <p className="text-muted-foreground">
            Manage fabric specifications and quality standards
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Quality
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search qualities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Dimensions</TableHead>
              <TableHead>Machine</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredQualities?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No fabric qualities found
                </TableCell>
              </TableRow>
            ) : (
              filteredQualities?.map((quality) => (
                <TableRow key={quality.id}>
                  <TableCell className="font-medium">{quality.qualityCode}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {quality.description || '-'}
                  </TableCell>
                  <TableCell>
                    {quality.finishedDimensions || quality.greigeDimensions || '-'}
                  </TableCell>
                  <TableCell>
                    {quality.machineType || quality.machineGauge || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={quality.active ? 'default' : 'secondary'}>
                      {quality.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(quality)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(quality.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingQuality ? 'Edit Fabric Quality' : 'Add New Fabric Quality'}
              </DialogTitle>
              <DialogDescription>
                {editingQuality
                  ? 'Update fabric quality specifications'
                  : 'Add a new fabric quality specification'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="qualityCode">
                    Quality Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="qualityCode"
                    value={formData.qualityCode}
                    onChange={(e) =>
                      setFormData({ ...formData, qualityCode: e.target.value })
                    }
                    required
                    placeholder="e.g., PD600, T3"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="specSheetRef">Spec Sheet Reference</Label>
                  <Input
                    id="specSheetRef"
                    value={formData.specSheetRef}
                    onChange={(e) =>
                      setFormData({ ...formData, specSheetRef: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="greigeDimensions">Greige Dimensions</Label>
                  <Input
                    id="greigeDimensions"
                    value={formData.greigeDimensions}
                    onChange={(e) =>
                      setFormData({ ...formData, greigeDimensions: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="finishedDimensions">Finished Dimensions</Label>
                  <Input
                    id="finishedDimensions"
                    value={formData.finishedDimensions}
                    onChange={(e) =>
                      setFormData({ ...formData, finishedDimensions: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="width">Width (cm)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    value={formData.width}
                    onChange={(e) =>
                      setFormData({ ...formData, width: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="weight">Weight (gsm)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2 p-3 border rounded-md bg-muted/30">
                <Label htmlFor="metersPerKg" className="text-base font-semibold">
                  Meters per Kilogram
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Conversion factor for calculating meters from kg. Used to display customer-friendly quantities.
                </p>
                <Input
                  id="metersPerKg"
                  type="number"
                  step="0.01"
                  value={formData.metersPerKg}
                  onChange={(e) =>
                    setFormData({ ...formData, metersPerKg: e.target.value })
                  }
                  placeholder="e.g., 2.5 means 1kg = 2.5 meters"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="machineGauge">Machine Gauge</Label>
                  <Input
                    id="machineGauge"
                    value={formData.machineGauge}
                    onChange={(e) =>
                      setFormData({ ...formData, machineGauge: e.target.value })
                    }
                    placeholder="e.g., 24, 28"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="machineType">Machine Type</Label>
                  <Input
                    id="machineType"
                    value={formData.machineType}
                    onChange={(e) =>
                      setFormData({ ...formData, machineType: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="slittingRequired"
                    checked={formData.slittingRequired}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, slittingRequired: checked as boolean })
                    }
                  />
                  <Label htmlFor="slittingRequired">Slitting Required</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, active: checked as boolean })
                    }
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
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
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingQuality ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
