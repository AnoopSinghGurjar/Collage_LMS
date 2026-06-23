import React, { useState } from 'react';
import { useListSubjects, useCreateSubject, useDeleteSubject, useListDepartments, useListFaculty } from '@workspace/api-client-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { DataTable } from '@/components/DataTable';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminSubjects() {
  const queryClient = useQueryClient();
  const [departmentId, setDepartmentId] = useState<string>("all");
  const [semester, setSemester] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "", code: "", credits: "3", semester: "1", departmentId: "", facultyId: "none"
  });

  const { data: subjects, isLoading } = useListSubjects({
    departmentId: departmentId !== "all" ? Number(departmentId) : undefined,
    semester: semester !== "all" ? Number(semester) : undefined
  });

  const { data: depts } = useListDepartments();
  const { data: facultyList } = useListFaculty();

  const createSubject = useCreateSubject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
        toast.success("Subject created");
        setIsAddModalOpen(false);
        setFormData({ name: "", code: "", credits: "3", semester: "1", departmentId: "", facultyId: "none" });
      }
    }
  });

  const deleteSubject = useDeleteSubject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
        toast.success("Subject deleted");
      }
    }
  });

  const columns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name", render: (item: any) => <span className="font-medium">{item.name}</span> },
    { key: "credits", label: "Credits" },
    { key: "semester", label: "Semester", render: (item: any) => `Sem ${item.semester}` },
    { key: "departmentName", label: "Department" },
    { key: "facultyName", label: "Faculty", render: (item: any) => item.facultyName || <span className="text-muted-foreground italic">Unassigned</span> },
    { 
      key: "actions", 
      label: "Actions", 
      render: (item: any) => (
        <Button variant="ghost" size="icon" onClick={(e) => {
          e.stopPropagation();
          if(confirm("Delete subject?")) deleteSubject.mutate({ id: item.id });
        }}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departmentId) return toast.error("Select department");
    createSubject.mutate({
      data: {
        name: formData.name,
        code: formData.code,
        credits: Number(formData.credits),
        semester: Number(formData.semester),
        departmentId: Number(formData.departmentId),
        facultyId: formData.facultyId !== "none" ? Number(formData.facultyId) : null
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Subjects</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Subject
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border border-border">
        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {depts?.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
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

      {isLoading ? <LoadingSkeleton type="table" /> : <DataTable columns={columns} data={subjects || []} emptyMessage="No subjects found." />}

      <Modal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} title="Add New Subject">
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject Name</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Code</Label>
              <Input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Credits</Label>
              <Input type="number" min="1" max="10" required value={formData.credits} onChange={e => setFormData({...formData, credits: e.target.value})} />
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
            <Label>Department</Label>
            <Select value={formData.departmentId} onValueChange={v => setFormData({...formData, departmentId: v})}>
              <SelectTrigger><SelectValue placeholder="Select Dept" /></SelectTrigger>
              <SelectContent>
                {depts?.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assigned Faculty (Optional)</Label>
            <Select value={formData.facultyId} onValueChange={v => setFormData({...formData, facultyId: v})}>
              <SelectTrigger><SelectValue placeholder="Select Faculty" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {facultyList?.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createSubject.isPending}>
              {createSubject.isPending ? "Saving..." : "Save Subject"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
