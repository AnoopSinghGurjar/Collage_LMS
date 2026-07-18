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

    const params = new URLSearchParams(search);

    const subjectId = params.get("subjectId");
    const semester = params.get("semester");
    const department = params.get("department");

    const [students, setStudents] = useState<Student[]>([]);
    const [section, setSection] = useState("A");
    const [searchTerm, setSearchTerm] = useState("");
    const [attendance, setAttendance] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    useEffect(() => {
        if (!subjectId) return;

        fetch(
            `http://localhost:3000/api/attendance/students?subjectId=${subjectId}&section=${section}`
        )
            .then((res) => res.json())
            .then((data) => {
                setStudents(data);
            })
            .finally(() => setLoading(false));
    }, [subjectId, section]);

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

    const filteredStudents = students.filter((student) => {
        const search = searchTerm.toLowerCase();

        return (
            student.name.toLowerCase().includes(search) ||
            student.rollNumber.toLowerCase().includes(search)
        );
    });

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">
                Take Attendance
            </h1>
            <div className="rounded-lg border p-4 bg-card">
                <p>
                    <strong>Department:</strong> {department}
                </p>

                <p>
                    <strong>Semester:</strong> {semester}
                </p>
            </div>
            <div className="flex items-center gap-4">

                <div>
                    <label className="font-medium block mb-1">
                        Section
                    </label>

                    <select
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        className="border rounded-md px-3 py-2 bg-background"
                    >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                    </select>
                </div>

            </div>
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
            <div className="space-y-2">
                <label className="font-medium">
                    Search Student
                </label>

                <input
                    type="text"
                    placeholder="Search by Name or Roll Number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border rounded-md px-3 py-2 w-80 bg-background"
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
                    {filteredStudents.map((student) => (
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

                    {filteredStudents.length === 0 && (
                        <tr>
                            <td
                                colSpan={3}
                                className="text-center py-6 text-muted-foreground"
                            >
                                No student found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <Button onClick={saveAttendance}>
                Save Attendance
            </Button>
        </div>
    );
}