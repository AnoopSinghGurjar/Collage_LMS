// import React, { useState } from 'react';
// import { useListAssignments } from '@workspace/api-client-react';
// import { LoadingSkeleton } from '@/components/LoadingSkeleton';
// import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Calendar, FileText, Upload } from 'lucide-react';
// import { format, isPast } from 'date-fns';

// export default function StudentAssignments() {
//   const { data: assignments, isLoading } = useListAssignments();
//   const [tab, setTab] = useState("all");

//   if (isLoading) return <LoadingSkeleton type="dashboard" />;

//   const filtered = assignments?.filter(a => {
//     if (tab === "all") return true;
//     const isSubmitted = a.submissionCount && a.submissionCount > 0;
//     if (tab === "pending") return !isSubmitted;
//     if (tab === "submitted") return isSubmitted;
//     return true;
//   }) || [];

//   return (
//     <div className="space-y-6">
//       <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>

//       <Tabs defaultValue="all" value={tab} onValueChange={setTab}>
//         <TabsList className="bg-card border border-border">
//           <TabsTrigger value="all">All</TabsTrigger>
//           <TabsTrigger value="pending">Pending</TabsTrigger>
//           <TabsTrigger value="submitted">Submitted</TabsTrigger>
//         </TabsList>
//       </Tabs>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {filtered.map(ass => {
//           const isSubmitted = ass.submissionCount && ass.submissionCount > 0;
//           const pastDue = isPast(new Date(ass.dueDate)) && !isSubmitted;

//           return (
//             <Card key={ass.id} className="bg-card border-card-border flex flex-col">
//               <CardHeader className="pb-3">
//                 <div className="flex justify-between items-start">
//                   <Badge variant="outline" className="mb-2">{ass.subjectName}</Badge>
//                   {isSubmitted ? (
//                     <Badge className="bg-success hover:bg-success text-success-foreground">Submitted</Badge>
//                   ) : pastDue ? (
//                     <Badge variant="destructive">Overdue</Badge>
//                   ) : (
//                     <Badge className="bg-warning hover:bg-warning text-warning-foreground">Pending</Badge>
//                   )}
//                 </div>
//                 <CardTitle className="text-lg leading-tight">{ass.title}</CardTitle>
//               </CardHeader>
//               <CardContent className="flex-1">
//                 <p className="text-sm text-muted-foreground line-clamp-3">{ass.description}</p>

//                 <div className="mt-4 space-y-2 text-sm">
//                   <div className="flex items-center text-muted-foreground">
//                     <Calendar className="w-4 h-4 mr-2" />
//                     Due: <span className={`ml-1 font-medium ${pastDue ? 'text-destructive' : 'text-foreground'}`}>{format(new Date(ass.dueDate), 'PPP')}</span>
//                   </div>
//                   <div className="flex items-center text-muted-foreground">
//                     <FileText className="w-4 h-4 mr-2" />
//                     Max Marks: <span className="ml-1 font-medium text-foreground">{ass.maxMarks}</span>
//                   </div>
//                 </div>
//               </CardContent>
//               <CardFooter className="pt-4 border-t border-border">
//                 {isSubmitted ? (
//                   <Button variant="outline" className="w-full" disabled>View Submission</Button>
//                 ) : (
//                   <Button className="w-full">
//                     <Upload className="w-4 h-4 mr-2" /> Submit Assignment
//                   </Button>
//                 )}
//               </CardFooter>
//             </Card>
//           );
//         })}

//         {filtered.length === 0 && (
//           <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-card/30">
//             No assignments found in this category.
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


import React, { useEffect, useMemo, useState } from "react";

import {
  Search,
  Calendar,
  FileText,
  Download,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";

import { LoadingSkeleton } from "@/components/LoadingSkeleton";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Textarea } from "@/components/ui/textarea";

interface Assignment {
  id: number;

  title: string;

  description: string;

  subjectName: string;

  facultyName: string;

  dueDate: string;

  maxMarks: number;

  attachmentUrl: string | null;

  attachmentName: string | null;

  attachmentType: string | null;

  submitted: boolean;

  status: string;

  marks: number | null;

  feedback: string | null;
}

export default function StudentAssignments() {

  const studentId = 1;

  const [loading, setLoading] = useState(true);

  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [search, setSearch] = useState("");

  const [openUpload, setOpenUpload] = useState(false);

  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [notes, setNotes] = useState("");

  const [uploading, setUploading] = useState(false);

  const fetchAssignments = async () => {

    try {

      const res = await fetch(
        `http://localhost:3000/api/student/assignments?studentId=${studentId}`
      );

      const data = await res.json();

      setAssignments(data);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }

  };

  const openUploadDialog = (assignment: Assignment) => {

    setSelectedAssignment(assignment);

    setSelectedFile(null);

    setNotes("");

    setOpenUpload(true);

  };

  const submitAssignment = async () => {

    if (!selectedAssignment || !selectedFile) {

      alert("Please select a file.");

      return;

    }

    try {

      setUploading(true);

      const formData = new FormData();

      formData.append("studentId", "1");

      formData.append("role", "student");

      formData.append("notes", notes);

      formData.append("file", selectedFile);

      const res = await fetch(

        `http://localhost:3000/api/assignments/${selectedAssignment.id}/submissions`,

        {

          method: "POST",

          body: formData,

        }

      );

      if (!res.ok) {

        throw new Error("Upload failed");

      }

      alert("Assignment Submitted Successfully!");

      setOpenUpload(false);

      fetchAssignments();

    } catch (err) {

      console.error(err);

      alert("Failed to upload assignment.");

    } finally {

      setUploading(false);

    }

  };

  useEffect(() => {

    fetchAssignments();

  }, []);

  const filteredAssignments = useMemo(() => {

    return assignments.filter((item) =>
      item.title.toLowerCase().includes(search.toLowerCase())
    );

  }, [assignments, search]);

  if (loading) {

    return <LoadingSkeleton type="dashboard" />;

  }

  const totalAssignments = filteredAssignments.length;

  const submittedAssignments = filteredAssignments.filter(
    (a) => a.submitted
  ).length;

  const pendingAssignments = filteredAssignments.filter(
    (a) => !a.submitted
  ).length;

  const totalMarks = filteredAssignments.reduce(
    (sum, a) => sum + (a.marks ?? 0),
    0
  );

  return (

    <div className="space-y-8">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">
            My Assignments
          </h1>

          <p className="text-muted-foreground mt-2">
            View, Download and Submit Assignments
          </p>

        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

        <Card>

          <CardContent className="p-6">

            <p className="text-sm text-muted-foreground">
              Total Assignments
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {totalAssignments}
            </h2>

          </CardContent>

        </Card>

        <Card>

          <CardContent className="p-6">

            <p className="text-sm text-muted-foreground">
              Submitted
            </p>

            <h2 className="text-3xl font-bold text-green-600 mt-2">
              {submittedAssignments}
            </h2>

          </CardContent>

        </Card>

        <Card>

          <CardContent className="p-6">

            <p className="text-sm text-muted-foreground">
              Pending
            </p>

            <h2 className="text-3xl font-bold text-orange-600 mt-2">
              {pendingAssignments}
            </h2>

          </CardContent>

        </Card>

        <Card>

          <CardContent className="p-6">

            <p className="text-sm text-muted-foreground">
              Total Marks
            </p>

            <h2 className="text-3xl font-bold text-primary mt-2">
              {totalMarks}
            </h2>

          </CardContent>

        </Card>

      </div>

      <Card>

        <CardContent className="p-5">

          <div className="relative">

            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />

            <Input
              placeholder="Search assignment..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="pl-10"
            />

          </div>

        </CardContent>

      </Card>

      <div className="grid lg:grid-cols-2 gap-6">

        {filteredAssignments.map((assignment) => {

          const dueDate = new Date(assignment.dueDate);

          const today = new Date();

          const diff = Math.ceil(
            (dueDate.getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24)
          );

          const isLate =
            diff < 0 && !assignment.submitted;

          return (

            <Card
              key={assignment.id}
              className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >

              <CardHeader>

                <div className="flex items-start justify-between">

                  <div>

                    <CardTitle>
                      {assignment.title}
                    </CardTitle>

                    <p className="text-sm text-muted-foreground mt-1">
                      {assignment.subjectName}
                    </p>

                  </div>

                  {assignment.submitted ? (

                    <Badge className="bg-green-600">
                      Submitted
                    </Badge>

                  ) : isLate ? (

                    <Badge variant="destructive">
                      Late
                    </Badge>

                  ) : (

                    <Badge className="bg-orange-500">
                      Pending
                    </Badge>

                  )}

                </div>

              </CardHeader>

              <CardContent className="space-y-5">

                <p className="text-muted-foreground">

                  {assignment.description}

                </p>

                <div className="grid grid-cols-2 gap-4">

                  <div>

                    <p className="text-xs text-muted-foreground">
                      Faculty
                    </p>

                    <p className="font-semibold">
                      {assignment.facultyName}
                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-muted-foreground">
                      Max Marks
                    </p>

                    <p className="font-semibold">
                      {assignment.maxMarks}
                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-muted-foreground">
                      Due Date
                    </p>

                    <p className="font-semibold">
                      {assignment.dueDate}
                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-muted-foreground">
                      Countdown
                    </p>

                    <p
                      className={`font-semibold ${isLate
                        ? "text-red-600"
                        : "text-green-600"
                        }`}
                    >
                      {isLate
                        ? `${Math.abs(diff)} Days Late`
                        : `${diff} Days Left`}
                    </p>

                  </div>

                </div>

                <div className="rounded-lg border p-3 flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <FileText className="h-5 w-5" />

                    <div>

                      <p className="font-medium">

                        {assignment.attachmentName ??
                          "No Attachment"}

                      </p>

                      <p className="text-xs text-muted-foreground">

                        {assignment.attachmentType ??
                          "-"}

                      </p>

                    </div>

                  </div>

                  {assignment.attachmentUrl && (

                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(
                          `http://localhost:3000${assignment.attachmentUrl}`,
                          "_blank"
                        )
                      }
                    >

                      <Download className="w-4 h-4 mr-2" />

                      Download

                    </Button>

                  )}

                </div>

                <div className="grid grid-cols-2 gap-3">

                  <Button
                    onClick={() =>
                      openUploadDialog(assignment)
                    }
                  >

                    <Upload className="w-4 h-4 mr-2" />

                    Submit

                  </Button>

                  <Button
                    variant="secondary"
                    disabled={!assignment.submitted}
                  >

                    View Submission

                  </Button>

                </div>

                {assignment.marks !== null && (

                  <Card className="bg-muted">

                    <CardContent className="p-4">

                      <p>

                        ⭐ Marks :
                        <strong>
                          {" "}
                          {assignment.marks}
                        </strong>

                      </p>

                      <p className="mt-2 text-sm">

                        💬 Feedback :
                        {" "}
                        {assignment.feedback ??
                          "No Feedback"}

                      </p>

                    </CardContent>

                  </Card>

                )}

              </CardContent>

            </Card>

          );

        })}

        {filteredAssignments.length === 0 && (

          <Card className="col-span-2">

            <CardContent className="py-12 text-center">

              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />

              <h3 className="mt-4 text-xl font-semibold">
                No Assignments Found
              </h3>

              <p className="text-muted-foreground mt-2">
                There are no assignments matching your search.
              </p>

            </CardContent>

          </Card>

        )}

      </div>

      <Dialog
        open={openUpload}
        onOpenChange={setOpenUpload}
      >

        <DialogContent className="sm:max-w-lg">

          <DialogHeader>

            <DialogTitle>

              Submit Assignment

            </DialogTitle>

          </DialogHeader>

          <div className="space-y-5">

            <div>

              <p className="text-sm font-medium mb-2">

                Assignment

              </p>

              <div className="rounded-lg border p-3">

                {selectedAssignment?.title}

              </div>

            </div>

            <div>

              <p className="text-sm font-medium mb-2">

                Choose File

              </p>

              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                onChange={(e) =>
                  setSelectedFile(
                    e.target.files?.[0] ?? null
                  )
                }
              />

              {selectedFile && (

                <p className="text-sm text-muted-foreground mt-2">

                  {selectedFile.name}

                </p>

              )}

            </div>

            <div>

              <p className="text-sm font-medium mb-2">

                Notes

              </p>

              <Textarea
                rows={4}
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value)
                }
                placeholder="Write submission notes..."
              />

            </div>

          </div>

          <DialogFooter>

            <Button
              variant="outline"
              onClick={() =>
                setOpenUpload(false)
              }
            >

              Cancel

            </Button>

            <Button
              disabled={uploading}
              onClick={submitAssignment}
            >

              {uploading
                ? "Uploading..."
                : "Submit Assignment"}

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>

  );
}