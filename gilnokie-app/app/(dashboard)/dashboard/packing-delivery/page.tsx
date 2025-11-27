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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Search, Package, Truck, Eye } from 'lucide-react';
import { formatDate, formatWeight } from '@/lib/utils';
import Link from 'next/link';

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

type PackingItem = {
  id: string;
  production: {
    pieceNumber: string;
    weight: number;
  };
};

type PackingList = {
  id: string;
  packingListNumber: string;
  packingDate: string;
  numberOfCartons: number;
  totalGrossWeight: number | null;
  totalNetWeight: number;
  packingStatus: string;
  packingNotes: string | null;
  jobCard: JobCard;
  items: PackingItem[];
  createdAt: string;
};

type Delivery = {
  id: string;
  deliveryNoteNumber: string;
  deliveryDate: string | null;
  scheduledDeliveryDate: string | null;
  deliveryMethod: string;
  deliveryAddress: string;
  courierName: string | null;
  trackingNumber: string | null;
  deliveryStatus: string;
  deliveryNotes: string | null;
  jobCard: JobCard;
  packingLists: PackingList[];
  createdAt: string;
};

const DELIVERY_METHODS = ['Standard', 'Express', 'Courier', 'Collection', 'Other'];
const PACKING_STATUSES = ['pending', 'in_progress', 'completed'];
const DELIVERY_STATUSES = ['pending', 'scheduled', 'in_transit', 'delivered', 'cancelled'];

export default function PackingDeliveryPage() {
  const [activeTab, setActiveTab] = useState('packing');
  const [isPackingDialogOpen, setIsPackingDialogOpen] = useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [packingFormData, setPackingFormData] = useState({
    jobCardId: '',
    packingDate: new Date().toISOString().split('T')[0],
    numberOfCartons: '',
    totalGrossWeight: '',
    totalNetWeight: '',
    packingNotes: '',
    packingStatus: 'pending',
  });

  const [deliveryFormData, setDeliveryFormData] = useState({
    jobCardId: '',
    scheduledDeliveryDate: new Date().toISOString().split('T')[0],
    deliveryMethod: 'Standard',
    deliveryAddress: '',
    courierName: '',
    trackingNumber: '',
    deliveryNotes: '',
    deliveryStatus: 'pending',
  });

  const queryClient = useQueryClient();

  // Fetch packing lists
  const { data: packingLists, isLoading: isLoadingPacking } = useQuery({
    queryKey: ['packing'],
    queryFn: async () => {
      const res = await fetch('/api/packing');
      if (!res.ok) throw new Error('Failed to fetch packing lists');
      const json = await res.json();
      return json.data as PackingList[];
    },
  });

  // Fetch deliveries
  const { data: deliveries, isLoading: isLoadingDelivery } = useQuery({
    queryKey: ['delivery'],
    queryFn: async () => {
      const res = await fetch('/api/delivery');
      if (!res.ok) throw new Error('Failed to fetch deliveries');
      const json = await res.json();
      return json.data as Delivery[];
    },
  });

  // Fetch job cards for dropdowns
  const { data: jobCards } = useQuery({
    queryKey: ['job-cards', 'active'],
    queryFn: async () => {
      const res = await fetch('/api/job-cards?status=active');
      if (!res.ok) throw new Error('Failed to fetch job cards');
      const json = await res.json();
      return json.data as JobCard[];
    },
  });

  // Create packing list mutation
  const createPackingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/packing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create packing list');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packing'] });
      toast.success('Packing list created successfully');
      setIsPackingDialogOpen(false);
      resetPackingForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Create delivery mutation
  const createDeliveryMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create delivery');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery'] });
      toast.success('Delivery created successfully');
      setIsDeliveryDialogOpen(false);
      resetDeliveryForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetPackingForm = () => {
    setPackingFormData({
      jobCardId: '',
      packingDate: new Date().toISOString().split('T')[0],
      numberOfCartons: '',
      totalGrossWeight: '',
      totalNetWeight: '',
      packingNotes: '',
      packingStatus: 'pending',
    });
  };

  const resetDeliveryForm = () => {
    setDeliveryFormData({
      jobCardId: '',
      scheduledDeliveryDate: new Date().toISOString().split('T')[0],
      deliveryMethod: 'Standard',
      deliveryAddress: '',
      courierName: '',
      trackingNumber: '',
      deliveryNotes: '',
      deliveryStatus: 'pending',
    });
  };

  const handlePackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!packingFormData.jobCardId) {
      toast.error('Please select a job card');
      return;
    }
    if (!packingFormData.numberOfCartons || parseInt(packingFormData.numberOfCartons) <= 0) {
      toast.error('Please enter a valid number of cartons');
      return;
    }
    if (!packingFormData.totalNetWeight || parseFloat(packingFormData.totalNetWeight) <= 0) {
      toast.error('Please enter a valid net weight');
      return;
    }

    const submitData = {
      ...packingFormData,
      numberOfCartons: parseInt(packingFormData.numberOfCartons),
      totalGrossWeight: packingFormData.totalGrossWeight
        ? parseFloat(packingFormData.totalGrossWeight)
        : null,
      totalNetWeight: parseFloat(packingFormData.totalNetWeight),
    };

    createPackingMutation.mutate(submitData);
  };

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!deliveryFormData.jobCardId) {
      toast.error('Please select a job card');
      return;
    }
    if (!deliveryFormData.deliveryAddress) {
      toast.error('Please enter delivery address');
      return;
    }

    createDeliveryMutation.mutate(deliveryFormData);
  };

  const filteredPackingLists = packingLists?.filter(
    (packing) =>
      packing.packingListNumber.toLowerCase().includes(search.toLowerCase()) ||
      packing.jobCard.jobCardNumber.toLowerCase().includes(search.toLowerCase()) ||
      packing.jobCard.customer.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDeliveries = deliveries?.filter(
    (delivery) =>
      delivery.deliveryNoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      delivery.jobCard.jobCardNumber.toLowerCase().includes(search.toLowerCase()) ||
      delivery.jobCard.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      (delivery.trackingNumber &&
        delivery.trackingNumber.toLowerCase().includes(search.toLowerCase()))
  );

  const getPackingStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'in_transit':
        return 'secondary';
      case 'scheduled':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Calculate summary statistics
  const packingStats = packingLists
    ? {
        total: packingLists.length,
        pending: packingLists.filter((p) => p.packingStatus === 'pending').length,
        inProgress: packingLists.filter((p) => p.packingStatus === 'in_progress').length,
        completed: packingLists.filter((p) => p.packingStatus === 'completed').length,
        totalWeight: packingLists.reduce((sum, p) => sum + p.totalNetWeight, 0),
      }
    : { total: 0, pending: 0, inProgress: 0, completed: 0, totalWeight: 0 };

  const deliveryStats = deliveries
    ? {
        total: deliveries.length,
        pending: deliveries.filter((d) => d.deliveryStatus === 'pending').length,
        scheduled: deliveries.filter((d) => d.deliveryStatus === 'scheduled').length,
        inTransit: deliveries.filter((d) => d.deliveryStatus === 'in_transit').length,
        delivered: deliveries.filter((d) => d.deliveryStatus === 'delivered').length,
      }
    : { total: 0, pending: 0, scheduled: 0, inTransit: 0, delivered: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Packing & Delivery</h1>
          <p className="text-muted-foreground">
            Manage packing lists and delivery tracking
          </p>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Packing Lists
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packingStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {packingStats.completed} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Packed Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatWeight(packingStats.totalWeight)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {deliveryStats.delivered} delivered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {deliveryStats.inTransit}
            </div>
            <p className="text-xs text-muted-foreground">
              {deliveryStats.scheduled} scheduled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="packing">
              <Package className="mr-2 h-4 w-4" />
              Packing Lists
            </TabsTrigger>
            <TabsTrigger value="delivery">
              <Truck className="mr-2 h-4 w-4" />
              Deliveries
            </TabsTrigger>
          </TabsList>
          {activeTab === 'packing' ? (
            <Button onClick={() => setIsPackingDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Packing List
            </Button>
          ) : (
            <Button onClick={() => setIsDeliveryDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Delivery
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Packing Lists Tab */}
        <TabsContent value="packing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Packing Lists</CardTitle>
              <CardDescription>Track packing progress for job cards</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPacking ? (
                <div className="text-center py-8">Loading...</div>
              ) : filteredPackingLists?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No packing lists found
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Packing List #</TableHead>
                        <TableHead>Job Card</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Packing Date</TableHead>
                        <TableHead>Cartons</TableHead>
                        <TableHead>Net Weight</TableHead>
                        <TableHead>Gross Weight</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPackingLists?.map((packing) => (
                        <TableRow key={packing.id}>
                          <TableCell className="font-medium font-mono">
                            {packing.packingListNumber}
                          </TableCell>
                          <TableCell>{packing.jobCard.jobCardNumber}</TableCell>
                          <TableCell>{packing.jobCard.customer.name}</TableCell>
                          <TableCell>{formatDate(packing.packingDate)}</TableCell>
                          <TableCell>{packing.numberOfCartons}</TableCell>
                          <TableCell>{formatWeight(packing.totalNetWeight)}</TableCell>
                          <TableCell>
                            {packing.totalGrossWeight
                              ? formatWeight(packing.totalGrossWeight)
                              : '-'}
                          </TableCell>
                          <TableCell>{packing.items.length}</TableCell>
                          <TableCell>
                            <Badge variant={getPackingStatusColor(packing.packingStatus)}>
                              {packing.packingStatus.replace('_', ' ')}
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
        </TabsContent>

        {/* Deliveries Tab */}
        <TabsContent value="delivery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deliveries</CardTitle>
              <CardDescription>Track delivery status and shipments</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDelivery ? (
                <div className="text-center py-8">Loading...</div>
              ) : filteredDeliveries?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No deliveries found
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Delivery Note #</TableHead>
                        <TableHead>Job Card</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Scheduled Date</TableHead>
                        <TableHead>Delivery Date</TableHead>
                        <TableHead>Tracking #</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDeliveries?.map((delivery) => (
                        <TableRow key={delivery.id}>
                          <TableCell className="font-medium font-mono">
                            {delivery.deliveryNoteNumber}
                          </TableCell>
                          <TableCell>{delivery.jobCard.jobCardNumber}</TableCell>
                          <TableCell>{delivery.jobCard.customer.name}</TableCell>
                          <TableCell>{delivery.deliveryMethod}</TableCell>
                          <TableCell>
                            {delivery.scheduledDeliveryDate
                              ? formatDate(delivery.scheduledDeliveryDate)
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {delivery.deliveryDate ? formatDate(delivery.deliveryDate) : '-'}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {delivery.trackingNumber || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getDeliveryStatusColor(delivery.deliveryStatus)}>
                              {delivery.deliveryStatus.replace('_', ' ')}
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
        </TabsContent>
      </Tabs>

      {/* Create Packing List Dialog */}
      <Dialog open={isPackingDialogOpen} onOpenChange={setIsPackingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handlePackingSubmit}>
            <DialogHeader>
              <DialogTitle>Create Packing List</DialogTitle>
              <DialogDescription>Create a new packing list for a job card</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="jobCardId">
                  Job Card <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={packingFormData.jobCardId}
                  onValueChange={(value) =>
                    setPackingFormData({ ...packingFormData, jobCardId: value })
                  }
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

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="packingDate">Packing Date</Label>
                  <Input
                    id="packingDate"
                    type="date"
                    value={packingFormData.packingDate}
                    onChange={(e) =>
                      setPackingFormData({ ...packingFormData, packingDate: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="packingStatus">Status</Label>
                  <Select
                    value={packingFormData.packingStatus}
                    onValueChange={(value) =>
                      setPackingFormData({ ...packingFormData, packingStatus: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PACKING_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="numberOfCartons">
                    Number of Cartons <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="numberOfCartons"
                    type="number"
                    value={packingFormData.numberOfCartons}
                    onChange={(e) =>
                      setPackingFormData({
                        ...packingFormData,
                        numberOfCartons: e.target.value,
                      })
                    }
                    required
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="totalNetWeight">
                    Net Weight (kg) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="totalNetWeight"
                    type="number"
                    step="0.01"
                    value={packingFormData.totalNetWeight}
                    onChange={(e) =>
                      setPackingFormData({
                        ...packingFormData,
                        totalNetWeight: e.target.value,
                      })
                    }
                    required
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="totalGrossWeight">Gross Weight (kg)</Label>
                  <Input
                    id="totalGrossWeight"
                    type="number"
                    step="0.01"
                    value={packingFormData.totalGrossWeight}
                    onChange={(e) =>
                      setPackingFormData({
                        ...packingFormData,
                        totalGrossWeight: e.target.value,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="packingNotes">Notes</Label>
                <Textarea
                  id="packingNotes"
                  value={packingFormData.packingNotes}
                  onChange={(e) =>
                    setPackingFormData({ ...packingFormData, packingNotes: e.target.value })
                  }
                  rows={3}
                  placeholder="Any packing instructions or notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPackingDialogOpen(false);
                  resetPackingForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createPackingMutation.isPending}>
                {createPackingMutation.isPending ? 'Creating...' : 'Create Packing List'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Delivery Dialog */}
      <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleDeliverySubmit}>
            <DialogHeader>
              <DialogTitle>Create Delivery</DialogTitle>
              <DialogDescription>Schedule a delivery for a job card</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="deliveryJobCardId">
                  Job Card <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={deliveryFormData.jobCardId}
                  onValueChange={(value) =>
                    setDeliveryFormData({ ...deliveryFormData, jobCardId: value })
                  }
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

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="scheduledDeliveryDate">Scheduled Date</Label>
                  <Input
                    id="scheduledDeliveryDate"
                    type="date"
                    value={deliveryFormData.scheduledDeliveryDate}
                    onChange={(e) =>
                      setDeliveryFormData({
                        ...deliveryFormData,
                        scheduledDeliveryDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deliveryMethod">
                    Delivery Method <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={deliveryFormData.deliveryMethod}
                    onValueChange={(value) =>
                      setDeliveryFormData({ ...deliveryFormData, deliveryMethod: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DELIVERY_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="deliveryAddress">
                  Delivery Address <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="deliveryAddress"
                  value={deliveryFormData.deliveryAddress}
                  onChange={(e) =>
                    setDeliveryFormData({
                      ...deliveryFormData,
                      deliveryAddress: e.target.value,
                    })
                  }
                  rows={2}
                  required
                  placeholder="Complete delivery address..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="courierName">Courier Name</Label>
                  <Input
                    id="courierName"
                    value={deliveryFormData.courierName}
                    onChange={(e) =>
                      setDeliveryFormData({ ...deliveryFormData, courierName: e.target.value })
                    }
                    placeholder="e.g., DHL, FedEx"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="trackingNumber">Tracking Number</Label>
                  <Input
                    id="trackingNumber"
                    value={deliveryFormData.trackingNumber}
                    onChange={(e) =>
                      setDeliveryFormData({
                        ...deliveryFormData,
                        trackingNumber: e.target.value,
                      })
                    }
                    placeholder="Enter tracking number"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="deliveryStatus">Status</Label>
                <Select
                  value={deliveryFormData.deliveryStatus}
                  onValueChange={(value) =>
                    setDeliveryFormData({ ...deliveryFormData, deliveryStatus: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DELIVERY_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="deliveryNotes">Delivery Notes</Label>
                <Textarea
                  id="deliveryNotes"
                  value={deliveryFormData.deliveryNotes}
                  onChange={(e) =>
                    setDeliveryFormData({ ...deliveryFormData, deliveryNotes: e.target.value })
                  }
                  rows={2}
                  placeholder="Special delivery instructions..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeliveryDialogOpen(false);
                  resetDeliveryForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createDeliveryMutation.isPending}>
                {createDeliveryMutation.isPending ? 'Creating...' : 'Create Delivery'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
