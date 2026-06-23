import React from 'react';
import { useGetStudentDashboard } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function StudentAttendance() {
  const { studentId } = useAuth();
  const { data, isLoading } = useGetStudentDashboard(
    { studentId: studentId! }, 
    { query: { enabled: !!studentId } }
  );

  if (isLoading || !data) return <LoadingSkeleton type="dashboard" />;

  const subjectAttendance = data.subjectAttendance || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">My Attendance</h1>

      <Card className="bg-primary border-primary/20 overflow-hidden text-primary-foreground">
        <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 relative">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="space-y-2 z-10 text-center md:text-left">
            <h2 className="text-3xl font-bold">Overall Attendance</h2>
            <p className="text-primary-foreground/80 max-w-md">
              Your aggregated attendance across all subjects this semester. Maintain above 75% to be eligible for final exams.
            </p>
          </div>
          <div className="z-10 flex items-baseline gap-1">
            <span className="text-6xl md:text-8xl font-black">{data.attendanceOverall}</span>
            <span className="text-2xl font-bold opacity-80">%</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle>Subject-wise Overview</CardTitle>
            <CardDescription>Your attendance percentage per subject</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {subjectAttendance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="subjectName" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip 
                    cursor={{ fill: "hsl(var(--muted))" }}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(value: number) => [`${value}%`, 'Attendance']}
                  />
                  <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                    {subjectAttendance.map((entry, index) => (
                      <cell key={`cell-${index}`} fill={entry.percentage >= 75 ? "hsl(var(--success))" : entry.percentage >= 65 ? "hsl(var(--warning))" : "hsl(var(--destructive))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No attendance records found</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle>Detailed Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjectAttendance.map((sub, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-border bg-muted/10">
                  <div>
                    <p className="font-medium text-sm">{sub.subjectName}</p>
                    <p className="text-xs text-muted-foreground">{sub.attended} / {sub.totalClasses} classes attended</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    sub.percentage >= 75 ? 'bg-success/20 text-success' : 
                    sub.percentage >= 65 ? 'bg-warning/20 text-warning' : 
                    'bg-destructive/20 text-destructive'
                  }`}>
                    {sub.percentage}%
                  </div>
                </div>
              ))}
              {subjectAttendance.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No data available.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
