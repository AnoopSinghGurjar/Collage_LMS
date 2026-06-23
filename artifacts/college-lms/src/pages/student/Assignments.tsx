import React, { useState } from 'react';
import { useListAssignments } from '@workspace/api-client-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, FileText, Upload } from 'lucide-react';
import { format, isPast } from 'date-fns';

export default function StudentAssignments() {
  const { data: assignments, isLoading } = useListAssignments();
  const [tab, setTab] = useState("all");

  if (isLoading) return <LoadingSkeleton type="dashboard" />;

  const filtered = assignments?.filter(a => {
    if (tab === "all") return true;
    const isSubmitted = a.submissionCount && a.submissionCount > 0;
    if (tab === "pending") return !isSubmitted;
    if (tab === "submitted") return isSubmitted;
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>

      <Tabs defaultValue="all" value={tab} onValueChange={setTab}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(ass => {
          const isSubmitted = ass.submissionCount && ass.submissionCount > 0;
          const pastDue = isPast(new Date(ass.dueDate)) && !isSubmitted;
          
          return (
            <Card key={ass.id} className="bg-card border-card-border flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="mb-2">{ass.subjectName}</Badge>
                  {isSubmitted ? (
                    <Badge className="bg-success hover:bg-success text-success-foreground">Submitted</Badge>
                  ) : pastDue ? (
                    <Badge variant="destructive">Overdue</Badge>
                  ) : (
                    <Badge className="bg-warning hover:bg-warning text-warning-foreground">Pending</Badge>
                  )}
                </div>
                <CardTitle className="text-lg leading-tight">{ass.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">{ass.description}</p>
                
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    Due: <span className={`ml-1 font-medium ${pastDue ? 'text-destructive' : 'text-foreground'}`}>{format(new Date(ass.dueDate), 'PPP')}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <FileText className="w-4 h-4 mr-2" />
                    Max Marks: <span className="ml-1 font-medium text-foreground">{ass.maxMarks}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-border">
                {isSubmitted ? (
                  <Button variant="outline" className="w-full" disabled>View Submission</Button>
                ) : (
                  <Button className="w-full">
                    <Upload className="w-4 h-4 mr-2" /> Submit Assignment
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
        
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-card/30">
            No assignments found in this category.
          </div>
        )}
      </div>
    </div>
  );
}
