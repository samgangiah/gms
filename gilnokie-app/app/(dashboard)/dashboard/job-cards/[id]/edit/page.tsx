'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft, Save, Calculator, Loader2 } from 'lucide-react';
import Link from 'next/link';

type Customer = {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
};

type FabricQuality = {
  id: string;
  qualityCode: string;
  description: string | null;
  width: number | null;
  weight: number | null;
  machineGauge: string | null;
  machineType: string | null;
};

type JobCard = {
  id: string;
  jobCardNumber: string;
  stockReference: string;
  customerId: string;
  qualityId: string;
  orderNumber: string | null;
  customerOrderNumber: string | null;
  customerPONumber: string | null;
  orderDate: string;
  requiredByDate: string | null;
  priority: string | null;
  quantityRequired: number | string;
  quantityUnit: string | null;
  rollCount: number | null;
  targetPieceWeight: number | string | null;
  targetWidth: number | string | null;
  targetLength: number | string | null;
  targetGSM: number | string | null;
  finishType: string | null;
  dyeMethod: string | null;
  fabricColor: string | null;
  machineAssigned: string | null;
  machineGauge: string | null;
  machineSpeed: string | null;
  estimatedRunTime: number | string | null;
  setupTime: number | string | null;
  targetEfficiency: number | string | null;
  estimatedYarnRequired: number | string | null;
  yarnAllocationStatus: string | null;
  estimatedCost: number | string | null;
  sellingPrice: number | string | null;
  marginPercentage: number | string | null;
  qualityStandard: string | null;
  inspectionFrequency: string | null;
  defectTolerance: number | string | null;
  samplingRequired: boolean;
  sampleQuantity: number | null;
  slittingRequired: boolean;
  targetWidthAfterSlitting: number | string | null;
  numberOfSlits: number | null;
  finishingRequired: boolean;
  finishingInstructions: string | null;
  deliveryMethod: string | null;
  deliveryAddress: string | null;
  specialDeliveryInstructions: string | null;
  packingInstructions: string | null;
  notes: string | null;
  internalNotes: string | null;
  customerSpecialRequirements: string | null;
  qualityNotes: string | null;
  status: string;
};

const MACHINES = Array.from({ length: 11 }, (_, i) => `Machine ${i + 1}`);
const MACHINE_GAUGES = ['18', '20', '24', '26', '28', '30', '32'];
const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
const STATUSES = ['draft', 'active', 'in_production', 'completed', 'cancelled', 'on_hold'];

// Helper to convert Decimal/number/string to string for form
const toFormValue = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined) return '';
  return String(val);
};

// Helper to format date for input
const toDateValue = (val: string | null | undefined): string => {
  if (!val) return '';
  return new Date(val).toISOString().split('T')[0];
};

export default function EditJobCardPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('order');
  const [formData, setFormData] = useState({
    stockReference: '',
    customerId: '',
    customerOrderNumber: '',
    customerPONumber: '',
    orderDate: new Date().toISOString().split('T')[0],
    requiredByDate: '',
    priority: 'Normal',
    qualityId: '',
    quantityRequired: '',
    quantityUnit: 'kg',
    rollCount: '',
    targetPieceWeight: '',
    targetWidth: '',
    targetLength: '',
    targetGSM: '',
    finishType: '',
    dyeMethod: '',
    fabricColor: '',
    machineAssigned: '',
    machineGauge: '',
    machineSpeed: '',
    estimatedRunTime: '',
    setupTime: '',
    targetEfficiency: '85',
    yarnCalculationMethod: 'manual',
    estimatedYarnRequired: '',
    yarnAllocationStatus: 'pending',
    estimatedCost: '',
    sellingPrice: '',
    marginPercentage: '',
    qualityStandard: '',
    inspectionFrequency: '',
    defectTolerance: '2',
    samplingRequired: false,
    sampleQuantity: '',
    slittingRequired: false,
    targetWidthAfterSlitting: '',
    numberOfSlits: '',
    finishingRequired: false,
    finishingInstructions: '',
    deliveryMethod: 'standard',
    deliveryAddress: '',
    specialDeliveryInstructions: '',
    packingInstructions: '',
    notes: '',
    internalNotes: '',
    customerSpecialRequirements: '',
    qualityNotes: '',
    status: 'active',
    approvedBy: '',
    approvalDate: '',
  });

  // Fetch existing job card
  const { data: jobCard, isLoading: loadingJobCard } = useQuery({
    queryKey: ['job-card', id],
    queryFn: async () => {
      const res = await fetch(`/api/job-cards/${id}`);
      if (!res.ok) throw new Error('Failed to fetch job card');
      const json = await res.json();
      return json.data as JobCard;
    },
  });

  // Populate form when job card data loads
  useEffect(() => {
    if (jobCard) {
      setFormData({
        stockReference: jobCard.stockReference || '',
        customerId: jobCard.customerId || '',
        customerOrderNumber: jobCard.customerOrderNumber || '',
        customerPONumber: jobCard.customerPONumber || '',
        orderDate: toDateValue(jobCard.orderDate),
        requiredByDate: toDateValue(jobCard.requiredByDate),
        priority: jobCard.priority || 'Normal',
        qualityId: jobCard.qualityId || '',
        quantityRequired: toFormValue(jobCard.quantityRequired),
        quantityUnit: jobCard.quantityUnit || 'kg',
        rollCount: toFormValue(jobCard.rollCount),
        targetPieceWeight: toFormValue(jobCard.targetPieceWeight),
        targetWidth: toFormValue(jobCard.targetWidth),
        targetLength: toFormValue(jobCard.targetLength),
        targetGSM: toFormValue(jobCard.targetGSM),
        finishType: jobCard.finishType || '',
        dyeMethod: jobCard.dyeMethod || '',
        fabricColor: jobCard.fabricColor || '',
        machineAssigned: jobCard.machineAssigned || '',
        machineGauge: jobCard.machineGauge || '',
        machineSpeed: jobCard.machineSpeed || '',
        estimatedRunTime: toFormValue(jobCard.estimatedRunTime),
        setupTime: toFormValue(jobCard.setupTime),
        targetEfficiency: toFormValue(jobCard.targetEfficiency) || '85',
        yarnCalculationMethod: 'manual',
        estimatedYarnRequired: toFormValue(jobCard.estimatedYarnRequired),
        yarnAllocationStatus: jobCard.yarnAllocationStatus || 'pending',
        estimatedCost: toFormValue(jobCard.estimatedCost),
        sellingPrice: toFormValue(jobCard.sellingPrice),
        marginPercentage: toFormValue(jobCard.marginPercentage),
        qualityStandard: jobCard.qualityStandard || '',
        inspectionFrequency: jobCard.inspectionFrequency || '',
        defectTolerance: toFormValue(jobCard.defectTolerance) || '2',
        samplingRequired: jobCard.samplingRequired || false,
        sampleQuantity: toFormValue(jobCard.sampleQuantity),
        slittingRequired: jobCard.slittingRequired || false,
        targetWidthAfterSlitting: toFormValue(jobCard.targetWidthAfterSlitting),
        numberOfSlits: toFormValue(jobCard.numberOfSlits),
        finishingRequired: jobCard.finishingRequired || false,
        finishingInstructions: jobCard.finishingInstructions || '',
        deliveryMethod: jobCard.deliveryMethod || 'standard',
        deliveryAddress: jobCard.deliveryAddress || '',
        specialDeliveryInstructions: jobCard.specialDeliveryInstructions || '',
        packingInstructions: jobCard.packingInstructions || '',
        notes: jobCard.notes || '',
        internalNotes: jobCard.internalNotes || '',
        customerSpecialRequirements: jobCard.customerSpecialRequirements || '',
        qualityNotes: jobCard.qualityNotes || '',
        status: jobCard.status || 'active',
        approvedBy: '',
        approvalDate: '',
      });
    }
  }, [jobCard]);

  const { data: customers } = useQuery({
    queryKey: ['customers', 'active'],
    queryFn: async () => {
      const res = await fetch('/api/customers?active=true');
      if (!res.ok) throw new Error('Failed to fetch customers');
      const json = await res.json();
      return json.data as Customer[];
    },
  });

  const { data: fabricQualities } = useQuery({
    queryKey: ['fabric-quality', 'active'],
    queryFn: async () => {
      const res = await fetch('/api/fabric-quality?active=true');
      if (!res.ok) throw new Error('Failed to fetch fabric qualities');
      const json = await res.json();
      return json.data as FabricQuality[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/job-cards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          quantityRequired: parseFloat(data.quantityRequired) || 0,
          rollCount: data.rollCount ? parseInt(data.rollCount, 10) : null,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update job card');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-card', id] });
      queryClient.invalidateQueries({ queryKey: ['job-cards'] });
      toast.success('Job card updated successfully');
      router.push(`/dashboard/job-cards/${id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const selectedQuality = fabricQualities?.find(q => q.id === formData.qualityId);

  const handleQualityChange = (qualityId: string) => {
    const quality = fabricQualities?.find(q => q.id === qualityId);
    setFormData(prev => ({
      ...prev,
      qualityId,
      targetWidth: quality?.width?.toString() || prev.targetWidth,
      targetGSM: quality?.weight?.toString() || prev.targetGSM,
      machineGauge: quality?.machineGauge || prev.machineGauge,
      machineAssigned: quality?.machineType || prev.machineAssigned,
    }));
  };

  const calculateMargin = () => {
    const cost = parseFloat(formData.estimatedCost);
    const price = parseFloat(formData.sellingPrice);
    if (cost && price && price > 0) {
      const margin = ((price - cost) / price * 100).toFixed(2);
      setFormData(prev => ({ ...prev, marginPercentage: margin }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId) {
      toast.error('Please select a customer');
      setActiveTab('order');
      return;
    }
    if (!formData.qualityId) {
      toast.error('Please select a fabric quality');
      setActiveTab('fabric');
      return;
    }
    if (!formData.quantityRequired || parseFloat(formData.quantityRequired) <= 0) {
      toast.error('Please enter a valid quantity');
      setActiveTab('fabric');
      return;
    }
    if (!formData.machineAssigned) {
      toast.error('Please assign a machine');
      setActiveTab('production');
      return;
    }

    updateMutation.mutate(formData);
  };

  if (loadingJobCard) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/job-cards/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Job Card: {jobCard?.jobCardNumber}
          </h1>
          <p className="text-muted-foreground">
            Update job card details and specifications
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="order">Order Info</TabsTrigger>
            <TabsTrigger value="fabric">Fabric Spec</TabsTrigger>
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
            <TabsTrigger value="costing">Costing</TabsTrigger>
            <TabsTrigger value="finishing">Finishing</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* TAB 1: ORDER INFORMATION */}
          <TabsContent value="order" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
                <CardDescription>
                  Basic order details and customer information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="customerId">
                      Customer <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.customerId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, customerId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData({ ...formData, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="stockReference">
                      Stock Reference <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="stockReference"
                      value={formData.stockReference}
                      onChange={(e) =>
                        setFormData({ ...formData, stockReference: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customerOrderNumber">Customer Order #</Label>
                    <Input
                      id="customerOrderNumber"
                      value={formData.customerOrderNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, customerOrderNumber: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customerPONumber">Customer PO #</Label>
                    <Input
                      id="customerPONumber"
                      value={formData.customerPONumber}
                      onChange={(e) =>
                        setFormData({ ...formData, customerPONumber: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="orderDate">
                      Order Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="orderDate"
                      type="date"
                      value={formData.orderDate}
                      onChange={(e) =>
                        setFormData({ ...formData, orderDate: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="requiredByDate">Required By Date</Label>
                    <Input
                      id="requiredByDate"
                      type="date"
                      value={formData.requiredByDate}
                      onChange={(e) =>
                        setFormData({ ...formData, requiredByDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="customerSpecialRequirements">Customer Special Requirements</Label>
                  <Textarea
                    id="customerSpecialRequirements"
                    value={formData.customerSpecialRequirements}
                    onChange={(e) =>
                      setFormData({ ...formData, customerSpecialRequirements: e.target.value })
                    }
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: FABRIC SPECIFICATION */}
          <TabsContent value="fabric" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fabric Specification</CardTitle>
                <CardDescription>
                  Fabric quality, dimensions, and quantity details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="qualityId">
                    Fabric Quality <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.qualityId}
                    onValueChange={handleQualityChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fabric quality" />
                    </SelectTrigger>
                    <SelectContent>
                      {fabricQualities?.map((quality) => (
                        <SelectItem key={quality.id} value={quality.id}>
                          {quality.qualityCode}
                          {quality.description && ` - ${quality.description}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedQuality && (
                  <div className="rounded-lg border p-4 bg-muted/50 space-y-1">
                    <p className="text-sm font-medium">Selected Quality Details:</p>
                    <p className="text-xs text-muted-foreground">Code: {selectedQuality.qualityCode}</p>
                    {selectedQuality.width && (
                      <p className="text-xs text-muted-foreground">Width: {selectedQuality.width} cm</p>
                    )}
                    {selectedQuality.weight && (
                      <p className="text-xs text-muted-foreground">Weight: {selectedQuality.weight} gsm</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quantityRequired">
                      Quantity Required <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="quantityRequired"
                      type="number"
                      step="0.01"
                      value={formData.quantityRequired}
                      onChange={(e) =>
                        setFormData({ ...formData, quantityRequired: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="quantityUnit">Unit</Label>
                    <Select
                      value={formData.quantityUnit}
                      onValueChange={(value) =>
                        setFormData({ ...formData, quantityUnit: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                        <SelectItem value="meters">Meters (m)</SelectItem>
                        <SelectItem value="pieces">Pieces</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="rollCount">Number of Rolls/Pieces</Label>
                    <Input
                      id="rollCount"
                      type="number"
                      value={formData.rollCount}
                      onChange={(e) =>
                        setFormData({ ...formData, rollCount: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="targetWidth">Target Width (cm)</Label>
                    <Input
                      id="targetWidth"
                      type="number"
                      step="0.1"
                      value={formData.targetWidth}
                      onChange={(e) =>
                        setFormData({ ...formData, targetWidth: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="targetLength">Target Length (m)</Label>
                    <Input
                      id="targetLength"
                      type="number"
                      step="0.1"
                      value={formData.targetLength}
                      onChange={(e) =>
                        setFormData({ ...formData, targetLength: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="targetGSM">Target GSM</Label>
                    <Input
                      id="targetGSM"
                      type="number"
                      step="0.1"
                      value={formData.targetGSM}
                      onChange={(e) =>
                        setFormData({ ...formData, targetGSM: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fabricColor">Fabric Color</Label>
                    <Input
                      id="fabricColor"
                      value={formData.fabricColor}
                      onChange={(e) =>
                        setFormData({ ...formData, fabricColor: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="targetPieceWeight">Target Piece Weight (kg)</Label>
                    <Input
                      id="targetPieceWeight"
                      type="number"
                      step="0.1"
                      value={formData.targetPieceWeight}
                      onChange={(e) =>
                        setFormData({ ...formData, targetPieceWeight: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="finishType">Finish Type</Label>
                    <Input
                      id="finishType"
                      value={formData.finishType}
                      onChange={(e) =>
                        setFormData({ ...formData, finishType: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dyeMethod">Dye Method</Label>
                    <Input
                      id="dyeMethod"
                      value={formData.dyeMethod}
                      onChange={(e) =>
                        setFormData({ ...formData, dyeMethod: e.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: PRODUCTION DETAILS */}
          <TabsContent value="production" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Production Details</CardTitle>
                <CardDescription>
                  Machine assignment, scheduling, and yarn requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="machineAssigned">
                      Assigned Machine <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.machineAssigned}
                      onValueChange={(value) =>
                        setFormData({ ...formData, machineAssigned: value })
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
                    <Label htmlFor="machineGauge">Machine Gauge</Label>
                    <Select
                      value={formData.machineGauge}
                      onValueChange={(value) =>
                        setFormData({ ...formData, machineGauge: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gauge" />
                      </SelectTrigger>
                      <SelectContent>
                        {MACHINE_GAUGES.map((gauge) => (
                          <SelectItem key={gauge} value={gauge}>
                            {gauge} Gauge
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="machineSpeed">Machine Speed (rpm)</Label>
                    <Input
                      id="machineSpeed"
                      type="number"
                      value={formData.machineSpeed}
                      onChange={(e) =>
                        setFormData({ ...formData, machineSpeed: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="setupTime">Setup Time (hours)</Label>
                    <Input
                      id="setupTime"
                      type="number"
                      step="0.5"
                      value={formData.setupTime}
                      onChange={(e) =>
                        setFormData({ ...formData, setupTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="estimatedRunTime">Est. Run Time (hours)</Label>
                    <Input
                      id="estimatedRunTime"
                      type="number"
                      step="0.5"
                      value={formData.estimatedRunTime}
                      onChange={(e) =>
                        setFormData({ ...formData, estimatedRunTime: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="targetEfficiency">Target Efficiency (%)</Label>
                  <Input
                    id="targetEfficiency"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.targetEfficiency}
                    onChange={(e) =>
                      setFormData({ ...formData, targetEfficiency: e.target.value })
                    }
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-medium mb-3">Yarn Requirements</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="estimatedYarnRequired">Estimated Yarn Required (kg)</Label>
                      <Input
                        id="estimatedYarnRequired"
                        type="number"
                        step="0.01"
                        value={formData.estimatedYarnRequired}
                        onChange={(e) =>
                          setFormData({ ...formData, estimatedYarnRequired: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="yarnAllocationStatus">Yarn Allocation Status</Label>
                      <Select
                        value={formData.yarnAllocationStatus}
                        onValueChange={(value) =>
                          setFormData({ ...formData, yarnAllocationStatus: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="partial">Partially Allocated</SelectItem>
                          <SelectItem value="full">Fully Allocated</SelectItem>
                          <SelectItem value="ordered">Ordered from Supplier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: QUALITY CONTROL */}
          <TabsContent value="quality" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quality Control</CardTitle>
                <CardDescription>
                  Quality standards, inspection, and defect tolerance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="qualityStandard">Quality Standard</Label>
                    <Input
                      id="qualityStandard"
                      value={formData.qualityStandard}
                      onChange={(e) =>
                        setFormData({ ...formData, qualityStandard: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="inspectionFrequency">Inspection Frequency</Label>
                    <Select
                      value={formData.inspectionFrequency}
                      onValueChange={(value) =>
                        setFormData({ ...formData, inspectionFrequency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="every_piece">Every Piece</SelectItem>
                        <SelectItem value="every_5">Every 5 Pieces</SelectItem>
                        <SelectItem value="every_10">Every 10 Pieces</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="shift">Per Shift</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="defectTolerance">Defect Tolerance (%)</Label>
                  <Input
                    id="defectTolerance"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.defectTolerance}
                    onChange={(e) =>
                      setFormData({ ...formData, defectTolerance: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="samplingRequired"
                    checked={formData.samplingRequired}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, samplingRequired: checked as boolean })
                    }
                  />
                  <Label htmlFor="samplingRequired">Customer Sample Required</Label>
                </div>

                {formData.samplingRequired && (
                  <div className="grid gap-2">
                    <Label htmlFor="sampleQuantity">Sample Quantity</Label>
                    <Input
                      id="sampleQuantity"
                      value={formData.sampleQuantity}
                      onChange={(e) =>
                        setFormData({ ...formData, sampleQuantity: e.target.value })
                      }
                    />
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="qualityNotes">Quality Control Notes</Label>
                  <Textarea
                    id="qualityNotes"
                    value={formData.qualityNotes}
                    onChange={(e) =>
                      setFormData({ ...formData, qualityNotes: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: COSTING */}
          <TabsContent value="costing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Costing & Pricing</CardTitle>
                <CardDescription>
                  Cost estimation and pricing information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="estimatedCost">Estimated Cost (ZAR)</Label>
                    <Input
                      id="estimatedCost"
                      type="number"
                      step="0.01"
                      value={formData.estimatedCost}
                      onChange={(e) => {
                        setFormData({ ...formData, estimatedCost: e.target.value });
                      }}
                      onBlur={calculateMargin}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sellingPrice">Selling Price (ZAR)</Label>
                    <Input
                      id="sellingPrice"
                      type="number"
                      step="0.01"
                      value={formData.sellingPrice}
                      onChange={(e) => {
                        setFormData({ ...formData, sellingPrice: e.target.value });
                      }}
                      onBlur={calculateMargin}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="marginPercentage">Margin %</Label>
                    <div className="flex gap-2">
                      <Input
                        id="marginPercentage"
                        type="number"
                        step="0.01"
                        value={formData.marginPercentage}
                        readOnly
                        className="bg-muted"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={calculateMargin}
                      >
                        <Calculator className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 6: FINISHING & DELIVERY */}
          <TabsContent value="finishing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Slitting & Finishing</CardTitle>
                <CardDescription>
                  Post-production processing and finishing requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {formData.slittingRequired && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div className="grid gap-2">
                      <Label htmlFor="targetWidthAfterSlitting">Target Width After Slitting (cm)</Label>
                      <Input
                        id="targetWidthAfterSlitting"
                        type="number"
                        step="0.1"
                        value={formData.targetWidthAfterSlitting}
                        onChange={(e) =>
                          setFormData({ ...formData, targetWidthAfterSlitting: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="numberOfSlits">Number of Slits</Label>
                      <Input
                        id="numberOfSlits"
                        type="number"
                        value={formData.numberOfSlits}
                        onChange={(e) =>
                          setFormData({ ...formData, numberOfSlits: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="finishingRequired"
                    checked={formData.finishingRequired}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, finishingRequired: checked as boolean })
                    }
                  />
                  <Label htmlFor="finishingRequired">Additional Finishing Required</Label>
                </div>

                {formData.finishingRequired && (
                  <div className="grid gap-2 pl-6">
                    <Label htmlFor="finishingInstructions">Finishing Instructions</Label>
                    <Textarea
                      id="finishingInstructions"
                      value={formData.finishingInstructions}
                      onChange={(e) =>
                        setFormData({ ...formData, finishingInstructions: e.target.value })
                      }
                      rows={2}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Packing & Delivery</CardTitle>
                <CardDescription>
                  Packing and delivery instructions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="deliveryMethod">Delivery Method</Label>
                  <Select
                    value={formData.deliveryMethod}
                    onValueChange={(value) =>
                      setFormData({ ...formData, deliveryMethod: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Delivery</SelectItem>
                      <SelectItem value="express">Express Delivery</SelectItem>
                      <SelectItem value="pickup">Customer Pickup</SelectItem>
                      <SelectItem value="courier">Courier Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="deliveryAddress">Delivery Address</Label>
                  <Textarea
                    id="deliveryAddress"
                    value={formData.deliveryAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, deliveryAddress: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="packingInstructions">Packing Instructions</Label>
                  <Textarea
                    id="packingInstructions"
                    value={formData.packingInstructions}
                    onChange={(e) =>
                      setFormData({ ...formData, packingInstructions: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="specialDeliveryInstructions">Special Delivery Instructions</Label>
                  <Textarea
                    id="specialDeliveryInstructions"
                    value={formData.specialDeliveryInstructions}
                    onChange={(e) =>
                      setFormData({ ...formData, specialDeliveryInstructions: e.target.value })
                    }
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 7: NOTES & STATUS */}
          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notes & Additional Information</CardTitle>
                <CardDescription>
                  Internal notes and job card status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="notes">General Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="internalNotes">Internal Notes (Management Only)</Label>
                  <Textarea
                    id="internalNotes"
                    value={formData.internalNotes}
                    onChange={(e) =>
                      setFormData({ ...formData, internalNotes: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-medium mb-3">Job Card Status</h3>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.replace('_', ' ').toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center mt-6 pt-6 border-t">
          <Link href={`/dashboard/job-cards/${id}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
