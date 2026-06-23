import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";

// Admin
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminStudents from "@/pages/admin/Students";
import AdminFaculty from "@/pages/admin/Faculty";
import AdminDepartments from "@/pages/admin/Departments";
import AdminSubjects from "@/pages/admin/Subjects";
import AdminTimetable from "@/pages/admin/Timetable";
import AdminNotices from "@/pages/admin/Notices";
import AdminEvents from "@/pages/admin/Events";
import AdminLeaves from "@/pages/admin/Leaves";

// Student
import StudentDashboard from "@/pages/student/Dashboard";
import StudentAttendance from "@/pages/student/Attendance";
import StudentTimetable from "@/pages/student/Timetable";
import StudentAssignments from "@/pages/student/Assignments";
import StudentQuizzes from "@/pages/student/Quizzes";
import StudentResults from "@/pages/student/Results";
import StudentMaterials from "@/pages/student/Materials";
import StudentNotices from "@/pages/student/Notices";
import StudentLeaves from "@/pages/student/Leaves";

// Faculty
import FacultyDashboard from "@/pages/faculty/Dashboard";
import FacultyAttendance from "@/pages/faculty/Attendance";
import FacultyAssignments from "@/pages/faculty/Assignments";
import FacultyQuizzes from "@/pages/faculty/Quizzes";
import FacultyMaterials from "@/pages/faculty/Materials";
import FacultyResults from "@/pages/faculty/Results";
import FacultyTimetable from "@/pages/faculty/Timetable";
import FacultyNotices from "@/pages/faculty/Notices";

import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Switch>
              <Route path="/" component={Landing} />
              <Route path="/login" component={Login} />
              
              {/* Admin Routes */}
              <Route path="/admin">
                <ProtectedRoute allowedRoles={["admin", "hod"]}>
                  <Layout><AdminDashboard /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/students">
                <ProtectedRoute allowedRoles={["admin", "hod"]}>
                  <Layout><AdminStudents /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/faculty">
                <ProtectedRoute allowedRoles={["admin", "hod"]}>
                  <Layout><AdminFaculty /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/departments">
                <ProtectedRoute allowedRoles={["admin", "hod"]}>
                  <Layout><AdminDepartments /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/subjects">
                <ProtectedRoute allowedRoles={["admin", "hod"]}>
                  <Layout><AdminSubjects /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/timetable">
                <ProtectedRoute allowedRoles={["admin", "hod"]}>
                  <Layout><AdminTimetable /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/notices">
                <ProtectedRoute allowedRoles={["admin", "hod"]}>
                  <Layout><AdminNotices /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/events">
                <ProtectedRoute allowedRoles={["admin", "hod"]}>
                  <Layout><AdminEvents /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/leaves">
                <ProtectedRoute allowedRoles={["admin", "hod"]}>
                  <Layout><AdminLeaves /></Layout>
                </ProtectedRoute>
              </Route>

              {/* Student Routes */}
              <Route path="/student">
                <ProtectedRoute allowedRoles={["student"]}>
                  <Layout><StudentDashboard /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/student/attendance">
                <ProtectedRoute allowedRoles={["student"]}>
                  <Layout><StudentAttendance /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/student/timetable">
                <ProtectedRoute allowedRoles={["student"]}>
                  <Layout><StudentTimetable /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/student/assignments">
                <ProtectedRoute allowedRoles={["student"]}>
                  <Layout><StudentAssignments /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/student/quizzes">
                <ProtectedRoute allowedRoles={["student"]}>
                  <Layout><StudentQuizzes /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/student/results">
                <ProtectedRoute allowedRoles={["student"]}>
                  <Layout><StudentResults /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/student/materials">
                <ProtectedRoute allowedRoles={["student"]}>
                  <Layout><StudentMaterials /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/student/notices">
                <ProtectedRoute allowedRoles={["student"]}>
                  <Layout><StudentNotices /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/student/leaves">
                <ProtectedRoute allowedRoles={["student"]}>
                  <Layout><StudentLeaves /></Layout>
                </ProtectedRoute>
              </Route>

              {/* Faculty Routes */}
              <Route path="/faculty">
                <ProtectedRoute allowedRoles={["faculty"]}>
                  <Layout><FacultyDashboard /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/faculty/attendance">
                <ProtectedRoute allowedRoles={["faculty"]}>
                  <Layout><FacultyAttendance /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/faculty/assignments">
                <ProtectedRoute allowedRoles={["faculty"]}>
                  <Layout><FacultyAssignments /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/faculty/quizzes">
                <ProtectedRoute allowedRoles={["faculty"]}>
                  <Layout><FacultyQuizzes /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/faculty/materials">
                <ProtectedRoute allowedRoles={["faculty"]}>
                  <Layout><FacultyMaterials /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/faculty/results">
                <ProtectedRoute allowedRoles={["faculty"]}>
                  <Layout><FacultyResults /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/faculty/timetable">
                <ProtectedRoute allowedRoles={["faculty"]}>
                  <Layout><FacultyTimetable /></Layout>
                </ProtectedRoute>
              </Route>
              <Route path="/faculty/notices">
                <ProtectedRoute allowedRoles={["faculty"]}>
                  <Layout><FacultyNotices /></Layout>
                </ProtectedRoute>
              </Route>

              <Route component={NotFound} />
            </Switch>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
