'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Layers } from 'lucide-react';
import { formatWeight } from '@/lib/utils';

const MACHINES = Array.from({ length: 11 }, (_, i) => `Machine ${i + 1}`);
const QUALITY_GRADES = ['Pass', 'Minor', 'Defect', 'Rework'];

type BulkProductionDialogProps = {
  jobCardId: string;
  jobCardNumber: string;
  customerName: string;
  qualityCode: string;
  defaultMachine?: string;
};

export function BulkProductionDialog({
  jobCardId,
  jobCardNumber,
  customerName,
  qualityCode,
  defaultMachine,
}: BulkProductionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [numberOfRolls, setNumberOfRolls] = useState(1);
  const [rollWeights, setRollWeights] = useState<string[]>(['']);
  const [formData, setFormData] = useState({
    productionDate: new Date().toISOString().split('T')[0],
    productionTime: new Date().toTimeString().slice(0, 5),
    machineNumber: defaultMachine || '',
    operatorName: '',
    qualityGrade: 'Pass',
    notes: '',
  });

  const queryClient = useQueryClient();

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
      setIsOpen(false);
      resetForm();
      // Reload the page to show new production entries (server component)
      window.location.reload();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setNumberOfRolls(1);
    setRollWeights(['']);
    setFormData({
      productionDate: new Date().toISOString().split('T')[0],
      productionTime: new Date().toTimeString().slice(0, 5),
      machineNumber: defaultMachine || '',
      operatorName: '',
      qualityGrade: 'Pass',
      notes: '',
    });
  };

  const handleNumberOfRollsChange = (num: number) => {
    const clamped = Math.max(1, Math.min(50, num));
    setNumberOfRolls(clamped);
    setRollWeights((prev) => {
      const newWeights = [...prev];
      while (newWeights.length < clamped) newWeights.push('');
      return newWeights.slice(0, clamped);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.machineNumber) {
      toast.error('Please select a machine (required for piece number)');
      return;
    }

    const rolls = rollWeights.map((w) => ({ weight: parseFloat(w) }));
    const invalidRolls = rolls.filter((r) => isNaN(r.weight) || r.weight <= 0);
    if (invalidRolls.length > 0) {
      toast.error('Please enter a valid weight for all rolls');
      return;
    }

    bulkCreateMutation.mutate({
      jobCardId,
      productionDate: formData.productionDate,
      productionTime: formData.productionTime,
      machineNumber: formData.machineNumber,
      operatorName: formData.operatorName,
      qualityGrade: formData.qualityGrade,
      notes: formData.notes,
      rolls,
    });
  };

  return (
    <>
      <Button onClick={() => { resetForm(); setIsOpen(true); }}>
        <Layers className="mr-2 h-4 w-4" />
        Bulk Add Rolls
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Bulk Add Production Rolls</DialogTitle>
              <DialogDescription>
                {jobCardNumber} — {customerName} ({qualityCode})
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Production Date</Label>
                  <Input
                    type="date"
                    value={formData.productionDate}
                    onChange={(e) => setFormData({ ...formData, productionDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Production Time</Label>
                  <Input
                    type="time"
                    value={formData.productionTime}
                    onChange={(e) => setFormData({ ...formData, productionTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>
                    Machine <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.machineNumber}
                    onValueChange={(value) => setFormData({ ...formData, machineNumber: value })}
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
                  <Label>Operator Name</Label>
                  <Input
                    value={formData.operatorName}
                    onChange={(e) => setFormData({ ...formData, operatorName: e.target.value })}
                    placeholder="e.g., John Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Quality Grade</Label>
                  <Select
                    value={formData.qualityGrade}
                    onValueChange={(value) => setFormData({ ...formData, qualityGrade: value })}
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
                  <Label>
                    Number of Rolls <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={numberOfRolls}
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
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Any issues, observations, or comments..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
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
    </>
  );
}
