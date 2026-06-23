import React, { useState } from 'react';
import { useListMaterials, useListSubjects } from '@workspace/api-client-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Download, FileText, Video, File, FileArchive } from 'lucide-react';
import { format } from 'date-fns';

export default function StudentMaterials() {
  const [subjectId, setSubjectId] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: subjects } = useListSubjects();
  const { data: materials, isLoading } = useListMaterials({
    subjectId: subjectId !== "all" ? Number(subjectId) : undefined,
    search: search || undefined
  });

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
      <h1 className="text-2xl font-bold tracking-tight">Resource Library</h1>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search materials..." 
            className="pl-8 bg-background" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger className="w-full sm:w-[250px] bg-background">
            <SelectValue placeholder="Filter by Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <LoadingSkeleton type="dashboard" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials?.map(material => (
            <Card key={material.id} className="bg-card border-card-border hover:border-primary/50 transition-colors flex flex-col group cursor-pointer">
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div className="flex items-start gap-3">
                  <div className="bg-muted/30 p-2 rounded-lg group-hover:bg-primary/10 transition-colors">{getIcon(material.type)}</div>
                  <div>
                    <CardTitle className="text-base line-clamp-1" title={material.title}>{material.title}</CardTitle>
                    <Badge variant="secondary" className="mt-2 text-[10px]">{material.subjectName}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-2">{material.description || "No description provided."}</p>
                <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
                  <span>By {material.uploaderName}</span>
                  <span>{format(new Date(material.createdAt!), 'MMM d, yyyy')}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-border">
                <Button variant="secondary" className="w-full group-hover:bg-primary group-hover:text-primary-foreground" onClick={() => window.open(material.fileUrl || '#', '_blank')}>
                  <Download className="h-4 w-4 mr-2" /> Download
                </Button>
              </CardFooter>
            </Card>
          ))}
          {(!materials || materials.length === 0) && (
            <div className="col-span-full text-center p-12 border border-dashed rounded-lg text-muted-foreground bg-card/30">
              No materials found. Try a different search or filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
