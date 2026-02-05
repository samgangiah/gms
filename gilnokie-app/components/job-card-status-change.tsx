'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { ChevronDown, Play, CheckCircle, XCircle, Pause, FileText, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const statusConfig = {
  draft: {
    label: 'Draft',
    icon: FileText,
    color: 'outline' as const,
    description: 'Job card is in draft mode',
  },
  active: {
    label: 'Active',
    icon: Play,
    color: 'default' as const,
    description: 'Ready for production',
  },
  in_production: {
    label: 'In Production',
    icon: Play,
    color: 'default' as const,
    description: 'Currently being produced',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'secondary' as const,
    description: 'Production finished',
  },
  on_hold: {
    label: 'On Hold',
    icon: Pause,
    color: 'outline' as const,
    description: 'Temporarily paused',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'destructive' as const,
    description: 'Job card cancelled',
  },
};

type Status = keyof typeof statusConfig;

interface JobCardStatusChangeProps {
  jobCardId: string;
  currentStatus: Status;
  jobCardNumber: string;
}

export function JobCardStatusChange({
  jobCardId,
  currentStatus,
  jobCardNumber,
}: JobCardStatusChangeProps) {
  const [pendingStatus, setPendingStatus] = useState<Status | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: async (newStatus: Status) => {
      const res = await fetch(`/api/job-cards/${jobCardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update status');
      }
      return res.json();
    },
    onSuccess: (_, newStatus) => {
      toast.success(`Status updated to ${statusConfig[newStatus].label}`);
      queryClient.invalidateQueries({ queryKey: ['job-cards'] });
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleStatusSelect = (newStatus: Status) => {
    if (newStatus === currentStatus) return;

    // Require confirmation for certain transitions
    const isCancelling = newStatus === 'cancelled';
    const isCompleting = newStatus === 'completed';
    const isUncompleting = currentStatus === 'completed';
    const needsConfirmation = isCancelling || isCompleting || isUncompleting;

    if (needsConfirmation) {
      setPendingStatus(newStatus);
      setShowConfirmDialog(true);
    } else {
      statusMutation.mutate(newStatus);
    }
  };

  const handleConfirm = () => {
    if (pendingStatus) {
      statusMutation.mutate(pendingStatus);
    }
    setShowConfirmDialog(false);
    setPendingStatus(null);
  };

  const currentConfig = statusConfig[currentStatus];
  const StatusIcon = currentConfig.icon;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2" disabled={statusMutation.isPending}>
            {statusMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <StatusIcon className="h-4 w-4" />
            )}
            <Badge variant={currentConfig.color}>
              {currentConfig.label}
            </Badge>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(Object.keys(statusConfig) as Status[]).map((status) => {
            const config = statusConfig[status];
            const Icon = config.icon;
            const isCurrentStatus = status === currentStatus;

            return (
              <DropdownMenuItem
                key={status}
                onClick={() => handleStatusSelect(status)}
                className={isCurrentStatus ? 'bg-muted' : ''}
                disabled={isCurrentStatus}
              >
                <Icon className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{config.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {config.description}
                  </span>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatus === 'cancelled' && (
                <>
                  Are you sure you want to cancel job card <strong>{jobCardNumber}</strong>?
                  This action indicates the job is no longer needed.
                </>
              )}
              {pendingStatus === 'completed' && (
                <>
                  Are you sure you want to mark job card <strong>{jobCardNumber}</strong> as completed?
                  This indicates all production is finished.
                </>
              )}
              {pendingStatus && pendingStatus !== 'cancelled' && pendingStatus !== 'completed' && (
                <>
                  Change the status of <strong>{jobCardNumber}</strong> from{' '}
                  <strong>{statusConfig[currentStatus].label}</strong> to{' '}
                  <strong>{statusConfig[pendingStatus].label}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatus(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
