'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Plus, Search, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatWeight } from '@/lib/utils';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type JobCard = {
  id: string;
  jobCardNumber: string;
  stockReference: string;
  orderNumber: string | null;
  orderDate: string;
  quantityRequired: number;
  machineAssigned: string | null;
  status: string;
  customer: {
    name: string;
  };
  fabricQuality: {
    qualityCode: string;
  };
  _count: {
    production: number;
    yarnStock: number;
  };
  createdAt: string;
};

export default function JobCardsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['job-cards', statusFilter],
    queryFn: async () => {
      const url =
        statusFilter === 'all'
          ? '/api/job-cards'
          : `/api/job-cards?status=${statusFilter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch job cards');
      const json = await res.json();
      return json.data as JobCard[];
    },
  });

  const filteredJobCards = data?.filter(
    (jobCard) =>
      jobCard.jobCardNumber.toLowerCase().includes(search.toLowerCase()) ||
      jobCard.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      jobCard.stockReference.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Cards</h1>
          <p className="text-muted-foreground">
            Manage production job cards and orders
          </p>
        </div>
        <Link href="/dashboard/job-cards/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Job Card
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search job cards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Card #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Quality</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Production</TableHead>
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
            ) : filteredJobCards?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No job cards found
                </TableCell>
              </TableRow>
            ) : (
              filteredJobCards?.map((jobCard) => (
                <TableRow key={jobCard.id}>
                  <TableCell className="font-medium">
                    {jobCard.jobCardNumber}
                  </TableCell>
                  <TableCell>{jobCard.customer?.name ?? 'Unknown'}</TableCell>
                  <TableCell>{jobCard.fabricQuality?.qualityCode ?? 'N/A'}</TableCell>
                  <TableCell>{formatDate(jobCard.orderDate)}</TableCell>
                  <TableCell>{formatWeight(jobCard.quantityRequired)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {jobCard._count.production} pieces
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(jobCard.status)}>
                      {jobCard.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/job-cards/${jobCard.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
