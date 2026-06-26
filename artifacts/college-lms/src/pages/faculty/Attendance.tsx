import React, { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";

interface Student {
    studentId: number;
    name: string;
    rollNumber: string;
}

export default function FacultyAttendance() {
    const search = useSearch();

    const subjectId = new URLSearchParams(search).get("subjectId");

    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    useEffect(() => {
        if (!subjectId) return;

        fetch(
            `http://localhost:3000/api/attendance/students?subjectId=${subjectId}`
        )
            .then((res) => res.json())
            .then((data) => {
                setStudents(data);
            })
            .finally(() => setLoading(false));
    }, [subjectId]);

    useEffect(() => {
  if (!subjectId) return;

  fetch(
    `http://localhost:3000/api/attendance/history?subjectId=${subjectId}&date=${selectedDate}`
  )
    .then((res) => res.json())
    .then((history) => {
      const map: Record<number, string> = {};

      history.forEach((item: any) => {
        map[item.studentId] = item.status;
      });

      setAttendance(map);
    });
}, [subjectId, selectedDate]);

    const saveAttendance = async () => {
        try {
            const payload = students.map((student) => ({
                studentId: student.studentId,
                status: attendance[student.studentId] || "present",
            }));

            const response = await fetch(
                "http://localhost:3000/api/attendance/bulk",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        subjectId: Number(subjectId),
                        markedBy: 1,
                        date: selectedDate,
                        attendance: payload,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed");
            }

            alert(`Attendance Saved (${data.total} students)`);
        } catch (err) {
            console.error(err);
            alert("Attendance save failed");
        }
    };

    if (loading) {
        return <div>Loading students...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">
                Take Attendance
            </h1>
            <div className="flex items-center gap-3">
                <label className="font-medium">
                    Attendance Date
                </label>

                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border rounded-md px-3 py-2 bg-background"
                />
            </div>

            <table className="w-full border rounded-lg overflow-hidden">
                <thead>
                    <tr className="border-b bg-muted">
                        <th className="p-3 text-left">Roll No</th>
                        <th className="p-3 text-left">Student Name</th>
                        <th className="p-3 text-left">Status</th>
                    </tr>
                </thead>

                <tbody>
                    {students.map((student) => (
                        <tr
                            key={student.studentId}
                            className="border-b"
                        >
                            <td className="p-3">
                                {student.rollNumber}
                            </td>

                            <td className="p-3">
                                {student.name}
                            </td>

                            <td className="p-3">
                                <select
                                    className="border rounded px-2 py-1 bg-background"
                                    value={attendance[student.studentId] || "present"}
                                    onChange={(e) =>
                                        setAttendance((prev) => ({
                                            ...prev,
                                            [student.studentId]: e.target.value,
                                        }))
                                    }
                                >
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                    <option value="late">Late</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Button onClick={saveAttendance}>
                Save Attendance
            </Button>
        </div>
    );
}