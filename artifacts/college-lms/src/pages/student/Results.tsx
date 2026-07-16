import React, { useState } from 'react';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useListResults } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/DataTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function StudentResults() {
  const { studentId } = useAuth();
  const [semester, setSemester] = useState<string>("all");
  const [academicSession, setAcademicSession] = useState("2026-27");

  const { data: results, isLoading } = useListResults({
    studentId,

    academicSession,

    published: true,

    semester:
      semester !== "all"
        ? Number(semester)
        : undefined,
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

  const downloadResultPDF = () => {

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("SkyCode LMS", 14, 18);

    doc.setFontSize(14);
    doc.text("Student Result", 14, 28);

    doc.setFontSize(11);
    doc.text(`Academic Session : ${academicSession}`, 14, 38);

    doc.text(
      `Semester : ${semester === "all" ? "All" : semester}`,
      14,
      45
    );

    autoTable(doc, {
      startY: 55,

      head: [[
        "Subject",
        "Internal",
        "External",
        "Total",
        "Grade",
        "Status",
      ]],

      body: (results || []).map((r) => [
        String(r.subjectName ?? ""),
        String(r.internalMarks ?? ""),
        String(r.externalMarks ?? ""),
        String(r.totalMarks ?? ""),
        String(r.grade ?? ""),
        r.passed ? "PASS" : "FAIL",
      ] as string[]),
    });

    const percentage =
      results && results.length > 0
        ? (
          results.reduce(
            (sum, r) => sum + Number(r.totalMarks),
            0
          ) / results.length
        ).toFixed(2)
        : "0";

    const finalY =
      (doc as any).lastAutoTable.finalY + 12;

    doc.text(`SGPA : ${sgpa}`, 14, finalY);

    doc.text(
      `Average Percentage : ${percentage}%`,
      14,
      finalY + 8
    );

    doc.save("Student_Result.pdf");

  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Academic Results</h1>

      <div className="flex flex-wrap items-center gap-4 mb-6">

        <div>

          <Label>Academic Session</Label>

          <Select
            value={academicSession}
            onValueChange={setAcademicSession}
          >

            <SelectTrigger className="w-44">

              <SelectValue />

            </SelectTrigger>

            <SelectContent>

              <SelectItem value="2026-27">
                2026-27
              </SelectItem>

              <SelectItem value="2027-28">
                2027-28
              </SelectItem>

            </SelectContent>

          </Select>

          <Button onClick={downloadResultPDF}>
            Download PDF
          </Button>

        </div>

        <div>

          <Label>Semester</Label>

          <Select
            value={semester}
            onValueChange={setSemester}
          >

            <SelectTrigger className="w-44">

              <SelectValue placeholder="Semester" />

            </SelectTrigger>

            <SelectContent>

              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (

                <SelectItem
                  key={sem}
                  value={String(sem)}
                >
                  Semester {sem}
                </SelectItem>

              ))}

            </SelectContent>

          </Select>

        </div>

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
