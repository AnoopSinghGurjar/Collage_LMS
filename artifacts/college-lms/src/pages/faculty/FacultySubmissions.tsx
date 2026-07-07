import React, { useEffect, useMemo, useState } from "react";
import { useSearch } from "wouter";

import {
    Search,
    Download,
    User,
    FileText,
    Star,
} from "lucide-react";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";

import { Input } from "@/components/ui/input";

import { LoadingSkeleton } from "@/components/LoadingSkeleton";

interface Submission {
    id: number;

    assignmentId: number;

    studentId: number;

    studentName: string;

    fileUrl: string | null;

    fileName: string | null;

    fileType: string | null;

    submittedAt: string;

    marks: number | null;

    feedback: string | null;

    status: string;
}

export default function FacultySubmissions() {

    const searchParams = useSearch();

    const assignmentId = Number(
        new URLSearchParams(searchParams).get("assignmentId")
    );

    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    const [submissions, setSubmissions] =
        useState<Submission[]>([]);

    const [gradeOpen, setGradeOpen] = useState(false);

    const [selectedSubmission, setSelectedSubmission] =
        useState<Submission | null>(null);

    const [marks, setMarks] = useState("");

    const [feedback, setFeedback] = useState("");

    const [saving, setSaving] = useState(false);

    const fetchSubmissions = async () => {

        try {

            const res = await fetch(
                `http://localhost:3000/api/assignments/${assignmentId}/submissions`
            );

            const data = await res.json();

            setSubmissions(data);

        } catch (err) {

            console.error(err);

        } finally {

            setLoading(false);

        }

    };

    const openGradeDialog = (
        submission: Submission
    ) => {

        setSelectedSubmission(submission);

        setMarks(
            submission.marks?.toString() ?? ""
        );

        setFeedback(
            submission.feedback ?? ""
        );

        setGradeOpen(true);

    };

    const saveGrade = async () => {

        if (!selectedSubmission) return;

        try {

            setSaving(true);

            const res = await fetch(

                `http://localhost:3000/api/submissions/${selectedSubmission.id}/grade`,

                {

                    method: "PATCH",

                    headers: {

                        "Content-Type": "application/json",

                    },

                    body: JSON.stringify({

                        marks: Number(marks),

                        feedback,

                    }),

                }

            );

            if (!res.ok) {

                throw new Error("Failed to save grade");

            }

            alert("Grade Saved Successfully!");

            setGradeOpen(false);

            fetchSubmissions();

        } catch (err) {

            console.error(err);

            alert("Failed to save grade.");

        } finally {

            setSaving(false);

        }

    };

    useEffect(() => {

    if (!assignmentId) return;

    fetchSubmissions();

}, [assignmentId]);

    const filteredSubmissions = useMemo(() => {

        return submissions.filter((item) =>
            item.studentName
                ?.toLowerCase()
                .includes(search.toLowerCase())
        );

    }, [submissions, search]);

    if (loading) {

        return <LoadingSkeleton type="dashboard" />;

    }

    const totalSubmissions = filteredSubmissions.length;

    const gradedCount = filteredSubmissions.filter(
        (s) => s.status === "graded"
    ).length;

    const pendingCount = filteredSubmissions.filter(
        (s) => s.status !== "graded"
    ).length;

    return (

        <div className="space-y-8">

            <div>

                <h1 className="text-3xl font-bold">

                    Student Submissions

                </h1>

                <p className="text-muted-foreground mt-2">

                    Review, Download and Grade Student Assignments

                </p>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                <Card>

                    <CardContent className="p-6">

                        <p className="text-sm text-muted-foreground">

                            Total

                        </p>

                        <h2 className="text-3xl font-bold mt-2">

                            {totalSubmissions}

                        </h2>

                    </CardContent>

                </Card>

                <Card>

                    <CardContent className="p-6">

                        <p className="text-sm text-muted-foreground">

                            Graded

                        </p>

                        <h2 className="text-3xl font-bold text-green-600 mt-2">

                            {gradedCount}

                        </h2>

                    </CardContent>

                </Card>

                <Card>

                    <CardContent className="p-6">

                        <p className="text-sm text-muted-foreground">

                            Pending

                        </p>

                        <h2 className="text-3xl font-bold text-orange-600 mt-2">

                            {pendingCount}

                        </h2>

                    </CardContent>

                </Card>

            </div>

            <Card>

                <CardContent className="p-5">

                    <div className="relative">

                        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />

                        <Input
                            placeholder="Search student..."
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

                {filteredSubmissions.map((submission) => (

                    <Card
                        key={submission.id}
                        className="transition-all duration-300 hover:shadow-xl"
                    >

                        <CardHeader>

                            <div className="flex justify-between items-start">

                                <div>

                                    <CardTitle className="flex items-center gap-2">

                                        <User className="h-5 w-5" />

                                        {submission.studentName}

                                    </CardTitle>

                                </div>

                                {submission.status === "graded" ? (

                                    <Badge className="bg-green-600">

                                        Graded

                                    </Badge>

                                ) : (

                                    <Badge className="bg-orange-500">

                                        Submitted

                                    </Badge>

                                )}

                            </div>

                        </CardHeader>

                        <CardContent className="space-y-5">

                            <div className="rounded-lg border p-3 flex items-center justify-between">

                                <div className="flex items-center gap-3">

                                    <FileText className="h-5 w-5" />

                                    <div>

                                        <p className="font-medium">

                                            {submission.fileName}

                                        </p>

                                        <p className="text-xs text-muted-foreground">

                                            {submission.fileType}

                                        </p>

                                    </div>

                                </div>

                                {submission.fileUrl && (

                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            window.open(
                                                `http://localhost:3000${submission.fileUrl}`,
                                                "_blank"
                                            )
                                        }
                                    >

                                        <Download className="w-4 h-4 mr-2" />

                                        Download

                                    </Button>

                                )}

                            </div>

                            <div className="grid grid-cols-2 gap-4">

                                <div>

                                    <p className="text-xs text-muted-foreground">

                                        Submitted

                                    </p>

                                    <p className="font-medium">

                                        {new Date(
                                            submission.submittedAt
                                        ).toLocaleDateString()}

                                    </p>

                                </div>

                                <div>

                                    <p className="text-xs text-muted-foreground">

                                        Marks

                                    </p>

                                    <p className="font-medium">

                                        {submission.marks ?? "--"}

                                    </p>

                                </div>

                            </div>

                            {submission.feedback && (

                                <Card className="bg-muted">

                                    <CardContent className="p-4">

                                        <p className="text-sm">

                                            💬 {submission.feedback}

                                        </p>

                                    </CardContent>

                                </Card>

                            )}

                            <Button
                                className="w-full"
                                onClick={() =>
                                    openGradeDialog(submission)
                                }
                            >

                                <Star className="w-4 h-4 mr-2" />

                                Grade Assignment

                            </Button>

                        </CardContent>

                    </Card>

                ))}

                {filteredSubmissions.length === 0 && (

                    <Card className="col-span-2">

                        <CardContent className="py-12 text-center">

                            No submissions found.

                        </CardContent>

                    </Card>

                )}

            </div>

            <Dialog
                open={gradeOpen}
                onOpenChange={setGradeOpen}
            >

                <DialogContent className="sm:max-w-lg">

                    <DialogHeader>

                        <DialogTitle>

                            Grade Assignment

                        </DialogTitle>

                    </DialogHeader>

                    <div className="space-y-5">

                        <div>

                            <Label>

                                Student

                            </Label>

                            <div className="mt-2 rounded-lg border p-3">

                                {selectedSubmission?.studentName}

                            </div>

                        </div>

                        <div>

                            <Label>

                                Marks

                            </Label>

                            <Input
                                type="number"
                                min={0}
                                max={100}
                                value={marks}
                                onChange={(e) =>
                                    setMarks(e.target.value)
                                }
                                className="mt-2"
                            />

                        </div>

                        <div>

                            <Label>

                                Feedback

                            </Label>

                            <Textarea
                                rows={5}
                                className="mt-2"
                                value={feedback}
                                onChange={(e) =>
                                    setFeedback(e.target.value)
                                }
                                placeholder="Write feedback..."
                            />

                        </div>

                    </div>

                    <DialogFooter>

                        <Button
                            variant="outline"
                            onClick={() =>
                                setGradeOpen(false)
                            }
                        >

                            Cancel

                        </Button>

                        <Button
                            disabled={saving}
                            onClick={saveGrade}
                        >

                            {saving
                                ? "Saving..."
                                : "Save Grade"}

                        </Button>

                    </DialogFooter>

                </DialogContent>

            </Dialog>

        </div>

    );
}