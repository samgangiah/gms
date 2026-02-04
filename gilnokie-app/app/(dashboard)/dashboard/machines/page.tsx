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
import { Plus, Search, Edit, Trash2, Settings2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Machine = {
  id: string;
  machineNumber: string;
  machineName: string;
  machineType: string;
  gauge: string | null;
  diameter: number | null;
  feeders: number | null;
  maxSpeed: number | null;
  status: string;
  notes: string | null;
  createdAt?: string;
};

const MACHINE_TYPES = [
  'Circular Knitting',
  'Flat Knitting',
  'Warp Knitting',
  'Linking',
  'Sewing',
  'Other',
];

const MACHINE_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired', label: 'Retired' },
];

export default function MachinesPage() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [formData, setFormData] = useState({
    machineNumber: '',
    machineName: '',
    machineType: '',
    gauge: '',
    diameter: '',
    feeders: '',
    maxSpeed: '',
    status: 'active',
    notes: '',
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['machines'],
    queryFn: async () => {
      const res = await fetch('/api/machines');
      if (!res.ok) throw new Error('Failed to fetch machines');
      const json = await res.json();
      return json.data as Machine[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/machines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create machine');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      toast.success('Machine created successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/machines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update machine');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      toast.success('Machine updated successfully');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/machines/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete machine');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      toast.success('Machine deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      machineNumber: '',
      machineName: '',
      machineType: '',
      gauge: '',
      diameter: '',
      feeders: '',
      maxSpeed: '',
      status: 'active',
      notes: '',
    });
    setEditingMachine(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      gauge: formData.gauge || null,
      diameter: formData.diameter || null,
      feeders: formData.feeders || null,
      maxSpeed: formData.maxSpeed || null,
      notes: formData.notes || null,
    };
    if (editingMachine) {
      updateMutation.mutate({ id: editingMachine.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (machine: Machine) => {
    setEditingMachine(machine);
    setFormData({
      machineNumber: machine.machineNumber,
      machineName: machine.machineName,
      machineType: machine.machineType,
      gauge: machine.gauge || '',
      diameter: machine.diameter?.toString() || '',
      feeders: machine.feeders?.toString() || '',
      maxSpeed: machine.maxSpeed?.toString() || '',
      status: machine.status,
      notes: machine.notes || '',
    });
    setIsDialogOpen(true);
  };

  const filteredMachines = data?.filter(
    (machine) =>
      machine.machineNumber.toLowerCase().includes(search.toLowerCase()) ||
      machine.machineName.toLowerCase().includes(search.toLowerCase()) ||
      machine.machineType.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'maintenance':
        return 'outline';
      case 'inactive':
      case 'retired':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Machines</h1>
          <p className="text-muted-foreground">
            Manage your machine specifications
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Machine
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search machines..."
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
              <TableHead>Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Gauge</TableHead>
              <TableHead>Diameter</TableHead>
              <TableHead>Feeders</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredMachines?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No machines found
                </TableCell>
              </TableRow>
            ) : (
              filteredMachines?.map((machine) => (
                <TableRow key={machine.id}>
                  <TableCell className="font-mono text-sm">
                    {machine.machineNumber}
                  </TableCell>
                  <TableCell className="font-medium">
                    {machine.machineName}
                  </TableCell>
                  <TableCell>{machine.machineType}</TableCell>
                  <TableCell>{machine.gauge || '-'}</TableCell>
                  <TableCell>
                    {machine.diameter ? `${machine.diameter}"` : '-'}
                  </TableCell>
                  <TableCell>{machine.feeders || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(machine.status)}>
                      {machine.status.charAt(0).toUpperCase() +
                        machine.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(machine)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(machine.id)}
                        disabled={machine.status === 'inactive' || machine.status === 'retired'}
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
                {editingMachine ? 'Edit Machine' : 'Add New Machine'}
              </DialogTitle>
              <DialogDescription>
                {editingMachine
                  ? 'Update machine specifications'
                  : 'Add a new machine to your inventory'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="machineNumber">
                    Machine Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="machineNumber"
                    value={formData.machineNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, machineNumber: e.target.value })
                    }
                    placeholder="e.g., M001"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="machineName">
                    Machine Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="machineName"
                    value={formData.machineName}
                    onChange={(e) =>
                      setFormData({ ...formData, machineName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="machineType">
                    Machine Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.machineType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, machineType: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {MACHINE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {MACHINE_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="gauge">Gauge</Label>
                  <Input
                    id="gauge"
                    value={formData.gauge}
                    onChange={(e) =>
                      setFormData({ ...formData, gauge: e.target.value })
                    }
                    placeholder="e.g., 28"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="diameter">Diameter (inches)</Label>
                  <Input
                    id="diameter"
                    type="number"
                    step="0.1"
                    value={formData.diameter}
                    onChange={(e) =>
                      setFormData({ ...formData, diameter: e.target.value })
                    }
                    placeholder="e.g., 30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="feeders">Number of Feeders</Label>
                  <Input
                    id="feeders"
                    type="number"
                    value={formData.feeders}
                    onChange={(e) =>
                      setFormData({ ...formData, feeders: e.target.value })
                    }
                    placeholder="e.g., 96"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxSpeed">Max Speed (RPM)</Label>
                  <Input
                    id="maxSpeed"
                    type="number"
                    step="0.1"
                    value={formData.maxSpeed}
                    onChange={(e) =>
                      setFormData({ ...formData, maxSpeed: e.target.value })
                    }
                    placeholder="e.g., 25"
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
                  placeholder="Additional notes about this machine..."
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
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingMachine ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
