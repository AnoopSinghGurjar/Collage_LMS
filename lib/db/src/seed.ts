import { db, usersTable, departmentsTable, studentsTable, facultyTable, subjectsTable, timetableTable, assignmentsTable, quizzesTable, resultsTable, materialsTable, noticesTable, eventsTable, attendanceTable } from "./index";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function hash(pwd: string) {
  return crypto.createHash("sha256").update(pwd + "lms_salt").digest("hex");
}

async function main() {
  console.log("Seeding database...");

  // Clear existing data (order matters due to deps)
  await db.delete(attendanceTable);
  await db.delete(resultsTable);
  await db.delete(quizzesTable);
  await db.delete(assignmentsTable);
  await db.delete(timetableTable);
  await db.delete(materialsTable);
  await db.delete(noticesTable);
  await db.delete(eventsTable);
  await db.delete(studentsTable);
  await db.delete(facultyTable);
  await db.delete(subjectsTable);
  await db.delete(departmentsTable);
  await db.delete(usersTable);

  // Departments
  const depts = await db.insert(departmentsTable).values([
    { name: "Computer Science & Engineering", code: "CSE" },
    { name: "Electronics & Communication", code: "ECE" },
    { name: "Mechanical Engineering", code: "MECH" },
    { name: "Civil Engineering", code: "CIVIL" },
  ]).returning();
  const [cse, ece, mech, civil] = depts;

  // Admin user
  const [adminUser] = await db.insert(usersTable).values({
    name: "Dr. Rajesh Kumar",
    email: "admin@college.edu",
    passwordHash: hash("admin123"),
    role: "admin",
  }).returning();

  // HOD users
  const [hodCseUser] = await db.insert(usersTable).values({
    name: "Dr. Priya Sharma",
    email: "hod.cse@college.edu",
    passwordHash: hash("hod123"),
    role: "hod",
    departmentId: cse.id,
  }).returning();
  await db.update(departmentsTable).set({ hodId: hodCseUser.id }).where(eq(departmentsTable.id, cse.id));

  const [hodEceUser] = await db.insert(usersTable).values({
    name: "Dr. Anil Mehta",
    email: "hod.ece@college.edu",
    passwordHash: hash("hod123"),
    role: "hod",
    departmentId: ece.id,
  }).returning();
  await db.update(departmentsTable).set({ hodId: hodEceUser.id }).where(eq(departmentsTable.id, ece.id));

  // Faculty
  const facultyData = [
    { name: "Prof. Anita Verma", email: "anita.verma@college.edu", empId: "FAC001", designation: "Assistant Professor", deptId: cse.id },
    { name: "Prof. Suresh Nair", email: "suresh.nair@college.edu", empId: "FAC002", designation: "Associate Professor", deptId: cse.id },
    { name: "Prof. Meena Pillai", email: "meena.pillai@college.edu", empId: "FAC003", designation: "Assistant Professor", deptId: ece.id },
    { name: "Prof. Ramesh Gupta", email: "ramesh.gupta@college.edu", empId: "FAC004", designation: "Professor", deptId: mech.id },
  ];

  const facultyRecords: Array<{ id: number; userId: number; departmentId: number }> = [];
  for (const f of facultyData) {
    const [user] = await db.insert(usersTable).values({
      name: f.name, email: f.email, passwordHash: hash("faculty123"), role: "faculty", departmentId: f.deptId,
    }).returning();
    const [fac] = await db.insert(facultyTable).values({
      userId: user.id, employeeId: f.empId, designation: f.designation, departmentId: f.deptId,
      phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
    }).returning();
    facultyRecords.push({ id: fac.id, userId: user.id, departmentId: f.deptId });
  }
  const [fac1, fac2, fac3, fac4] = facultyRecords;

  // Subjects
  const subjects = await db.insert(subjectsTable).values([
    { name: "Data Structures & Algorithms", code: "CSE301", credits: 4, semester: 3, departmentId: cse.id, facultyId: fac1.id },
    { name: "Database Management Systems", code: "CSE302", credits: 3, semester: 3, departmentId: cse.id, facultyId: fac2.id },
    { name: "Operating Systems", code: "CSE303", credits: 3, semester: 3, departmentId: cse.id, facultyId: fac1.id },
    { name: "Computer Networks", code: "CSE401", credits: 3, semester: 4, departmentId: cse.id, facultyId: fac2.id },
    { name: "Software Engineering", code: "CSE402", credits: 3, semester: 4, departmentId: cse.id, facultyId: fac1.id },
    { name: "Digital Electronics", code: "ECE301", credits: 4, semester: 3, departmentId: ece.id, facultyId: fac3.id },
    { name: "Signals & Systems", code: "ECE302", credits: 3, semester: 3, departmentId: ece.id, facultyId: fac3.id },
    { name: "Thermodynamics", code: "MECH301", credits: 4, semester: 3, departmentId: mech.id, facultyId: fac4.id },
  ]).returning();
  const [dsa, dbms, os, cn, se, de, ss, thermo] = subjects;

  // Timetable
  await db.insert(timetableTable).values([
    { subjectId: dsa.id, facultyId: fac1.id, dayOfWeek: "Monday", startTime: "09:00", endTime: "10:00", room: "CS-101", semester: 3, departmentId: cse.id },
    { subjectId: dbms.id, facultyId: fac2.id, dayOfWeek: "Monday", startTime: "10:00", endTime: "11:00", room: "CS-102", semester: 3, departmentId: cse.id },
    { subjectId: os.id, facultyId: fac1.id, dayOfWeek: "Tuesday", startTime: "09:00", endTime: "10:00", room: "CS-101", semester: 3, departmentId: cse.id },
    { subjectId: dsa.id, facultyId: fac1.id, dayOfWeek: "Wednesday", startTime: "09:00", endTime: "10:00", room: "CS-101", semester: 3, departmentId: cse.id },
    { subjectId: dbms.id, facultyId: fac2.id, dayOfWeek: "Thursday", startTime: "10:00", endTime: "11:00", room: "CS-102", semester: 3, departmentId: cse.id },
    { subjectId: os.id, facultyId: fac1.id, dayOfWeek: "Friday", startTime: "09:00", endTime: "10:00", room: "CS-103", semester: 3, departmentId: cse.id },
    { subjectId: cn.id, facultyId: fac2.id, dayOfWeek: "Monday", startTime: "09:00", endTime: "10:00", room: "CS-201", semester: 4, departmentId: cse.id },
    { subjectId: de.id, facultyId: fac3.id, dayOfWeek: "Monday", startTime: "09:00", endTime: "10:00", room: "EC-101", semester: 3, departmentId: ece.id },
    { subjectId: cn.id, facultyId: fac2.id, dayOfWeek: "Tuesday", startTime: "11:15", endTime: "12:15", room: "CS-201", semester: 4, departmentId: cse.id },
    { subjectId: se.id, facultyId: fac1.id, dayOfWeek: "Wednesday", startTime: "14:00", endTime: "15:00", room: "CS-202", semester: 4, departmentId: cse.id },
  ]);

  // Students
  const studentNames = [
    "Arjun Patel", "Priya Sharma", "Rahul Gupta", "Sneha Iyer", "Vikram Singh",
    "Ananya Krishnan", "Rohan Mehta", "Divya Nair", "Aakash Joshi", "Kavya Reddy",
    "Siddharth Kumar", "Riya Desai", "Harsh Agarwal",
  ];

  const studentRecords: Array<{ id: number; userId: number; departmentId: number; semester: number }> = [];
  for (let i = 0; i < studentNames.length; i++) {
    const deptId = i < 10 ? cse.id : (i < 12 ? ece.id : mech.id);
    const semester = [3, 3, 5, 3, 4, 3, 5, 3, 4, 3, 3, 3, 5][i];
    const email = studentNames[i].toLowerCase().replace(" ", ".") + "@student.college.edu";
    const roll = `${deptId === cse.id ? "CSE" : deptId === ece.id ? "ECE" : "MECH"}2024${String(i + 1).padStart(3, "0")}`;

    const [user] = await db.insert(usersTable).values({
      name: studentNames[i], email, passwordHash: hash("student123"), role: "student", departmentId: deptId,
    }).returning();
    const [student] = await db.insert(studentsTable).values({
      userId: user.id, rollNumber: roll, semester, departmentId: deptId,
      phone: `+91 90${Math.floor(10000000 + Math.random() * 90000000)}`,
    }).returning();
    studentRecords.push({ id: student.id, userId: user.id, departmentId: deptId, semester });
  }

  // Attendance
  const cseStudents = studentRecords.filter((s) => s.departmentId === cse.id && s.semester === 3);
  const cseSubjects = [dsa.id, dbms.id, os.id];
  const today = new Date();

  for (let day = 1; day <= 20; day++) {
    const d = new Date(today);
    d.setDate(today.getDate() - day);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    const dateStr = d.toISOString().split("T")[0];
    for (const student of cseStudents) {
      for (const subjectId of cseSubjects) {
        const status = Math.random() > 0.18 ? "present" : "absent";
        await db.insert(attendanceTable).values({ studentId: student.id, subjectId, date: dateStr, status, markedBy: fac1.id });
      }
    }
  }

  // Assignments
  const dueDate = new Date(today.getTime() + 7 * 86400000).toISOString().split("T")[0];
  const pastDue = new Date(today.getTime() - 3 * 86400000).toISOString().split("T")[0];

  await db.insert(assignmentsTable).values([
    { title: "DSA Lab - Implement AVL Tree", description: "Implement insertion, deletion, and rotation for AVL Tree in C++. Include complexity analysis.", subjectId: dsa.id, facultyId: fac1.id, dueDate, maxMarks: 50, semester: 3 },
    { title: "DBMS - ER Diagram Design", description: "Design a comprehensive ER diagram for a hospital management system with all entities, attributes, and relationships.", subjectId: dbms.id, facultyId: fac2.id, dueDate, maxMarks: 30, semester: 3 },
    { title: "OS - Process Scheduling Analysis", description: "Compare FCFS, SJF, and Round Robin scheduling algorithms with given workloads.", subjectId: os.id, facultyId: fac1.id, dueDate: pastDue, maxMarks: 40, semester: 3 },
    { title: "CN - Networking Protocols Study", description: "TCP/IP vs OSI model analysis with Wireshark packet capture.", subjectId: cn.id, facultyId: fac2.id, dueDate, maxMarks: 25, semester: 4 },
    { title: "SE - Software Requirements Document", description: "Write a detailed SRS for a college ERP system following IEEE 830 standards.", subjectId: se.id, facultyId: fac1.id, dueDate, maxMarks: 50, semester: 4 },
  ]);

  // Quizzes
  await db.insert(quizzesTable).values([
    {
      title: "DSA Mid-Term Quiz",
      description: "Covers sorting algorithms, trees, and graph traversal",
      subjectId: dsa.id, facultyId: fac1.id, durationMinutes: 20, totalMarks: 10, semester: 3, isActive: true,
      questions: [
        { id: 1, question: "What is the time complexity of Quick Sort (average case)?", options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"], correctOption: 1, marks: 2 },
        { id: 2, question: "Which data structure is used in BFS traversal?", options: ["Stack", "Queue", "Tree", "Heap"], correctOption: 1, marks: 2 },
        { id: 3, question: "Height of a balanced BST with n nodes?", options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"], correctOption: 2, marks: 2 },
        { id: 4, question: "Which sorting algorithm is stable?", options: ["Quick Sort", "Heap Sort", "Merge Sort", "Selection Sort"], correctOption: 2, marks: 2 },
        { id: 5, question: "Inorder traversal of BST gives?", options: ["Unsorted sequence", "Sorted sequence", "Reverse sorted", "Random"], correctOption: 1, marks: 2 },
      ],
    },
    {
      title: "DBMS Normalization Quiz",
      description: "1NF, 2NF, 3NF, and BCNF concepts",
      subjectId: dbms.id, facultyId: fac2.id, durationMinutes: 15, totalMarks: 5, semester: 3, isActive: true,
      questions: [
        { id: 1, question: "In BCNF, every determinant must be a?", options: ["Primary Key", "Foreign Key", "Candidate Key", "Super Key"], correctOption: 2, marks: 1 },
        { id: 2, question: "2NF eliminates which dependency?", options: ["Transitive", "Partial", "Full", "Multivalued"], correctOption: 1, marks: 1 },
        { id: 3, question: "4NF deals with?", options: ["Partial deps", "Transitive deps", "Multivalued deps", "Join deps"], correctOption: 2, marks: 1 },
        { id: 4, question: "ACID stands for?", options: ["Atomicity, Concurrency, Isolation, Durability", "Atomicity, Consistency, Isolation, Durability", "Atomicity, Consistency, Integrity, Durability", "None"], correctOption: 1, marks: 1 },
        { id: 5, question: "SQL is?", options: ["Procedural", "Non-procedural", "Both", "Object-oriented"], correctOption: 1, marks: 1 },
      ],
    },
  ]);

  // Results for CSE sem 3 students
  const resultData = [];
  for (const student of cseStudents.slice(0, 6)) {
    for (const subject of [dsa, dbms, os]) {
      const internal = Math.floor(20 + Math.random() * 30);
      const external = Math.floor(40 + Math.random() * 50);
      const total = internal + external;
      const pct = (total / 130) * 100;
      const grade = pct >= 90 ? "O" : pct >= 80 ? "A+" : pct >= 70 ? "A" : pct >= 60 ? "B+" : pct >= 50 ? "B" : pct >= 40 ? "C" : "F";
      resultData.push({ studentId: student.id, subjectId: subject.id, semester: 3, internalMarks: String(internal), externalMarks: String(external), totalMarks: String(total), grade, passed: pct >= 40 });
    }
  }
  if (resultData.length > 0) await db.insert(resultsTable).values(resultData);

  // Materials
  await db.insert(materialsTable).values([
    { title: "DSA Lecture Notes - Module 1", description: "Arrays, linked lists, stacks and queues", subjectId: dsa.id, type: "pdf", uploadedBy: fac1.userId, semester: 3 },
    { title: "DBMS ER Diagrams Reference", description: "Complete ER modeling reference with examples", subjectId: dbms.id, type: "pdf", uploadedBy: fac2.userId, semester: 3 },
    { title: "OS Scheduling Algorithms PPT", description: "Slides covering all CPU scheduling algorithms", subjectId: os.id, type: "ppt", uploadedBy: fac1.userId, semester: 3 },
    { title: "DSA - Graph Algorithms Video", description: "Recorded lecture: BFS, DFS, Dijkstra's", subjectId: dsa.id, type: "video", uploadedBy: fac1.userId, semester: 3 },
    { title: "DBMS Lab Manual", description: "Complete SQL exercises and lab manual", subjectId: dbms.id, type: "notes", uploadedBy: fac2.userId, semester: 3 },
    { title: "CN - Networking Fundamentals", description: "OSI model, TCP/IP protocol suite reference", subjectId: cn.id, type: "pdf", uploadedBy: fac2.userId, semester: 4 },
  ]);

  // Notices
  await db.insert(noticesTable).values([
    { title: "Mid-Term Examinations Schedule Published", content: "Mid-term examinations for Semester 3 & 4 will be held from July 15–22, 2025. Check your department portal for the full timetable. Attendance of 75% is mandatory to appear.", isPinned: true, createdBy: adminUser.id },
    { title: "Tech Fest 2025 — Registrations Open", content: "Annual Technical Festival 'InnoTech 2025' registrations are open. Events: coding competitions, hackathon, robotics challenge, paper presentation. Last date: July 10, 2025.", isPinned: true, createdBy: adminUser.id },
    { title: "Library Extended Hours During Exams", content: "The Central Library will operate 7:00 AM – 10:00 PM on all working days during the examination period. Utilize the digital library resources for exam preparation.", isPinned: false, createdBy: adminUser.id },
    { title: "CSE Department — Guest Lecture on AI/ML", content: "A guest lecture on 'Future of AI in Software Engineering' by Dr. Ramesh Krishnamurthy (Principal Scientist, ISRO). Date: June 28, 2025 | Time: 2:00 PM | Venue: Seminar Hall A.", isPinned: false, departmentId: cse.id, createdBy: hodCseUser.id },
    { title: "Sports Day Registration Open", content: "Annual Sports Day: August 5, 2025. Events: athletics, cricket, basketball, chess. Register at the Sports Office or online portal by July 20, 2025.", isPinned: false, createdBy: adminUser.id },
    { title: "Anti-Ragging Cell — Important Notice", content: "Any act of ragging on campus is a cognizable offence under law. Students experiencing or witnessing ragging should report immediately to the Anti-Ragging Cell (helpline: 1800-XXX-XXXX). Zero tolerance policy enforced.", isPinned: false, createdBy: adminUser.id },
  ]);

  // Events
  const y = new Date().getFullYear();
  await db.insert(eventsTable).values([
    { title: "Mid-Term Examinations", description: "Semester 3 & 4 mid-term exams", startDate: `${y}-07-15`, endDate: `${y}-07-22`, type: "exam" },
    { title: "InnoTech 2025 — Annual Tech Fest", description: "Coding competition, hackathon, robotics, paper presentation", startDate: `${y}-08-10`, endDate: `${y}-08-12`, type: "event" },
    { title: "Independence Day Holiday", description: "National Holiday", startDate: `${y}-08-15`, type: "holiday" },
    { title: "Sports Day", description: "Annual inter-department sports competition", startDate: `${y}-08-05`, type: "event" },
    { title: "End Semester Examinations", description: "Final examinations for all departments", startDate: `${y}-11-20`, endDate: `${y}-12-05`, type: "exam" },
    { title: "Diwali Holidays", description: "Festival holidays", startDate: `${y}-10-20`, endDate: `${y}-10-24`, type: "holiday" },
    { title: "Guest Lecture — AI in Industry", description: "Industry expert on AI applications, CSE Department", startDate: `${y}-06-28`, type: "event", departmentId: cse.id },
    { title: "Republic Day Holiday", description: "National Holiday", startDate: `${y}-01-26`, type: "holiday" },
  ]);

  console.log("\n===================================");
  console.log("Database seeded successfully!");
  console.log("===================================");
  console.log("\nTest login credentials:");
  console.log("  Admin:   admin@college.edu        / admin123");
  console.log("  HOD:     hod.cse@college.edu      / hod123");
  console.log("  Faculty: anita.verma@college.edu  / faculty123");
  console.log("  Student: arjun.patel@student.college.edu / student123");
  console.log("===================================\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
