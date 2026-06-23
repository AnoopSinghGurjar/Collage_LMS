import React, { useState } from 'react';
import { useListDepartments, useCreateDepartment, useDeleteDepartment } from '@workspace/api-client-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Modal } from '@/components/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Building, Users, GraduationCap, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';

export default function AdminDepartments() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "" });

  const { data: departments, isLoading } = useListDepartments();

  const createDept = useCreateDepartment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
        toast.success("Department created");
        setIsAddModalOpen(false);
        setFormData({ name: "", code: "" });
      },
      onError: (err: any) => toast.error(err.message || "Creation failed")
    }
  });

  const deleteDept = useDeleteDepartment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
        toast.success("Department deleted");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDept.mutate({ data: formData });
  };

  if (isLoading) return <LoadingSkeleton type="dashboard" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Department
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments?.map((dept, i) => (
          <motion.div
            key={dept.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-card border-card-border overflow-hidden">
              <CardHeader className="pb-4 bg-muted/20 border-b border-border flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center">
                    <Building className="w-4 h-4 mr-2 text-primary" />
                    {dept.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Code: {dept.code}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if(confirm("Delete this department?")) deleteDept.mutate({ id: dept.id });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center"><Users className="w-4 h-4 mr-2" /> Students</span>
                  <span className="font-semibold">{dept.studentCount || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center"><GraduationCap className="w-4 h-4 mr-2" /> Faculty</span>
                  <span className="font-semibold">{dept.facultyCount || 0}</span>
                </div>
                {dept.hodName && (
                  <div className="pt-4 border-t border-border mt-4">
                    <p className="text-xs text-muted-foreground">Head of Department</p>
                    <p className="font-medium text-sm mt-1">{dept.hodName}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Modal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} title="Add Department">
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Department Name</Label>
            <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Computer Science" />
          </div>
          <div className="space-y-2">
            <Label>Department Code</Label>
            <Input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="CSE" />
          </div>
          <div className="flex justify-end pt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createDept.isPending}>
              {createDept.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
