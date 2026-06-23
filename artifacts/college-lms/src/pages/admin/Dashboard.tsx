import React from 'react';
import { useGetAdminDashboard } from '@workspace/api-client-react';
import { StatCard } from '@/components/StatCard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Users, GraduationCap, Building2, CheckSquare, Calendar, Bell } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { data, isLoading } = useGetAdminDashboard();

  if (isLoading || !data) return <LoadingSkeleton type="dashboard" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Students" 
          value={data.totalStudents} 
          icon={<Users />} 
        />
        <StatCard 
          title="Total Faculty" 
          value={data.totalFaculty} 
          icon={<GraduationCap />} 
        />
        <StatCard 
          title="Departments" 
          value={data.totalDepartments} 
          icon={<Building2 />} 
        />
        <StatCard 
          title="Attendance Rate" 
          value={`${data.attendanceRate || 0}%`} 
          icon={<CheckSquare />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card border-card-border">
          <CardHeader>
            <CardTitle className="text-lg">Department Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {data.departmentBreakdown && data.departmentBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.departmentBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="departmentName" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip 
                    cursor={{ fill: "hsl(var(--muted))" }}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                  />
                  <Bar dataKey="studentCount" name="Students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="facultyCount" name="Faculty" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card border-card-border h-[190px] overflow-hidden flex flex-col">
            <CardHeader className="py-3 px-4 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center">
                <Bell className="w-4 h-4 mr-2 text-primary" /> Recent Notices
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-auto flex-1">
              {data.recentNotices && data.recentNotices.length > 0 ? (
                <div className="divide-y divide-border">
                  {data.recentNotices.slice(0, 3).map(notice => (
                    <div key={notice.id} className="p-3 hover:bg-muted/50 transition-colors">
                      <h4 className="text-sm font-medium truncate">{notice.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(notice.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No recent notices</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-card-border h-[190px] overflow-hidden flex flex-col">
            <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-primary" /> Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-auto flex-1">
              {data.upcomingEvents && data.upcomingEvents.length > 0 ? (
                <div className="divide-y divide-border">
                  {data.upcomingEvents.slice(0, 3).map(event => (
                    <div key={event.id} className="p-3 hover:bg-muted/50 transition-colors">
                      <h4 className="text-sm font-medium truncate">{event.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(event.startDate), 'MMM d, yyyy')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No upcoming events</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
