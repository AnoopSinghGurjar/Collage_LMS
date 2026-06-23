import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Building2, 
  BookOpen, 
  Calendar, 
  Bell, 
  CalendarDays,
  LogOut,
  Menu,
  CheckSquare,
  FileText,
  HelpCircle,
  FileBarChart,
  FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/faculty", label: "Faculty", icon: GraduationCap },
  { href: "/admin/departments", label: "Departments", icon: Building2 },
  { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
  { href: "/admin/timetable", label: "Timetable", icon: Calendar },
  { href: "/admin/notices", label: "Notices", icon: Bell },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/leaves", label: "Leaves", icon: CheckSquare },
];

const studentNav = [
  { href: "/student", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/attendance", label: "Attendance", icon: CheckSquare },
  { href: "/student/timetable", label: "Timetable", icon: Calendar },
  { href: "/student/assignments", label: "Assignments", icon: FileText },
  { href: "/student/quizzes", label: "Quizzes", icon: HelpCircle },
  { href: "/student/results", label: "Results", icon: FileBarChart },
  { href: "/student/materials", label: "Materials", icon: FolderOpen },
  { href: "/student/notices", label: "Notices", icon: Bell },
  { href: "/student/leaves", label: "Leaves", icon: CalendarDays },
];

const facultyNav = [
  { href: "/faculty", label: "Dashboard", icon: LayoutDashboard },
  { href: "/faculty/attendance", label: "Attendance", icon: CheckSquare },
  { href: "/faculty/assignments", label: "Assignments", icon: FileText },
  { href: "/faculty/quizzes", label: "Quizzes", icon: HelpCircle },
  { href: "/faculty/materials", label: "Materials", icon: FolderOpen },
  { href: "/faculty/results", label: "Results", icon: FileBarChart },
  { href: "/faculty/timetable", label: "Timetable", icon: Calendar },
  { href: "/faculty/notices", label: "Notices", icon: Bell },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  let navItems = [];
  if (user?.role === "admin" || user?.role === "hod") navItems = adminNav;
  else if (user?.role === "student") navItems = studentNav;
  else if (user?.role === "faculty") navItems = facultyNav;

  const NavLinks = () => (
    <div className="space-y-1 py-4">
      {navItems.map((item) => {
        const isActive = location === item.href || location.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href}>
            <span
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden absolute top-4 left-4 z-40">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-sidebar p-0 border-r-sidebar-border text-sidebar-foreground">
          <div className="flex h-full flex-col px-3 py-4">
            <div className="flex items-center px-3 mb-6">
              <GraduationCap className="h-6 w-6 text-primary mr-2" />
              <h1 className="text-xl font-bold tracking-tight text-white">LMS</h1>
            </div>
            <div className="flex-1 overflow-auto">
              <NavLinks />
            </div>
            <div className="mt-auto border-t border-sidebar-border p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">{user?.name}</span>
                  <span className="text-xs text-sidebar-foreground/70 capitalize">{user?.role}</span>
                </div>
              </div>
              <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:text-white hover:bg-sidebar-accent" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex h-14 items-center px-6 border-b border-sidebar-border">
          <GraduationCap className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-xl font-bold tracking-tight text-white">LMS Platform</h1>
        </div>
        <div className="flex-1 overflow-auto px-3 py-4">
          <NavLinks />
        </div>
        <div className="mt-auto border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-white truncate">{user?.name}</span>
              <span className="text-xs text-sidebar-foreground/70 capitalize truncate">{user?.role}</span>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:text-white hover:bg-sidebar-accent" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </>
  );
}
