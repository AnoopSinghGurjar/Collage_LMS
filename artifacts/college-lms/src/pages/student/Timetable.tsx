import React from 'react';
import { useListTimetable } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Button } from "@/components/ui/button";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00',
  '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00'
];

export default function StudentTimetable() {
  const { user,semester } = useAuth();
  // We need to fetch timetable for the student's department and semester.
  // Using hardcoded 1 for demo purposes if not available in user object
  const { data: timetable, isLoading } = useListTimetable({
    departmentId: user?.departmentId || 1,
    semester: semester || 1, // Ideally read from student profile
  });

  const getEntry = (day: string, slotStr: string) => {
    if (!timetable) return null;

    const start = slotStr.split(" - ")[0].trim();

    return timetable.find((t) => {
      const dbTime = t.startTime.substring(0, 5);

      return (
        t.dayOfWeek.trim().toLowerCase() === day.trim().toLowerCase() &&
        dbTime === start
      );
    });
  };

  if (isLoading) return <LoadingSkeleton type="table" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Class Timetable
        </h1>

        <Button
          onClick={() =>
            window.open(
              `http://localhost:3000/api/timetable/export?departmentId=${user?.departmentId}&semester=3`,
              "_blank",
            )
          }
        >
          Download Timetable
        </Button>
      </div>

      <div className="overflow-x-auto border border-border rounded-lg bg-card">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium text-center border-r border-border min-w-[120px]">Time</th>
              {DAYS.map(day => (
                <th key={day} className="px-4 py-3 font-medium text-center min-w-[150px]">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map(slot => (
              <tr key={slot} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-center border-r border-border font-medium text-muted-foreground whitespace-nowrap bg-muted/10">
                  {slot}
                </td>
                {DAYS.map(day => {
                  const entry = getEntry(day, slot);
                  return (
                    <td key={`${day}-${slot}`} className="p-2 border-r border-border last:border-0 relative">
                      {entry ? (
                        <div className="bg-primary/10 border border-primary/20 rounded p-3 text-center h-full hover:bg-primary/20 transition-colors">
                          <div className="font-semibold text-primary text-sm truncate" title={entry.subjectName || ''}>{entry.subjectName}</div>
                          <div className="text-xs text-muted-foreground mt-1 truncate" title={entry.facultyName || ''}>{entry.facultyName}</div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-2 bg-background/50 inline-block px-2 py-0.5 rounded">Rm: {entry.room || 'TBA'}</div>
                        </div>
                      ) : (
                        <div className="h-20 flex items-center justify-center text-xs text-muted-foreground/30">
                          -
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
