import React, { useState } from 'react';
import { useListMaterials, useCreateMaterial, useDeleteMaterial, useListSubjects } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, FileText, Download, Video, File, FileArchive } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function FacultyMaterials() {
  const { facultyId } = useAuth();
  const queryClient = useQueryClient();
  const [subjectId, setSubjectId] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "", description: "", subjectId: "", type: "pdf", fileUrl: ""
  });

  const { data: subjects } = useListSubjects();
  const facultySubjects = subjects?.filter(s => s.facultyId === facultyId) || [];

  const { data: materials, isLoading } = useListMaterials({
    subjectId: subjectId !== "all" ? Number(subjectId) : undefined
  });

  const createMaterial = useCreateMaterial({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
        toast.success("Material uploaded");
        setIsAddModalOpen(false);
        setFormData({ title: "", description: "", subjectId: "", type: "pdf", fileUrl: "" });
      }
    }
  });

  const deleteMaterial = useDeleteMaterial({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
        toast.success("Material deleted");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectId) return toast.error("Select subject");
    createMaterial.mutate({
      data: {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        subjectId: Number(formData.subjectId),
        fileUrl: formData.fileUrl || "https://example.com/placeholder.pdf", // Dummy URL
        uploadedBy: facultyId!
      }
    });
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'pdf': return <FileText className="h-8 w-8 text-danger" />;
      case 'video': return <Video className="h-8 w-8 text-primary" />;
      case 'zip': return <FileArchive className="h-8 w-8 text-warning" />;
      default: return <File className="h-8 w-8 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Study Materials</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Upload Material
        </Button>
      </div>

      <div className="flex gap-4 bg-card p-4 rounded-lg border border-border w-fit">
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {facultySubjects.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <LoadingSkeleton type="dashboard" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials?.filter(m => m.uploadedBy === facultyId).map(material => (
            <Card key={material.id} className="bg-card border-card-border flex flex-col">
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div className="flex items-start gap-3">
                  <div className="bg-muted/30 p-2 rounded-lg">{getIcon(material.type)}</div>
                  <div>
                    <CardTitle className="text-base line-clamp-1" title={material.title}>{material.title}</CardTitle>
                    <Badge variant="secondary" className="mt-2 text-[10px]">{material.subjectName}</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive -mt-2 -mr-2" onClick={() => deleteMaterial.mutate({ id: material.id })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-2">{material.description || "No description provided."}</p>
                <p className="text-xs text-muted-foreground mt-4">Uploaded: {format(new Date(material.createdAt!), 'MMM d, yyyy')}</p>
              </CardContent>
              <CardFooter className="pt-4 border-t border-border">
                <Button variant="outline" className="w-full" onClick={() => window.open(material.fileUrl || '#', '_blank')}>
                  <Download className="h-4 w-4 mr-2" /> Download
                </Button>
              </CardFooter>
            </Card>
          ))}
          {(!materials || materials.filter(m => m.uploadedBy === facultyId).length === 0) && (
            <div className="col-span-full text-center p-12 border border-dashed rounded-lg text-muted-foreground bg-card/30">
              You haven't uploaded any materials yet.
            </div>
          )}
        </div>
      )}

      <Modal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} title="Upload Material">
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="E.g., Chapter 1 Notes" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={formData.subjectId} onValueChange={v => setFormData({...formData, subjectId: v})}>
                <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                <SelectContent>
                  {facultySubjects.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>File Type</Label>
              <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="video">Video Link</SelectItem>
                  <SelectItem value="doc">Word Doc</SelectItem>
                  <SelectItem value="zip">Archive (ZIP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>File URL</Label>
            <Input value={formData.fileUrl} onChange={e => setFormData({...formData, fileUrl: e.target.value})} placeholder="https://..." />
            <p className="text-xs text-muted-foreground">In a real app, this would be a file upload. Enter a URL for now.</p>
          </div>
          <div className="flex justify-end pt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMaterial.isPending}>
              {createMaterial.isPending ? "Uploading..." : "Upload Material"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
