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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type YarnType = {
  id: string;
  code: string;
  description: string | null;
  material: string | null;
  texCount: string | null;
  color: string | null;
  supplierName: string | null;
  supplierCode: string | null;
  unitPrice: number | null;
  active: boolean;
};

const MATERIALS = [
  'Cotton',
  'Polyester',
  'Polycotton',
  'Lycra',
  'Viscose',
  'Acrylic',
];

export default function YarnTypesPage() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingYarnType, setEditingYarnType] = useState<YarnType | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    material: '',
    texCount: '',
    color: '',
    supplierName: '',
    supplierCode: '',
    unitPrice: '',
    active: true,
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['yarn-types'],
    queryFn: async () => {
      const res = await fetch('/api/yarn-types');
      if (!res.ok) throw new Error('Failed to fetch yarn types');
      const json = await res.json();
      return json.data as YarnType[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/yarn-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          unitPrice: data.unitPrice ? parseFloat(data.unitPrice) : null,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create yarn type');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-types'] });
      toast.success('Yarn type created successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/yarn-types/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          unitPrice: data.unitPrice ? parseFloat(data.unitPrice) : null,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update yarn type');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-types'] });
      toast.success('Yarn type updated successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/yarn-types/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete yarn type');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-types'] });
      toast.success('Yarn type deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      material: '',
      texCount: '',
      color: '',
      supplierName: '',
      supplierCode: '',
      unitPrice: '',
      active: true,
    });
    setEditingYarnType(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingYarnType) {
      updateMutation.mutate({ id: editingYarnType.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (yarnType: YarnType) => {
    setEditingYarnType(yarnType);
    setFormData({
      code: yarnType.code,
      description: yarnType.description || '',
      material: yarnType.material || '',
      texCount: yarnType.texCount || '',
      color: yarnType.color || '',
      supplierName: yarnType.supplierName || '',
      supplierCode: yarnType.supplierCode || '',
      unitPrice: yarnType.unitPrice?.toString() || '',
      active: yarnType.active,
    });
    setIsDialogOpen(true);
  };

  const filteredYarnTypes = data?.filter(
    (yarnType) =>
      yarnType.code.toLowerCase().includes(search.toLowerCase()) ||
      yarnType.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yarn Types</h1>
          <p className="text-muted-foreground">
            Manage your yarn inventory catalog
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Yarn Type
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search yarn types..."
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
              <TableHead>Material</TableHead>
              <TableHead>Tex Count</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredYarnTypes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No yarn types found
                </TableCell>
              </TableRow>
            ) : (
              filteredYarnTypes?.map((yarnType) => (
                <TableRow key={yarnType.id}>
                  <TableCell className="font-medium">{yarnType.code}</TableCell>
                  <TableCell>{yarnType.material || '-'}</TableCell>
                  <TableCell>{yarnType.texCount || '-'}</TableCell>
                  <TableCell>{yarnType.color || '-'}</TableCell>
                  <TableCell>{yarnType.supplierName || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={yarnType.active ? 'default' : 'secondary'}>
                      {yarnType.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(yarnType)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(yarnType.id)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingYarnType ? 'Edit Yarn Type' : 'Add New Yarn Type'}
              </DialogTitle>
              <DialogDescription>
                {editingYarnType
                  ? 'Update yarn type information'
                  : 'Add a new yarn type to your catalog'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">
                  Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  required
                  placeholder="e.g., COT-24-WHT"
                />
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
                  <Label htmlFor="material">Material</Label>
                  <Select
                    value={formData.material}
                    onValueChange={(value) =>
                      setFormData({ ...formData, material: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIALS.map((material) => (
                        <SelectItem key={material} value={material}>
                          {material}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="texCount">Tex Count</Label>
                  <Input
                    id="texCount"
                    value={formData.texCount}
                    onChange={(e) =>
                      setFormData({ ...formData, texCount: e.target.value })
                    }
                    placeholder="e.g., 24"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    placeholder="e.g., White, Red"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="unitPrice">Unit Price (ZAR)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, unitPrice: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="supplierName">Supplier Name</Label>
                  <Input
                    id="supplierName"
                    value={formData.supplierName}
                    onChange={(e) =>
                      setFormData({ ...formData, supplierName: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="supplierCode">Supplier Code</Label>
                  <Input
                    id="supplierCode"
                    value={formData.supplierCode}
                    onChange={(e) =>
                      setFormData({ ...formData, supplierCode: e.target.value })
                    }
                  />
                </div>
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
                {editingYarnType ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
