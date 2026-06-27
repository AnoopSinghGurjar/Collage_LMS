import AttendanceCalendar from "@/components/AttendanceCalendar";
import React, { useEffect, useState } from 'react';
import { useGetStudentDashboard } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Cell, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Clock3,
  Circle
} from "lucide-react";

export default function StudentAttendance() {
  const { studentId } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const { data, isLoading } = useGetStudentDashboard(
    { studentId: studentId! },
    { query: { enabled: !!studentId } }
  );

  const attendanceMap = new Map<string, string>();

  history.forEach((item: any) => {
    if (
      !attendanceMap.has(item.date) ||
      item.status === "absent"
    ) {
      attendanceMap.set(item.date, item.status);
    }
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const tileContent = ({ date, view }: any) => {

    if (view !== "month") return null;

    const key = date.toISOString().split("T")[0];

    const status = attendanceMap.get(key);

    if (!status) return null;

    return (
      <div className="flex justify-center mt-1">

        <div
          className={`w-2.5 h-2.5 rounded-full ${status === "present"
            ? "bg-green-500"
            : status === "late"
              ? "bg-yellow-500"
              : "bg-red-500"
            }`}
        />

      </div>
    );
  };

  useEffect(() => {
    if (!studentId) return;

    fetch(
      `http://localhost:3000/api/attendance/student-history?studentId=${studentId}`
    )
      .then((res) => res.json())
      .then((data) => {
        setHistory(data);
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  }, [studentId]);

  if (isLoading || !data) return <LoadingSkeleton type="dashboard" />;

  const subjectAttendance = data.subjectAttendance || [];

  function formatTimelineDate(date: string) {

    const today = new Date();

    const yesterday = new Date();

    yesterday.setDate(today.getDate() - 1);

    const d = new Date(date);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    }

    if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const filteredHistory = selectedDate
    ? history.filter((item: any) => item.date === selectedDate)
    : history;

  const groupedHistory = filteredHistory.reduce(
    (acc: Record<string, any[]>, item: any) => {
      if (!acc[item.date]) {
        acc[item.date] = [];
      }

      acc[item.date].push(item);

      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          My Attendance
        </h1>

        <Button
          onClick={() =>
            window.open(
              `http://localhost:3000/api/attendance/export-pdf?studentId=${studentId}`,
              "_blank"
            )
          }
        >
          Download PDF
        </Button>
      </div>

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
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Attendance Requirement</CardTitle>
          <CardDescription>
            Eligibility Status
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              Current Attendance
            </span>

            <span className="text-2xl font-bold">
              {data.attendanceRequirement.current}%
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all ${data.attendanceRequirement.current >= 75
                ? "bg-green-500"
                : "bg-red-500"
                }`}
              style={{
                width: `${Math.min(
                  data.attendanceRequirement.current,
                  100
                )}%`,
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Total Classes
              </p>

              <p className="text-2xl font-bold">
                {data.attendanceRequirement.totalClasses}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Present Classes
              </p>

              <p className="text-2xl font-bold">
                {data.attendanceRequirement.presentClasses}
              </p>
            </div>

          </div>

          {data.attendanceRequirement.current >= 75 ? (

            <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-4">
              <p className="font-semibold text-green-600">
                ✅ Eligible for Exams
              </p>
            </div>

          ) : (

            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4">

              <p className="font-semibold text-red-600">

                Need

                <span className="mx-2 font-bold">

                  {data.attendanceRequirement.classesNeeded}

                </span>

                more Present Classes to reach 75%.

              </p>

            </div>

          )}

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
                      <Cell key={`cell-${index}`} fill={entry.percentage >= 75 ? "hsl(var(--success))" : entry.percentage >= 65 ? "hsl(var(--warning))" : "hsl(var(--destructive))"} />
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
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${sub.percentage >= 75 ? 'bg-success/20 text-success' :
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

      <AttendanceCalendar
        history={history}
        onDateSelect={(date) => setSelectedDate(date)}
      />

      <Card className="border-border bg-card">

        <CardHeader className="flex flex-row items-center justify-between">

          <div>

            <div>
              <CardTitle>
                Attendance History
              </CardTitle>

              <CardDescription>
                Day-wise attendance records
              </CardDescription>
            </div>

          </div>

          {selectedDate && (

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(null)}
            >
              Show All
            </Button>

          )}

        </CardHeader>

        <CardContent>

          {historyLoading ? (

            <div className="py-10 text-center">

              Loading attendance history...

            </div>

          ) : Object.keys(groupedHistory).length === 0 ? (

            <div className="py-10 text-center text-muted-foreground">

              No attendance history found.

            </div>

          ) : (

            <div className="space-y-8">

              {Object.entries(groupedHistory).map(
                ([date, records]) => (

                  <div
                    key={date}
                    className="space-y-4"
                  >

                    <div className="flex items-center gap-3">

                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">

                        📅

                      </div>

                      <div>

                        <h3 className="font-bold text-lg">

                          {formatTimelineDate(date)}

                        </h3>

                        <p className="text-sm text-muted-foreground">

                          Attendance Records

                        </p>

                      </div>

                    </div>

                    <div className="relative ml-8 space-y-4">
                      <div className="absolute left-[-18px] top-0 bottom-0 w-[2px] bg-border"></div>

                      {(records as any[]).map((item) => (

                        <div
                          key={item.id}
                          className="relative flex items-center justify-between rounded-xl border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all"
                        >

                          {/* Timeline Dot */}

                          <div className="absolute -left-[42px] top-7 z-10">
                            <Circle className="h-4 w-4 fill-primary text-primary" />
                          </div>

                          {/* Subject */}

                          <div className="space-y-1">

                            <h4 className="font-semibold text-base">

                              {item.subjectName}

                            </h4>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">

                              <span className="font-medium">

                                {item.subjectCode}

                              </span>

                              <span>

                                🕘 {item.startTime} - {item.endTime}

                              </span>

                              <span>

                                👨‍🏫 {item.facultyName}

                              </span>

                            </div>

                          </div>

                          {/* Status */}

                          <div>

                            {item.status === "present" && (
                              <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-green-500">
                                <CheckCircle2 className="h-4 w-4" />
                                Present
                              </div>
                            )}

                            {item.status === "absent" && (
                              <div className="flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-red-500">
                                <XCircle className="h-4 w-4" />
                                Absent
                              </div>
                            )}

                            {item.status === "late" && (
                              <div className="flex items-center gap-2 rounded-full bg-yellow-500/10 px-3 py-1 text-yellow-500">
                                <Clock3 className="h-4 w-4" />
                                Late
                              </div>
                            )}

                          </div>

                        </div>
                      ))}

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </CardContent>

      </Card>


    </div>
  );
}
