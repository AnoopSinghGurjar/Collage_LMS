import React, { useState } from 'react';
import { useListResults } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/DataTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from "@/components/ui/label";

export default function StudentResults() {
  const { studentId } = useAuth();
  const [semester, setSemester] = useState<string>("all");

  const { data: results, isLoading } = useListResults({
    studentId: studentId,
    semester: semester !== "all" ? Number(semester) : undefined
  });

  const getGradeColor = (grade: string) => {
    if (['O', 'A+', 'A'].includes(grade)) return 'bg-success/20 text-success border-success/30';
    if (['B+', 'B'].includes(grade)) return 'bg-primary/20 text-primary border-primary/30';
    if (['C'].includes(grade)) return 'bg-warning/20 text-warning border-warning/30';
    return 'bg-destructive/20 text-destructive border-destructive/30';
  };

  const columns = [
    { key: "subjectName", label: "Subject", render: (item: any) => <span className="font-medium">{item.subjectName}</span> },
    { key: "semester", label: "Semester" },
    { key: "internalMarks", label: "Internal", render: (item: any) => <span className="text-muted-foreground">{item.internalMarks}</span> },
    { key: "externalMarks", label: "External", render: (item: any) => <span className="text-muted-foreground">{item.externalMarks}</span> },
    { key: "totalMarks", label: "Total", render: (item: any) => <span className="font-semibold">{item.totalMarks}</span> },
    {
      key: "grade", label: "Grade", render: (item: any) => (
        <Badge variant="outline" className={`font-bold px-2 py-0.5 ${getGradeColor(item.grade)}`}>
          {item.grade}
        </Badge>
      )
    },
    {
      key: "status", label: "Status", render: (item: any) => (
        <span className={`text-sm font-semibold ${item.passed ? 'text-success' : 'text-destructive'}`}>
          {item.passed ? 'PASS' : 'FAIL'}
        </span>
      )
    }
  ];

  // Calculate SGPA roughly
  const sgpa = results && results.length > 0
    ? (results.reduce((acc, r) => {
      let pts = 0;
      if (r.grade === 'O') pts = 10; else if (r.grade === 'A+') pts = 9; else if (r.grade === 'A') pts = 8;
      else if (r.grade === 'B+') pts = 7; else if (r.grade === 'B') pts = 6; else if (r.grade === 'C') pts = 5;
      return acc + pts;
    }, 0) / results.length).toFixed(2)
    : "N/A";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Academic Results</h1>

      <div className="flex items-center gap-4 mb-6">

        <Label>Semester</Label>

        <select
          className="h-10 rounded-md border border-input bg-background px-3"
          value={semester}
          onChange={(e) =>
            setSemester(e.target.value)
          }
        >

          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (

            <option
              key={sem}
              value={sem}
            >
              Semester {sem}
            </option>

          ))}

        </select>

      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Card className="bg-card border-card-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current SGPA</div>
            <div className="text-2xl font-black text-primary">{sgpa}</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? <LoadingSkeleton type="table" /> : <DataTable columns={columns} data={results || []} emptyMessage="No results published yet." />}
    </div>
  );
}
