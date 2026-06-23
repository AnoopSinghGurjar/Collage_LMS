import React, { useState } from 'react';
import { useListLeaves, useUpdateLeaveStatus } from '@workspace/api-client-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function AdminLeaves() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>("pending");

  const { data: leaves, isLoading } = useListLeaves({
    status: status !== "all" ? status : undefined
  });

  const updateLeave = useUpdateLeaveStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/leaves'] });
        toast.success("Leave status updated");
      }
    }
  });

  const handleUpdate = (id: number, newStatus: string) => {
    updateLeave.mutate({ id, data: { status: newStatus, reviewedBy: 1 } });
  };

  const columns = [
    { key: "studentName", label: "Student", render: (item: any) => <span className="font-medium">{item.studentName}</span> },
    { key: "dates", label: "Duration", render: (item: any) => (
      <span className="text-sm">
        {format(new Date(item.fromDate), 'MMM d')} - {format(new Date(item.toDate), 'MMM d, yyyy')}
      </span>
    )},
    { key: "reason", label: "Reason", render: (item: any) => <span className="text-sm text-muted-foreground truncate max-w-[200px] block" title={item.reason}>{item.reason}</span> },
    { key: "status", label: "Status", render: (item: any) => {
        if (item.status === 'approved') return <Badge className="bg-success text-success-foreground hover:bg-success">Approved</Badge>;
        if (item.status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
        return <Badge variant="outline" className="text-warning border-warning">Pending</Badge>;
    }},
    { 
      key: "actions", 
      label: "Actions", 
      render: (item: any) => (
        item.status === 'pending' ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 text-success hover:text-success hover:bg-success/10 border-success/20" onClick={() => handleUpdate(item.id, 'approved')}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" onClick={() => handleUpdate(item.id, 'rejected')}>
              <XCircle className="h-4 w-4 mr-1" /> Reject
            </Button>
          </div>
        ) : <span className="text-xs text-muted-foreground">Reviewed</span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Leave Requests</h1>
      </div>

      <div className="flex gap-4 bg-card p-4 rounded-lg border border-border w-fit">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <LoadingSkeleton type="table" /> : <DataTable columns={columns} data={leaves || []} emptyMessage="No leave requests found." />}
    </div>
  );
}
