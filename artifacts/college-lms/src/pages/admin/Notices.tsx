import React, { useState } from 'react';
import { useListNotices, useCreateNotice, useDeleteNotice, useListDepartments } from '@workspace/api-client-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Pin, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function AdminNotices() {
  const queryClient = useQueryClient();
  const [departmentId, setDepartmentId] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "", content: "", isPinned: false, departmentId: "none", semester: "none"
  });

  const { data: notices, isLoading } = useListNotices({
    departmentId: departmentId !== "all" ? Number(departmentId) : undefined,
  });

  const { data: depts } = useListDepartments();

  const createNotice = useCreateNotice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/notices'] });
        toast.success("Notice created");
        setIsAddModalOpen(false);
        setFormData({ title: "", content: "", isPinned: false, departmentId: "none", semester: "none" });
      }
    }
  });

  const deleteNotice = useDeleteNotice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/notices'] });
        toast.success("Notice deleted");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createNotice.mutate({
      data: {
        title: formData.title,
        content: formData.content,
        isPinned: formData.isPinned,
        departmentId: formData.departmentId !== "none" ? Number(formData.departmentId) : null,
        semester: formData.semester !== "none" ? Number(formData.semester) : null,
        createdBy: 1 // Hardcoded to admin since auth doesn't provide it strictly yet, but the API might read from token in reality. We provide it as required.
      }
    });
  };

  if (isLoading) return <LoadingSkeleton type="dashboard" />;

  const pinnedNotices = notices?.filter(n => n.isPinned) || [];
  const normalNotices = notices?.filter(n => !n.isPinned) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Notice Board</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Create Notice
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border border-border w-fit">
        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {depts?.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {[...pinnedNotices, ...normalNotices].map(notice => (
          <Card key={notice.id} className={`bg-card border-card-border overflow-hidden ${notice.isPinned ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}>
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {notice.isPinned && <Pin className="h-4 w-4 text-primary fill-primary" />}
                  <CardTitle className="text-lg">{notice.title}</CardTitle>
                </div>
                <CardDescription className="flex items-center gap-4 text-xs">
                  <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {format(new Date(notice.createdAt), 'PP p')}</span>
                  {notice.departmentName && <Badge variant="secondary" className="text-[10px]">{notice.departmentName}</Badge>}
                  {notice.semester && <Badge variant="outline" className="text-[10px]">Sem {notice.semester}</Badge>}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteNotice.mutate({ id: notice.id })}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap text-card-foreground leading-relaxed">{notice.content}</p>
              <div className="mt-4 text-xs text-muted-foreground">
                Posted by <span className="font-medium text-foreground">{notice.createdByName || 'Admin'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!notices || notices.length === 0) && (
          <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground">
            No notices found.
          </div>
        )}
      </div>

      <Modal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} title="Create Notice">
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="E.g., Mid-Term Exam Schedule" />
          </div>
          
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea required className="min-h-[120px]" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Department</Label>
              <Select value={formData.departmentId} onValueChange={v => setFormData({...formData, departmentId: v})}>
                <SelectTrigger><SelectValue placeholder="All Departments" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All Departments</SelectItem>
                  {depts?.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Semester</Label>
              <Select value={formData.semester} onValueChange={v => setFormData({...formData, semester: v})}>
                <SelectTrigger><SelectValue placeholder="All Semesters" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All Semesters</SelectItem>
                  {[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch id="pin" checked={formData.isPinned} onCheckedChange={c => setFormData({...formData, isPinned: c})} />
            <Label htmlFor="pin">Pin to top</Label>
          </div>

          <div className="flex justify-end pt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createNotice.isPending}>
              {createNotice.isPending ? "Posting..." : "Post Notice"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
