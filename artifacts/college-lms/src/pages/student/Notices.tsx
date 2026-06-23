import React from 'react';
import { useListNotices } from '@workspace/api-client-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pin, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function StudentNotices() {
  const { data: notices, isLoading } = useListNotices();

  if (isLoading) return <LoadingSkeleton type="dashboard" />;

  const pinnedNotices = notices?.filter(n => n.isPinned) || [];
  const normalNotices = notices?.filter(n => !n.isPinned) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Notice Board</h1>
      
      <div className="space-y-4">
        {[...pinnedNotices, ...normalNotices].map(notice => (
          <Card key={notice.id} className={`bg-card border-card-border overflow-hidden ${notice.isPinned ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 mb-1">
                {notice.isPinned && <Pin className="h-4 w-4 text-primary fill-primary" />}
                <CardTitle className="text-lg leading-tight">{notice.title}</CardTitle>
              </div>
              <CardDescription className="flex items-center gap-4 text-xs">
                <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {format(new Date(notice.createdAt), 'PP p')}</span>
                {notice.departmentName && <Badge variant="secondary" className="text-[10px]">{notice.departmentName}</Badge>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap text-card-foreground leading-relaxed">{notice.content}</p>
            </CardContent>
          </Card>
        ))}
        {(!notices || notices.length === 0) && (
          <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground">
            No notices available at the moment.
          </div>
        )}
      </div>
    </div>
  );
}
