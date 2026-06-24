import React, { useState } from 'react';
import { useListLeaves, useApplyLeave } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { DataTable } from '@/components/DataTable';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function StudentLeaves() {
  const { studentId } = useAuth();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    fromDate: "", toDate: "", reason: ""
  });

  const { data: leaves, isLoading } = useListLeaves({
    studentId: studentId
  });

  const createLeave = useApplyLeave({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/leaves'] });
        toast.success("Leave application submitted");
        setIsAddModalOpen(false);
        setFormData({ fromDate: "", toDate: "", reason: "" });
      }
    }
  });

  const columns = [
    { key: "dates", label: "Duration", render: (item: any) => (
      <span className="font-medium">
        {format(new Date(item.fromDate), 'MMM d')} - {format(new Date(item.toDate), 'MMM d, yyyy')}
      </span>
    )},
    { key: "reason", label: "Reason", render: (item: any) => <span className="text-sm text-muted-foreground">{item.reason}</span> },
    { key: "createdAt", label: "Applied On", render: (item: any) => <span className="text-sm text-muted-foreground">{format(new Date(item.createdAt), 'MMM d, yyyy')}</span> },
    { key: "status", label: "Status", render: (item: any) => {
        if (item.status === 'approved') return <Badge className="bg-success text-success-foreground hover:bg-success">Approved</Badge>;
        if (item.status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
        return <Badge variant="outline" className="text-warning border-warning">Pending</Badge>;
    }}
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;
    createLeave.mutate({
      data: {
        studentId,
        fromDate: new Date(formData.fromDate).toISOString(),
        toDate: new Date(formData.toDate).toISOString(),
        reason: formData.reason
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">My Leaves</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Apply for Leave
        </Button>
      </div>

      {isLoading ? <LoadingSkeleton type="table" /> : <DataTable columns={columns} data={leaves || []} emptyMessage="You haven't applied for any leaves yet." />}

      <Modal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} title="Apply for Leave">
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input type="date" required value={formData.fromDate} onChange={e => setFormData({...formData, fromDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input type="date" required value={formData.toDate} onChange={e => setFormData({...formData, toDate: e.target.value})} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea required className="min-h-[100px]" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="Please explain why you need this leave..." />
          </div>

          <div className="flex justify-end pt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createLeave.isPending}>
              {createLeave.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
