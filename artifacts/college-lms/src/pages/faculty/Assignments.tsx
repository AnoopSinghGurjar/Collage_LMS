import { useEffect } from "react";
import React, { useState } from "react";
import { useLocation } from "wouter";
import {
    Search,
    Plus,
    FileText,
    Clock3,
    CheckCircle2,
    AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Assignment {
    id: number;
    title: string;
    description: string | null;

    subjectId: number;
    subjectName: string | null;

    facultyId: number;
    facultyName: string | null;

    semester: number | null;

    dueDate: string;

    maxMarks: number;

    attachmentUrl: string | null;
    attachmentName: string | null;
    attachmentType: string | null;

    submissionCount: number;

    createdAt: string;
}

// const dummyAssignments: Assignment[] = [
//     {
//         id: 1,
//         title: "DSA Assignment 1",
//         subject: "Data Structures",
//         dueDate: "10 Jul 2026",
//         status: "Published",
//         submissions: 34,
//         totalStudents: 45,
//         attachment: "PDF",
//     },
//     {
//         id: 2,
//         title: "DBMS ER Diagram",
//         subject: "DBMS",
//         dueDate: "14 Jul 2026",
//         status: "Published",
//         submissions: 27,
//         totalStudents: 45,
//         attachment: "DOCX",
//     },
//     {
//         id: 3,
//         title: "Operating System PPT",
//         subject: "Operating Systems",
//         dueDate: "18 Jul 2026",
//         status: "Draft",
//         submissions: 0,
//         totalStudents: 45,
//         attachment: "PPT",
//     },
// ];

export default function FacultyAssignments() {
    const [search, setSearch] = useState("");

    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    const [open, setOpen] = useState(false);

    const [title, setTitle] = useState("");

    const [description, setDescription] = useState("");

    const [subjectId, setSubjectId] = useState("");

    const [semester, setSemester] = useState("");

    const [dueDate, setDueDate] = useState("");

    const [maxMarks, setMaxMarks] = useState("100");

    const [file, setFile] = useState<File | null>(null);

    const [editingAssignment, setEditingAssignment] =
        useState<Assignment | null>(null);

    const [editOpen, setEditOpen] = useState(false);

    const [viewOpen, setViewOpen] = useState(false);

    const [selectedAssignment, setSelectedAssignment] =
        useState<Assignment | null>(null);

    const [, navigate] = useLocation();

    const fetchAssignments = async () => {
        try {
            setLoading(true);

            const res = await fetch(
                "http://localhost:3000/api/assignments"
            );

            const data = await res.json();

            setAssignments(data);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const createAssignment = async () => {
        try {
            if (
                !title ||
                !subjectId ||
                !semester ||
                !dueDate ||
                !file
            ) {
                alert("Please fill all required fields.");
                return;
            }

            const formData = new FormData();

            formData.append("title", title);
            formData.append("description", description);
            formData.append("subjectId", subjectId);
            formData.append("facultyId", "1"); // replace later with logged-in faculty id
            formData.append("semester", semester);
            formData.append("dueDate", dueDate);
            formData.append("maxMarks", maxMarks);
            formData.append("role", "faculty");
            formData.append("file", file);

            const response = await fetch(
                "http://localhost:3000/api/assignments",
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                const err = await response.json();

                alert(err.error ?? "Upload failed");

                return;
            }

            alert("Assignment Created Successfully!");

            await fetchAssignments();

            setOpen(false);

            setTitle("");
            setDescription("");
            setSubjectId("");
            setSemester("");
            setDueDate("");
            setMaxMarks("100");
            setFile(null);

        } catch (err) {

            console.error(err);

            alert("Something went wrong.");

        }
    };

    const deleteAssignment = async (id: number) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this assignment?"
        );

        if (!confirmDelete) return;

        try {
            const res = await fetch(
                `http://localhost:3000/api/assignments/${id}`,
                {
                    method: "DELETE",
                }
            );

            if (!res.ok) {
                alert("Delete failed");
                return;
            }

            alert("Assignment deleted successfully.");

            await fetchAssignments();

        } catch (err) {

            console.error(err);

            alert("Something went wrong.");

        }
    };

    const openEditDialog = (assignment: Assignment) => {
        setEditingAssignment(assignment);

        setTitle(assignment.title);
        setDescription(assignment.description ?? "");
        setSubjectId(String(assignment.subjectId));
        setSemester(String(assignment.semester ?? ""));
        setDueDate(assignment.dueDate);
        setMaxMarks(String(assignment.maxMarks));

        setEditOpen(true);
    };

    const updateAssignment = async () => {
        if (!editingAssignment) return;

        try {
            const res = await fetch(
                `http://localhost:3000/api/assignments/${editingAssignment.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        title,
                        description,
                        dueDate,
                        maxMarks: Number(maxMarks),
                    }),
                }
            );

            if (!res.ok) {
                alert("Update failed");
                return;
            }

            alert("Assignment Updated Successfully");

            setEditOpen(false);

            await fetchAssignments();

        } catch (err) {

            console.error(err);

            alert("Something went wrong.");

        }
    };

    const openViewDialog = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setViewOpen(true);
    };

    useEffect(() => {
        fetchAssignments();
    }, []);

    const filteredAssignments = assignments.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="p-8 text-center">
                Loading Assignments...
            </div>
        );
    }

    const totalAssignments = filteredAssignments.length;

    // Abhi backend me status field nahi hai,
    // isliye sab assignments ko published maan rahe hain.
    const published = filteredAssignments.length;

    // Draft feature baad me add karenge.
    const draft = 0;

    // Backend se submissionCount aa raha hai.
    const totalSubmissions = filteredAssignments.reduce(
        (sum, item) => sum + (item.submissionCount ?? 0),
        0
    );

    return (
        <div className="space-y-6 p-6">

            {/* Header */}

            <div className="flex items-center justify-between">

                <div>

                    <h1 className="text-3xl font-bold">
                        Assignment Management
                    </h1>

                    <p className="text-muted-foreground">
                        Create and manage assignments for students
                    </p>

                </div>

                <Dialog
                    open={open}
                    onOpenChange={setOpen}
                >

                    <DialogTrigger asChild>

                        <Button className="gap-2">

                            <Plus className="h-4 w-4" />

                            Create Assignment

                        </Button>

                    </DialogTrigger>

                    <DialogContent className="max-w-2xl">

                        <DialogHeader>

                            <DialogTitle>

                                Create Assignment

                            </DialogTitle>

                        </DialogHeader>

                        <div className="space-y-5">

                            <div>

                                <Label>

                                    Assignment Title

                                </Label>

                                <Input
                                    value={title}
                                    onChange={(e) =>
                                        setTitle(e.target.value)
                                    }
                                />

                            </div>

                            <div>

                                <Label>

                                    Description

                                </Label>

                                <Textarea
                                    rows={4}
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(
                                            e.target.value
                                        )
                                    }
                                />

                            </div>

                            <div className="grid grid-cols-2 gap-4">

                                <div>

                                    <Label>

                                        Subject

                                    </Label>

                                    <Select
                                        onValueChange={
                                            setSubjectId
                                        }
                                    >

                                        <SelectTrigger>

                                            <SelectValue placeholder="Select Subject" />

                                        </SelectTrigger>

                                        <SelectContent>

                                            <SelectItem value="1">

                                                Data Structures

                                            </SelectItem>

                                            <SelectItem value="2">

                                                DBMS

                                            </SelectItem>

                                            <SelectItem value="3">

                                                Operating Systems

                                            </SelectItem>

                                        </SelectContent>

                                    </Select>

                                </div>

                                <div>

                                    <Label>

                                        Semester

                                    </Label>

                                    <Select
                                        onValueChange={
                                            setSemester
                                        }
                                    >

                                        <SelectTrigger>

                                            <SelectValue placeholder="Semester" />

                                        </SelectTrigger>

                                        <SelectContent>

                                            <SelectItem value="3">
                                                Semester 3
                                            </SelectItem>

                                            <SelectItem value="4">
                                                Semester 4
                                            </SelectItem>

                                        </SelectContent>

                                    </Select>

                                </div>

                            </div>

                            <div className="grid grid-cols-2 gap-4">

                                <div>

                                    <Label>

                                        Due Date

                                    </Label>

                                    <Input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) =>
                                            setDueDate(
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>

                                <div>

                                    <Label>

                                        Max Marks

                                    </Label>

                                    <Input
                                        type="number"
                                        value={maxMarks}
                                        onChange={(e) =>
                                            setMaxMarks(
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>

                            </div>

                            <div>

                                <Label>

                                    Upload PDF / DOCX / PPT

                                </Label>

                                <Input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                                    onChange={(e) =>
                                        setFile(
                                            e.target.files?.[0] ??
                                            null
                                        )
                                    }
                                />

                            </div>

                            <Button
                                className="w-full"
                                onClick={createAssignment}
                            >
                                Create Assignment
                            </Button>

                        </div>

                    </DialogContent>

                </Dialog>

                <Dialog open={editOpen} onOpenChange={setEditOpen}>

                    <DialogContent className="max-w-2xl">

                        <DialogHeader>
                            <DialogTitle>Edit Assignment</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-5">

                            <div>
                                <Label>Assignment Title</Label>

                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div>
                                <Label>Description</Label>

                                <Textarea
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">

                                <div>

                                    <Label>Due Date</Label>

                                    <Input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />

                                </div>

                                <div>

                                    <Label>Max Marks</Label>

                                    <Input
                                        type="number"
                                        value={maxMarks}
                                        onChange={(e) => setMaxMarks(e.target.value)}
                                    />

                                </div>

                            </div>

                            <Button
                                className="w-full"
                                onClick={updateAssignment}
                            >
                                Save Changes
                            </Button>

                        </div>

                    </DialogContent>

                </Dialog>

                <Dialog
                    open={viewOpen}
                    onOpenChange={setViewOpen}
                >

                    <DialogContent className="max-w-3xl">

                        <DialogHeader>

                            <DialogTitle>

                                Assignment Details

                            </DialogTitle>

                        </DialogHeader>

                        {selectedAssignment && (

                            <div className="space-y-6">

                                <div>

                                    <h2 className="text-2xl font-bold">
                                        {selectedAssignment.title}
                                    </h2>

                                    <p className="text-muted-foreground mt-2">
                                        {selectedAssignment.description}
                                    </p>

                                </div>

                                <div className="grid grid-cols-2 gap-5">

                                    <Card>

                                        <CardContent className="p-4">

                                            <p className="text-sm text-muted-foreground">
                                                Subject
                                            </p>

                                            <p className="font-semibold mt-1">
                                                {selectedAssignment.subjectName}
                                            </p>

                                        </CardContent>

                                    </Card>

                                    <Card>

                                        <CardContent className="p-4">

                                            <p className="text-sm text-muted-foreground">
                                                Faculty
                                            </p>

                                            <p className="font-semibold mt-1">
                                                {selectedAssignment.facultyName}
                                            </p>

                                        </CardContent>

                                    </Card>

                                    <Card>

                                        <CardContent className="p-4">

                                            <p className="text-sm text-muted-foreground">
                                                Semester
                                            </p>

                                            <p className="font-semibold mt-1">
                                                {selectedAssignment.semester}
                                            </p>

                                        </CardContent>

                                    </Card>

                                    <Card>

                                        <CardContent className="p-4">

                                            <p className="text-sm text-muted-foreground">
                                                Due Date
                                            </p>

                                            <p className="font-semibold mt-1">
                                                {selectedAssignment.dueDate}
                                            </p>

                                        </CardContent>

                                    </Card>

                                    <Card>

                                        <CardContent className="p-4">

                                            <p className="text-sm text-muted-foreground">
                                                Max Marks
                                            </p>

                                            <p className="font-semibold mt-1">
                                                {selectedAssignment.maxMarks}
                                            </p>

                                        </CardContent>

                                    </Card>

                                    <Card>

                                        <CardContent className="p-4">

                                            <p className="text-sm text-muted-foreground">
                                                Submissions
                                            </p>

                                            <p className="font-semibold mt-1">
                                                {selectedAssignment.submissionCount}
                                            </p>

                                        </CardContent>

                                    </Card>

                                </div>

                                <Card>

                                    <CardHeader>

                                        <CardTitle>

                                            Assignment File

                                        </CardTitle>

                                    </CardHeader>

                                    <CardContent>

                                        <div className="flex items-center justify-between">

                                            <div>

                                                <p className="font-medium">

                                                    {selectedAssignment.attachmentName}

                                                </p>

                                                <p className="text-sm text-muted-foreground">

                                                    {selectedAssignment.attachmentType}

                                                </p>

                                            </div>

                                            {selectedAssignment.attachmentUrl && (

                                                <Button
                                                    onClick={() =>
                                                        window.open(
                                                            `http://localhost:3000${selectedAssignment.attachmentUrl}`,
                                                            "_blank"
                                                        )
                                                    }
                                                >
                                                    Download File
                                                </Button>

                                            )}

                                        </div>

                                    </CardContent>

                                </Card>

                            </div>

                        )}

                    </DialogContent>

                </Dialog>

            </div>

            {/* Stats */}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

                <Card>

                    <CardContent className="p-6">

                        <div className="flex justify-between">

                            <div>

                                <p className="text-sm text-muted-foreground">
                                    Total Assignments
                                </p>

                                <h2 className="text-3xl font-bold mt-2">
                                    {totalAssignments}
                                </h2>

                            </div>

                            <FileText className="h-9 w-9 text-primary" />

                        </div>

                    </CardContent>

                </Card>

                <Card>

                    <CardContent className="p-6">

                        <div className="flex justify-between">

                            <div>

                                <p className="text-sm text-muted-foreground">
                                    Published
                                </p>

                                <h2 className="text-3xl font-bold mt-2">
                                    {published}
                                </h2>

                            </div>

                            <CheckCircle2 className="h-9 w-9 text-green-500" />

                        </div>

                    </CardContent>

                </Card>

                <Card>

                    <CardContent className="p-6">

                        <div className="flex justify-between">

                            <div>

                                <p className="text-sm text-muted-foreground">
                                    Draft
                                </p>

                                <h2 className="text-3xl font-bold mt-2">
                                    {draft}
                                </h2>

                            </div>

                            <Clock3 className="h-9 w-9 text-yellow-500" />

                        </div>

                    </CardContent>

                </Card>

                <Card>

                    <CardContent className="p-6">

                        <div className="flex justify-between">

                            <div>

                                <p className="text-sm text-muted-foreground">
                                    Total Submissions
                                </p>

                                <h2 className="text-3xl font-bold mt-2">
                                    {totalSubmissions}
                                </h2>

                            </div>

                            <AlertTriangle className="h-9 w-9 text-blue-500" />

                        </div>

                    </CardContent>

                </Card>

            </div>

            {/* Search */}

            <Card>

                <CardHeader>

                    <CardTitle>
                        Assignments
                    </CardTitle>

                    <CardDescription>
                        Search and manage all assignments
                    </CardDescription>

                </CardHeader>

                <CardContent>

                    <div className="relative">

                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                        <Input
                            className="pl-10"
                            placeholder="Search assignments..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                    </div>

                </CardContent>

            </Card>

            {/* Assignment Cards */}

            <div className="grid gap-6 lg:grid-cols-2">

                {filteredAssignments.map((assignment) => (

                    <Card
                        key={assignment.id}
                        className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    >

                        <CardContent className="p-6 space-y-5">

                            <div className="flex items-start justify-between">

                                <div>

                                    <h3 className="text-xl font-semibold">
                                        {assignment.title}
                                    </h3>

                                    <p className="text-sm text-muted-foreground mt-1">
                                        {assignment.subjectName}
                                    </p>

                                </div>

                                <Badge>
                                    Active
                                </Badge>

                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">

                                <div>

                                    <p className="text-muted-foreground">
                                        Faculty
                                    </p>

                                    <p className="font-medium">
                                        {assignment.facultyName}
                                    </p>

                                </div>

                                <div>

                                    <p className="text-muted-foreground">
                                        Due Date
                                    </p>

                                    <p className="font-medium">
                                        {assignment.dueDate}
                                    </p>

                                </div>

                                <div>

                                    <p className="text-muted-foreground">
                                        Max Marks
                                    </p>

                                    <p className="font-medium">
                                        {assignment.maxMarks}
                                    </p>

                                </div>

                                <div>

                                    <p className="text-muted-foreground">
                                        Submissions
                                    </p>

                                    <p className="font-medium">
                                        {assignment.submissionCount}
                                    </p>

                                </div>

                            </div>

                            <div>

                                <p className="text-muted-foreground text-sm mb-2">
                                    Attachment
                                </p>

                                <div className="rounded-lg border p-3 flex items-center justify-between">

                                    <span className="text-sm font-medium truncate">
                                        {assignment.attachmentName ?? "No Attachment"}
                                    </span>

                                    {assignment.attachmentUrl && (

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                window.open(
                                                    `http://localhost:3000${assignment.attachmentUrl}`,
                                                    "_blank"
                                                )
                                            }
                                        >
                                            Download
                                        </Button>

                                    )}

                                </div>

                            </div>

                            <div className="grid grid-cols-5 gap-2">

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openViewDialog(assignment)}
                                >
                                    View
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        window.open(
                                            `http://localhost:3000${assignment.attachmentUrl}`,
                                            "_blank"
                                        );
                                    }}
                                >
                                    Download
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        navigate(
                                            `/faculty/submissions?assignmentId=${assignment.id}`
                                        )
                                    }
                                >
                                    Submissions
                                </Button>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => openEditDialog(assignment)}
                                >
                                    Edit
                                </Button>

                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deleteAssignment(assignment.id)}
                                >
                                    Delete
                                </Button>

                            </div>

                        </CardContent>

                    </Card>

                ))}

            </div>

        </div>
    );
}