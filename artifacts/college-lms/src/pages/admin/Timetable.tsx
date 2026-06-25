import React, { useState } from 'react';
import { useListTimetable, useCreateTimetableEntry, useDeleteTimetableEntry, useListDepartments, useListSubjects, useListFaculty } from '@workspace/api-client-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00',
  '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00'
];

export default function AdminTimetable() {
  const queryClient = useQueryClient();
  const [departmentId, setDepartmentId] = useState<string>("1"); // Default to something to show data
  const [semester, setSemester] = useState<string>("3");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    subjectId: "", facultyId: "", dayOfWeek: "Monday", startTime: "09:00:00", endTime: "10:00:00", room: "", semester: "1", departmentId: ""
  });

  const { data: timetable, isLoading } = useListTimetable({
    departmentId: Number(departmentId),
    semester: Number(semester)
  });

  console.log("Department:", departmentId);
  console.log("Semester:", semester);
  console.log("Timetable:", timetable);

  const { data: depts } = useListDepartments();
  const { data: subjects } = useListSubjects({ departmentId: Number(departmentId), semester: Number(semester) });
  const { data: faculty } = useListFaculty({ departmentId: Number(departmentId) });

  const createEntry = useCreateTimetableEntry({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/timetable'] });
        toast.success("Timetable entry added");
        setIsAddModalOpen(false);
      }
    }
  });

  const deleteEntry = useDeleteTimetableEntry({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/timetable'] });
        toast.success("Entry removed");
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEntry.mutate({
      data: {
        subjectId: Number(formData.subjectId),
        facultyId: Number(formData.facultyId),
        departmentId: Number(formData.departmentId),
        semester: Number(formData.semester),
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        room: formData.room
      }
    });
  };

  const handleExcelUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        "http://localhost:3000/api/timetable/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      console.log(data);

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      toast.success(
        `Excel uploaded successfully (${data.inserted}/${data.totalRows} rows)`
      );

      // Refresh React Query cache
      await queryClient.invalidateQueries({
        queryKey: ["/api/timetable"],
      });

      // Force refresh so timetable updates immediately
      window.location.reload();

    } catch (err) {
      console.error(err);
      toast.error("Excel upload failed");
    }
  };

  // const getEntry = (day: string, slotStr: string) => {
  //   if (!timetable) return null;
  //   const start = slotStr.split(' - ')[0] + ':00';
  //   return timetable.find(t => t.dayOfWeek === day && t.startTime.startsWith(start));
  // };

  const getEntry = (day: string, slotStr: string) => {
    if (!timetable) return null;

    // Slot ka start time nikaalo
    const start = slotStr.split(" - ")[0].trim();

    return timetable.find((t) => {
      const dbTime = t.startTime.substring(0, 5); // "09:00"
      return (
        t.dayOfWeek.trim().toLowerCase() === day.trim().toLowerCase() &&
        dbTime === start
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Timetable Management</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Entry
        </Button>
      </div>

      <div className="flex gap-4 bg-card p-4 rounded-lg border border-border w-fit">
        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            {depts?.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={semester} onValueChange={setSemester}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Semester" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <LoadingSkeleton type="table" /> : (
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
                      <td key={`${day}-${slot}`} className="p-2 border-r border-border last:border-0 relative group">
                        {entry ? (
                          <div className="bg-primary/10 border border-primary/20 rounded p-2 text-center h-full">
                            <div className="font-semibold text-primary text-xs truncate" title={entry.subjectName || ''}>{entry.subjectName}</div>
                            <div className="text-[10px] text-muted-foreground mt-1 truncate" title={entry.facultyName || ''}>{entry.facultyName}</div>
                            <div className="text-[10px] text-muted-foreground font-mono mt-1">Rm: {entry.room || 'TBA'}</div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 bg-background border border-border hover:bg-destructive hover:text-destructive-foreground transition-opacity"
                              onClick={() => deleteEntry.mutate({ id: entry.id })}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="h-16 flex items-center justify-center text-[10px] text-muted-foreground/30 hover:bg-muted/10 rounded border border-transparent transition-colors">
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
      )}

      <Modal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} title="Add Timetable Entry">
        <div className="mb-4 flex justify-end gap-2">

          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              window.open(
                "http://localhost:3000/api/timetable/template",
                "_blank",
              );
            }}
          >
            Download Template
          </Button>

          <Button
            type="button"
            variant="default"
            onClick={() => {
              window.open(
                "http://localhost:3000/api/timetable/export",
                "_blank",
              );
            }}
          >
            Download Timetable
          </Button>

          <input
            type="file"
            id="excelUpload"
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            onChange={handleExcelUpload}
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("excelUpload")?.click()}
          >
            Upload Excel
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={formData.departmentId} onValueChange={v => setFormData({ ...formData, departmentId: v })}>
                <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent>
                  {depts?.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select value={formData.semester} onValueChange={v => setFormData({ ...formData, semester: v })}>
                <SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={formData.subjectId} onValueChange={v => setFormData({ ...formData, subjectId: v })}>
                <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                <SelectContent>
                  {subjects?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Faculty</Label>
              <Select value={formData.facultyId} onValueChange={v => setFormData({ ...formData, facultyId: v })}>
                <SelectTrigger><SelectValue placeholder="Select Faculty" /></SelectTrigger>
                <SelectContent>
                  {faculty?.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Day</Label>
              <Select value={formData.dayOfWeek} onValueChange={v => setFormData({ ...formData, dayOfWeek: v })}>
                <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                <SelectContent>
                  {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" required value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} step="3600" />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" required value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} step="3600" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Room / Hall</Label>
            <Input value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} placeholder="e.g. CS-101" />
          </div>

          <div className="flex justify-end pt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createEntry.isPending}>
              {createEntry.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
