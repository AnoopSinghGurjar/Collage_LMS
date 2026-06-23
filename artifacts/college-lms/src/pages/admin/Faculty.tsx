import React, { useState } from 'react';
import { useListFaculty, useCreateFaculty, useDeleteFaculty, useListDepartments } from '@workspace/api-client-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { DataTable } from '@/components/DataTable';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminFaculty() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "", email: "", employeeId: "", password: "", phone: "", designation: "Assistant Professor", departmentId: ""
  });

  const { data, isLoading } = useListFaculty({
    search: search || undefined,
    departmentId: departmentId !== "all" ? Number(departmentId) : undefined
  });

  const { data: depts } = useListDepartments();

  const createFaculty = useCreateFaculty({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/faculty'] });
        toast.success("Faculty member created successfully");
        setIsAddModalOpen(false);
        setFormData({ name: "", email: "", employeeId: "", password: "", phone: "", designation: "Assistant Professor", departmentId: "" });
      },
      onError: (err: any) => toast.error(err.message || "Failed to create faculty")
    }
  });

  const deleteFaculty = useDeleteFaculty({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/faculty'] });
        toast.success("Faculty member deleted");
      }
    }
  });

  const columns = [
    { key: "employeeId", label: "Emp ID" },
    { key: "name", label: "Name", render: (item: any) => <span className="font-medium">{item.name}</span> },
    { key: "email", label: "Email" },
    { key: "designation", label: "Designation" },
    { key: "departmentName", label: "Department" },
    { 
      key: "actions", 
      label: "Actions", 
      render: (item: any) => (
        <Button variant="ghost" size="icon" onClick={(e) => {
          e.stopPropagation();
          if(confirm("Are you sure?")) deleteFaculty.mutate({ id: item.id });
        }}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departmentId) return toast.error("Select a department");
    createFaculty.mutate({
      data: {
        ...formData,
        departmentId: Number(formData.departmentId)
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Faculty</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Faculty
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border border-border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email, emp id..." 
            className="pl-8" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {depts?.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingSkeleton type="table" />
      ) : (
        <DataTable 
          columns={columns} 
          data={data || []} 
          emptyMessage="No faculty found matching your criteria."
        />
      )}

      <Modal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} title="Add New Faculty">
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Employee ID</Label>
              <Input required value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={formData.departmentId} onValueChange={v => setFormData({...formData, departmentId: v})}>
                <SelectTrigger><SelectValue placeholder="Select Dept" /></SelectTrigger>
                <SelectContent>
                  {depts?.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Designation</Label>
              <Input value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Phone (Optional)</Label>
            <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>

          <div className="flex justify-end pt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createFaculty.isPending}>
              {createFaculty.isPending ? "Creating..." : "Create Faculty"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
