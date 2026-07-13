import React, { useEffect, useMemo, useState } from "react";

import {
    Search,
    Plus,
    Award,
    Users,
    CheckCircle,
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

import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";

import { LoadingSkeleton } from "@/components/LoadingSkeleton";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Result {

    id: number;

    studentId: number;

    subjectId: number;

    semester: number;

    studentName: string;

    subjectName: string;

    internalMarks: number;

    externalMarks: number;

    totalMarks: number;

    grade: string;

    passed: boolean;

    remarks?: string;

    published?: boolean;

    academicSession: string | null;

    departmentId: number | null;

}

export default function FacultyResults() {

    const [loading, setLoading] = useState(true);

    const [results, setResults] = useState<Result[]>([]);

    const [search, setSearch] = useState("");

    const [openDialog, setOpenDialog] = useState(false);

    const [excelFile, setExcelFile] = useState<File | null>(null);

    const [uploadingExcel, setUploadingExcel] = useState(false);

    // const [students, setStudents] = useState<any[]>([]);

    const [subjects, setSubjects] = useState<any[]>([]);


    // ===============================
    // Upload Dialog States
    // ===============================

    const [academicSession, setAcademicSession] = useState("2026-27");

    const [departmentId, setDepartmentId] = useState("");

    const [semester, setSemester] = useState("");

    const [subjectId, setSubjectId] = useState("");


    // ===============================
    // Table Filter States
    // ===============================

    const [filterSession, setFilterSession] = useState("2026-27");

    const [filterDepartment, setFilterDepartment] = useState("");

    const [filterSemester, setFilterSemester] = useState("");

    const [filterSubject, setFilterSubject] = useState("");

    const fetchResults = async () => {

        console.log({
        filterSession,
        filterDepartment,
        filterSemester,
        filterSubject,
    });

        try {

            const params = new URLSearchParams();

            if (filterSession)
                params.append("academicSession", filterSession);

            if (filterDepartment)
                params.append("departmentId", filterDepartment);

            if (filterSemester)
                params.append("semester", filterSemester);

            if (filterSubject)
                params.append("subjectId", filterSubject);

            const res = await fetch(
                `http://localhost:3000/api/results?${params.toString()}`
            );

            const data = await res.json();

            console.log("Results from API:", data.length);
            console.table(data);

            setResults(
                data.sort(
                    (a: any, b: any) => b.id - a.id
                )
            );

            console.log("Results state:", data.length);

        } catch (err) {

            console.error(err);

        } finally {

            setLoading(false);

        }

    };

    // const fetchStudents = async () => {

    //     const res = await fetch(
    //         "http://localhost:3000/api/students"
    //     );

    //     const data = await res.json();

    //     setStudents(data.students || []);

    // };

    const fetchSubjects = async () => {
        try {
            const res = await fetch("http://localhost:3000/api/subjects");

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();

            setSubjects(data);

        } catch (err) {
            console.error("fetchSubjects:", err);
        }
    };

    // const saveResult = async () => {

    //     try {

    //         setSaving(true);

    //         const res = await fetch(
    //             "http://localhost:3000/api/results",
    //             {
    //                 method: "POST",

    //                 headers: {
    //                     "Content-Type": "application/json",
    //                 },

    //                 body: JSON.stringify({

    //                     studentId: Number(studentId),

    //                     subjectId: Number(subjectId),

    //                     semester: Number(semester),

    //                     academicSession,

    //                     departmentId: Number(departmentId),

    //                     internalMarks: Number(internalMarks),

    //                     externalMarks: Number(externalMarks),

    //                 }),
    //             }
    //         );

    //         if (!res.ok) {
    //             const err = await res.text();
    //             console.log(err);
    //             alert(err);
    //             throw new Error(err);
    //         }
    //         await fetchResults();

    //         setOpenDialog(false);

    //         setStudentId("");

    //         setSubjectId("");

    //         setSemester("");

    //         setInternalMarks("");

    //         setExternalMarks("");

    //         alert("Result Added Successfully");

    //     } catch (err) {

    //         console.error(err);

    //         alert(
    //             err instanceof Error
    //                 ? err.message
    //                 : String(err)
    //         );

    //     } finally {

    //         setSaving(false);

    //     }

    // };

    const uploadExcel = async () => {

        if (
            !academicSession ||
            !departmentId ||
            !semester ||
            !subjectId
        ) {

            alert(
                "Please select Academic Session, Department, Semester and Subject."
            );

            return;

        }

        if (!excelFile) {

            alert("Please select an Excel file");

            return;

        }

        try {

            setUploadingExcel(true);

            const formData = new FormData();

            formData.append("academicSession", academicSession);

            formData.append("departmentId", departmentId);

            formData.append("semester", semester);

            formData.append("subjectId", subjectId);

            formData.append("file", excelFile);

            const res = await fetch(
                "http://localhost:3000/api/results/import",
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await res.json();

            if (!res.ok) {

                throw new Error(data.error);

            }

            alert(
                `Imported: ${data.imported}\nSkipped: ${data.skipped}`
            );

            await fetchResults();

            setExcelFile(null);

            setOpenDialog(false);

        } catch (err) {

            console.error(err);

            alert("Excel upload failed");

        } finally {

            setUploadingExcel(false);

        }

    };

    useEffect(() => {

        fetchResults();

    }, [
        filterSession,
        filterDepartment,
        filterSemester,
        filterSubject,
    ]);

    useEffect(() => {

        fetchSubjects();

    }, []);

    const filteredResults = useMemo(() => {

        return results.filter((r) => {

            const matchesSearch =
                r.studentName
                    ?.toLowerCase()
                    .includes(search.toLowerCase());

            const matchesSession =
                !filterSession ||
                r.academicSession === filterSession;

            const matchesSemester =
                !filterSemester ||
                String(r.semester) === filterSemester;

            const matchesSubject =
                !filterSubject ||
                String(r.subjectId) === filterSubject;

            return (
                matchesSearch &&
                matchesSession &&
                matchesSemester &&
                matchesSubject
            );

        });

    }, [
        results,
        search,
        filterSession,
        filterSemester,
        filterSubject,
    ]);

    console.log("Filtered Records:", filteredResults.length);
    console.table(filteredResults);

    if (loading) {

        return (
            <LoadingSkeleton
                type="dashboard"
            />
        );

    }

    const totalResults = filteredResults.length;

    const passed = filteredResults.filter(
        (r) => r.passed
    ).length;

    const failed = filteredResults.filter(
        (r) => !r.passed
    ).length;

    const averageMarks =
        filteredResults.length > 0
            ? (
                filteredResults.reduce(
                    (sum, r) =>
                        sum + r.totalMarks,
                    0
                ) / filteredResults.length
            ).toFixed(1)
            : "0";

    return (

        <>

            <div className="space-y-8">

                <div className="flex items-center justify-between">

                    <div>

                        <h1 className="text-3xl font-bold">

                            Results

                        </h1>

                        <p className="text-muted-foreground mt-2">

                            Manage Student Results

                        </p>

                    </div>

                    <Button onClick={() => setOpenDialog(true)}>

                        <Plus className="w-4 h-4 mr-2" />

                        Add Result

                    </Button>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

                    <Card>

                        <CardContent className="p-6">

                            <Users className="mb-2 h-7 w-7 text-primary" />

                            <p className="text-sm text-muted-foreground">

                                Total Results

                            </p>

                            <h2 className="text-3xl font-bold">

                                {totalResults}

                            </h2>

                        </CardContent>

                    </Card>

                    <Card>

                        <CardContent className="p-6">

                            <CheckCircle className="mb-2 h-7 w-7 text-green-600" />

                            <p className="text-sm text-muted-foreground">

                                Passed

                            </p>

                            <h2 className="text-3xl font-bold text-green-600">

                                {passed}

                            </h2>

                        </CardContent>

                    </Card>

                    <Card>

                        <CardContent className="p-6">

                            <Award className="mb-2 h-7 w-7 text-red-600" />

                            <p className="text-sm text-muted-foreground">

                                Failed

                            </p>

                            <h2 className="text-3xl font-bold text-red-600">

                                {failed}

                            </h2>

                        </CardContent>

                    </Card>

                    <Card>

                        <CardContent className="p-6">

                            <Award className="mb-2 h-7 w-7 text-yellow-600" />

                            <p className="text-sm text-muted-foreground">

                                Average %

                            </p>

                            <h2 className="text-3xl font-bold">

                                {averageMarks}

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
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                className="pl-10"
                            />

                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">

                            {/* Academic Session */}

                            <Select
                                value={filterSession}
                                onValueChange={setFilterSession}
                            >

                                <SelectTrigger>

                                    <SelectValue />

                                </SelectTrigger>

                                <SelectContent>

                                    <SelectItem value="2026-27">
                                        2026-27
                                    </SelectItem>

                                    <SelectItem value="2027-28">
                                        2027-28
                                    </SelectItem>

                                </SelectContent>

                            </Select>

                            {/* Department */}

                            <Select
                                value={filterDepartment}
                                onValueChange={setFilterDepartment}
                            >

                                <SelectTrigger>

                                    <SelectValue placeholder="Department" />

                                </SelectTrigger>

                                <SelectContent>

                                    <SelectItem value="1">
                                        Computer Science & Engineering
                                    </SelectItem>

                                    <SelectItem value="2">
                                        Information Technology
                                    </SelectItem>

                                    <SelectItem value="3">
                                        Electronics & Communication
                                    </SelectItem>

                                    <SelectItem value="4">
                                        Mechanical Engineering
                                    </SelectItem>

                                </SelectContent>

                            </Select>

                            {/* Semester */}

                            <Select
                                value={filterSemester}
                                onValueChange={setFilterSemester}
                            >

                                <SelectTrigger>

                                    <SelectValue placeholder="Semester" />

                                </SelectTrigger>

                                <SelectContent>

                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (

                                        <SelectItem
                                            key={s}
                                            value={String(s)}
                                        >
                                            Semester {s}
                                        </SelectItem>

                                    ))}

                                </SelectContent>

                            </Select>

                            {/* Subject */}

                            <Select
                                value={filterSubject}
                                onValueChange={setFilterSubject}
                            >

                                <SelectTrigger>

                                    <SelectValue placeholder="Subject" />

                                </SelectTrigger>

                                <SelectContent>

                                    {subjects
                                        .filter((s) => {

                                            const semesterMatch =
                                                !filterSemester ||
                                                String(s.semester) === filterSemester;

                                            const departmentMatch =
                                                !filterDepartment ||
                                                String(s.departmentId) === filterDepartment;

                                            return semesterMatch && departmentMatch;

                                        })

                                        .map((s) => (

                                            <SelectItem
                                                key={s.id}
                                                value={String(s.id)}
                                            >

                                                {s.name}

                                            </SelectItem>

                                        ))}

                                </SelectContent>

                            </Select>

                        </div>

                    </CardContent>

                </Card>

                <Card>

                    <CardHeader>

                        <CardTitle>

                            Student Results

                        </CardTitle>

                    </CardHeader>

                    <CardContent>

                        <div className="overflow-x-auto">

                            <table className="w-full">

                                <thead>

                                    <tr className="border-b">

                                        <th className="text-left p-3">

                                            Student

                                        </th>

                                        <th className="text-left p-3">

                                            Subject

                                        </th>

                                        <th className="text-center p-3">

                                            Internal

                                        </th>

                                        <th className="text-center p-3">

                                            External

                                        </th>

                                        <th className="text-center p-3">

                                            Total

                                        </th>

                                        <th className="text-center p-3">

                                            Grade

                                        </th>

                                        <th className="text-center p-3">

                                            Status

                                        </th>

                                        <th className="text-center p-3">

                                            Action

                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {filteredResults.map((result) => (

                                        <tr
                                            key={result.id}
                                            className="border-b hover:bg-muted/30 transition-colors"
                                        >

                                            <td className="p-3 font-medium">

                                                {result.studentName}

                                            </td>

                                            <td className="p-3">

                                                {result.subjectName}

                                            </td>

                                            <td className="p-3 text-center">

                                                {result.internalMarks}

                                            </td>

                                            <td className="p-3 text-center">

                                                {result.externalMarks}

                                            </td>

                                            <td className="p-3 text-center font-semibold">

                                                {result.totalMarks}

                                            </td>

                                            <td className="p-3 text-center">

                                                <Badge variant="outline">

                                                    {result.grade}

                                                </Badge>

                                            </td>

                                            <td className="p-3 text-center">

                                                {result.passed ? (

                                                    <Badge className="bg-green-600">

                                                        Pass

                                                    </Badge>

                                                ) : (

                                                    <Badge variant="destructive">

                                                        Fail

                                                    </Badge>

                                                )}

                                            </td>

                                            <td className="p-3">

                                                <div className="flex justify-center gap-2">

                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                    >
                                                        Edit
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                    >
                                                        Delete
                                                    </Button>

                                                </div>

                                            </td>

                                        </tr>

                                    ))}

                                    {filteredResults.length === 0 && (

                                        <tr>

                                            <td
                                                colSpan={8}
                                                className="text-center py-10 text-muted-foreground"
                                            >

                                                No Results Found

                                            </td>

                                        </tr>

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </CardContent>

                </Card>

            </div>
            <Dialog
                open={openDialog}
                onOpenChange={setOpenDialog}
            >

                <DialogContent className="sm:max-w-lg">

                    <DialogHeader>

                        <DialogTitle>

                            Add Result

                        </DialogTitle>

                    </DialogHeader>

                    <div className="space-y-5">

                        <div>

                            <Label>Academic Session</Label>

                            <Select
                                value={academicSession}
                                onValueChange={setAcademicSession}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="2026-27">
                                        2026-27
                                    </SelectItem>

                                    <SelectItem value="2027-28">
                                        2027-28
                                    </SelectItem>
                                </SelectContent>

                            </Select>

                        </div>

                        <div>

                            <Label>Department</Label>

                            <Select
                                value={departmentId}
                                onValueChange={setDepartmentId}
                            >

                                <SelectTrigger>

                                    <SelectValue placeholder="Select Department" />

                                </SelectTrigger>

                                <SelectContent>

                                    <SelectItem value="1">
                                        Computer Science & Engineering
                                    </SelectItem>

                                    <SelectItem value="2">
                                        Information Technology
                                    </SelectItem>

                                    <SelectItem value="3">
                                        Electronics & Communication
                                    </SelectItem>

                                    <SelectItem value="4">
                                        Mechanical Engineering
                                    </SelectItem>

                                </SelectContent>

                            </Select>

                        </div>

                        <div>

                            <Label>Semester</Label>

                            <Select
                                value={semester}
                                onValueChange={(value) => {

                                    setSemester(value);

                                    setSubjectId("");

                                }}
                            >

                                <SelectTrigger>

                                    <SelectValue placeholder="Select Semester" />

                                </SelectTrigger>

                                <SelectContent>

                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (

                                        <SelectItem
                                            key={sem}
                                            value={String(sem)}
                                        >
                                            Semester {sem}
                                        </SelectItem>

                                    ))}

                                </SelectContent>

                            </Select>

                        </div>

                        <div>

                            <Label>Subject</Label>

                            <Select
                                value={subjectId}
                                onValueChange={setSubjectId}
                            >

                                <SelectTrigger>

                                    <SelectValue placeholder="Select Subject" />

                                </SelectTrigger>

                                <SelectContent>

                                    {subjects

                                        .filter((subject) => {

                                            return (

                                                String(subject.departmentId) === departmentId &&

                                                String(subject.semester) === semester

                                            );

                                        })

                                        .map((subject) => (

                                            <SelectItem
                                                key={subject.id}
                                                value={String(subject.id)}
                                            >

                                                {subject.name}

                                            </SelectItem>

                                        ))}

                                </SelectContent>

                            </Select>

                        </div>

                        {/* <div>

                            <Label>Select Student</Label>

                            <select
                                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                value={studentId}
                                onChange={(e) => {
                                    const id = e.target.value;

                                    setStudentId(id);

                                    const student = students.find(
                                        (s) => String(s.id) === id
                                    );

                                    if (student) {
                                        setSemester(String(student.semester));
                                        setDepartmentId(String(student.departmentId));
                                    }
                                }}
                            >

                                <option value="">
                                    Select Student
                                </option>

                                {students.map((student) => (

                                    <option
                                        key={student.id}
                                        value={student.id}
                                    >
                                        {student.name} ({student.rollNumber})
                                    </option>

                                ))}

                            </select>

                        </div> */}

                        {/* <div>

                            <Label>Select Subject</Label>

                            <select
                                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                value={subjectId}
                                onChange={(e) =>
                                    setSubjectId(e.target.value)
                                }
                            >

                                <option value="">
                                    Select Subject
                                </option>

                                {subjects
                                    .filter((s) => {

                                        if (!semester) return true;

                                        return (
                                            String(s.semester) === semester &&
                                            String(s.departmentId) === departmentId
                                        );

                                    })
                                    .map((subject) => (

                                        <option
                                            key={subject.id}
                                            value={subject.id}
                                        >
                                            {subject.name}
                                        </option>

                                    ))}

                            </select>

                        </div>

                        <div>

                            <Label>

                                Semester

                            </Label>

                            <Select
                                value={semester}
                                onValueChange={setSemester}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Semester" />
                                </SelectTrigger>

                                <SelectContent>

                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                        <SelectItem
                                            key={sem}
                                            value={String(sem)}
                                        >
                                            Semester {sem}
                                        </SelectItem>
                                    ))}

                                </SelectContent>

                            </Select>

                        </div>

                        <div className="grid grid-cols-2 gap-4">

                            <div>

                                <Label>

                                    Internal Marks

                                </Label>

                                <Input
                                    type="number"
                                    value={internalMarks}
                                    onChange={(e) =>
                                        setInternalMarks(
                                            e.target.value
                                        )
                                    }
                                />

                            </div>

                            <div>

                                <Label>

                                    External Marks

                                </Label>

                                <Input
                                    type="number"
                                    value={externalMarks}
                                    onChange={(e) =>
                                        setExternalMarks(
                                            e.target.value
                                        )
                                    }
                                />

                            </div> */}

                        {/* </div> */}

                    </div>

                    <div className="border-t pt-5 mt-5">

                        <Label className="text-base font-semibold">

                            Import Results from Excel

                        </Label>

                        <div className="mt-3 space-y-3">

                            <Input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={(e) => {

                                    if (e.target.files?.length) {

                                        setExcelFile(
                                            e.target.files[0]
                                        );

                                    }

                                }}
                            />

                            <Button
                                type="button"
                                variant="secondary"
                                onClick={uploadExcel}
                                disabled={
                                    uploadingExcel
                                }
                            >

                                {uploadingExcel
                                    ? "Uploading..."
                                    : "Upload Excel"}

                            </Button>

                        </div>

                    </div>

                    <DialogFooter>

                        <Button
                            variant="outline"
                            onClick={() =>
                                setOpenDialog(false)
                            }
                        >

                            Cancel

                        </Button>

                        <Button
                            type="button"
                            onClick={uploadExcel}
                            disabled={uploadingExcel}
                        >
                            {uploadingExcel ? "Uploading..." : "Upload Excel"}
                        </Button>
                    </DialogFooter>

                </DialogContent>

            </Dialog>
        </>

    );

}