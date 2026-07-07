import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGetFacultyDashboard } from '@workspace/api-client-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Clock } from 'lucide-react';

export default function FacultyDashboard() {
  const { facultyId } = useAuth();
  const { data, isLoading } = useGetFacultyDashboard({
    facultyId: facultyId!,
  });

  if (isLoading || !data) return <LoadingSkeleton type="dashboard" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Faculty Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Students" value={data.totalStudents} icon={<Users />} />
        <StatCard title="Today's Classes" value={data.todayClasses?.length || 0} icon={<Clock />} />
        <StatCard title="Pending Grading" value={data.pendingGrading} icon={<FileText />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle className="text-lg">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {data.todayClasses && data.todayClasses.length > 0 ? (
              <div className="space-y-4">
                {data.todayClasses.map((cls, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-muted/20">
                    <div className="flex flex-col items-center justify-center w-16 h-16 rounded bg-primary/10 text-primary font-semibold text-sm">
                      <span>{cls.startTime.substring(0, 5)}</span>
                    </div>
                    <div>
                      <p className="font-medium">{cls.subjectName}</p>
                      <p className="text-sm text-muted-foreground">Room {cls.room || 'TBA'} • Sem {cls.semester}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No classes scheduled for today.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle className="text-lg">Recent Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentAssignments && data.recentAssignments.length > 0 ? (
              <div className="space-y-3">
                {data.recentAssignments.slice(0, 4).map(ass => (
                  <div key={ass.id} className="p-3 border border-border rounded-lg bg-muted/10 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{ass.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{ass.subjectName}</p>
                    </div>
                    <div className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                      {ass.submissionCount || 0} Submissions
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No recent assignments.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
