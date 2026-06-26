import React from "react";
import { useListTimetable } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const TIME_SLOTS = [
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "12:00 - 13:00",
    "13:00 - 14:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
    "16:00 - 17:00",
];

export default function FacultyTimetable() {
    const {
        facultyId,
        employeeId,
        designation,
    } = useAuth();

    const { data: timetable, isLoading } = useListTimetable({
        facultyId,
    });

    const getEntry = (day: string, slot: string) => {
        if (!timetable) return null;

        const start = slot.split(" - ")[0].trim();

        return timetable.find((t) => {
            const dbTime = t.startTime.substring(0, 5);

            return (
                t.dayOfWeek.toLowerCase() === day.toLowerCase() &&
                dbTime === start
            );
        });
    };

    if (isLoading) return <LoadingSkeleton type="table" />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">
                    My Teaching Timetable
                </h1>
                <div className="flex gap-6 text-sm text-muted-foreground mb-4">
  <span><strong>Employee ID:</strong> {employeeId}</span>
  <span><strong>Designation:</strong> {designation}</span>
</div>

                <Button
                    onClick={() =>
                        window.open(
                            `http://localhost:3000/api/timetable/export?facultyId=${facultyId}`,
                            "_blank",
                        )
                    }
                >
                    Download Timetable
                </Button>
            </div>

            <div className="overflow-x-auto border border-border rounded-lg bg-card">
                <table className="w-full">
                    <thead className="bg-muted/40">
                        <tr>
                            <th className="p-3 border">Time</th>

                            {DAYS.map((day) => (
                                <th key={day} className="p-3 border">
                                    {day}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {TIME_SLOTS.map((slot) => (
                            <tr key={slot}>
                                <td className="border p-3 font-medium">
                                    {slot}
                                </td>

                                {DAYS.map((day) => {
                                    const entry = getEntry(day, slot);

                                    return (
                                        <td
                                            key={day + slot}
                                            className="border p-2 h-24"
                                        >
                                            {entry ? (
                                                <div className="rounded bg-primary/10 border border-primary/20 p-2 text-center">
                                                    <div className="font-semibold text-primary">
                                                        {entry.subjectName}
                                                    </div>

                                                    <div className="text-xs mt-1">
                                                        Room : {entry.room}
                                                    </div>

                                                    <div className="text-xs">
                                                        Semester : {entry.semester}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center text-muted-foreground text-xs">
                                                    Free
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}