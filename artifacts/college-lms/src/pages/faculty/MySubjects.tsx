import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface Subject {
  id: number;
  name: string;
  code: string;
  credits: number;
  semester: number;
  departmentName: string;
  totalStudents: number;
}

export default function FacultyMySubjects() {
  const { facultyId } = useAuth();
  const [, setLocation] = useLocation();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!facultyId) return;

    fetch(
      `http://localhost:3000/api/faculty/my-subjects?facultyId=${facultyId}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setSubjects(data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [facultyId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Subjects</h1>

        <div className="rounded-lg border bg-card p-8 text-center">
          Loading faculty subjects...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Subjects</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="rounded-xl border bg-card p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold">
              {subject.name}
            </h2>

            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>Code : {subject.code}</p>
              <p>Semester : {subject.semester}</p>
              <p>Credits : {subject.credits}</p>
              <p>Department : {subject.departmentName}</p>
              <p>Students : {subject.totalStudents}</p>
            </div>
            <Button
  className="w-full mt-5"
  onClick={() =>
    setLocation(
      `/faculty/attendance?subjectId=${subject.id}`
    )
  }
>
  Take Attendance
</Button>
          </div>
        ))}
      </div>
    </div>
  );
}