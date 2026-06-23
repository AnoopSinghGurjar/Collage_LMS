import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGetStudentDashboard } from '@workspace/api-client-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, BookOpen, Clock, Bell } from 'lucide-react';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { format } from 'date-fns';

export default function StudentDashboard() {
  const { studentId } = useAuth();
  const { data, isLoading } = useGetStudentDashboard(
    { studentId: studentId! }, 
    { query: { enabled: !!studentId } }
  );

  if (isLoading || !data) return <LoadingSkeleton type="dashboard" />;

  const attendanceData = [{ name: 'Attendance', value: data.attendanceOverall, fill: 'hsl(var(--primary))' }];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Welcome back, {data.student.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-card-border flex flex-col items-center justify-center p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Overall Attendance</h3>
          <div className="h-[150px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={20} data={attendanceData} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: 'hsl(var(--muted))' }} dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute flex items-center justify-center flex-col">
              <span className="text-3xl font-bold">{data.attendanceOverall}%</span>
            </div>
          </div>
        </Card>

        <Card className="md:col-span-2 bg-card border-card-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center"><Clock className="w-4 h-4 mr-2 text-primary" /> Today's Classes</CardTitle>
          </CardHeader>
          <CardContent>
            {data.todayClasses && data.todayClasses.length > 0 ? (
              <div className="space-y-4">
                {data.todayClasses.map((cls, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-muted/20">
                    <div className="flex flex-col items-center justify-center w-16 h-16 rounded bg-primary/10 text-primary font-semibold text-sm">
                      <span>{cls.startTime.substring(0,5)}</span>
                    </div>
                    <div>
                      <p className="font-medium">{cls.subjectName}</p>
                      <p className="text-sm text-muted-foreground">Room {cls.room || 'TBA'} • {cls.facultyName}</p>
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
            <CardTitle className="text-lg flex items-center"><BookOpen className="w-4 h-4 mr-2 text-primary" /> Upcoming Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingAssignments && data.upcomingAssignments.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingAssignments.slice(0,3).map(ass => (
                  <div key={ass.id} className="p-3 border border-border rounded-lg bg-muted/10">
                    <p className="font-medium text-sm">{ass.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">Due: {format(new Date(ass.dueDate), 'MMM d, yyyy')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No upcoming assignments.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
