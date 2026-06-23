import React, { useState } from 'react';
import { useListStudents, useCreateStudent, useDeleteStudent, useListDepartments } from '@workspace/api-client-react';
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

export default function AdminStudents() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("all");
  const [semester, setSemester] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "", email: "", rollNumber: "", password: "", phone: "", semester: "1", departmentId: ""
  });

  const { data, isLoading } = useListStudents({
    search: search || undefined,
    departmentId: departmentId !== "all" ? Number(departmentId) : undefined,
    semester: semester !== "all" ? Number(semester) : undefined
  });

  const { data: depts } = useListDepartments();

  const createStudent = useCreateStudent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/students'] });
        toast.success("Student created successfully");
        setIsAddModalOpen(false);
        setFormData({ name: "", email: "", rollNumber: "", password: "", phone: "", semester: "1", departmentId: "" });
      },
      onError: (err: any) => toast.error(err.message || "Failed to create student")
    }
  });

  const deleteStudent = useDeleteStudent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/students'] });
        toast.success("Student deleted");
      }
    }
  });

  const columns = [
    { key: "rollNumber", label: "Roll No" },
    { key: "name", label: "Name", render: (item: any) => <span className="font-medium">{item.name}</span> },
    { key: "email", label: "Email" },
    { key: "departmentName", label: "Department" },
    { key: "semester", label: "Semester", render: (item: any) => `Sem ${item.semester}` },
    { 
      key: "actions", 
      label: "Actions", 
      render: (item: any) => (
        <Button variant="ghost" size="icon" onClick={(e) => {
          e.stopPropagation();
          if(confirm("Are you sure?")) deleteStudent.mutate({ id: item.id });
        }}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departmentId) return toast.error("Select a department");
    createStudent.mutate({
      data: {
        ...formData,
        semester: Number(formData.semester),
        departmentId: Number(formData.departmentId)
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Students</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Student
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border border-border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email, roll no..." 
            className="pl-8" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {depts?.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.code}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={semester} onValueChange={setSemester}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingSkeleton type="table" />
      ) : (
        <DataTable 
          columns={columns} 
          data={data?.students || []} 
          emptyMessage="No students found matching your criteria."
        />
      )}

      <Modal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} title="Add New Student">
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Roll Number</Label>
              <Input required value={formData.rollNumber} onChange={e => setFormData({...formData, rollNumber: e.target.value})} />
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
              <Label>Semester</Label>
              <Select value={formData.semester} onValueChange={v => setFormData({...formData, semester: v})}>
                <SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Phone (Optional)</Label>
            <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>

          <div className="flex justify-end pt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createStudent.isPending}>
              {createStudent.isPending ? "Creating..." : "Create Student"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
