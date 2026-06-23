import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { login as apiLogin, listStudents, listFaculty, User, LoginInput } from "@workspace/api-client-react";

interface AuthUser extends User {
  avatar?: string | null;
  departmentId?: number | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  studentId?: number;
  facultyId?: number;
}

interface AuthContextType extends AuthState {
  login: (data: LoginInput) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("lms_token");
      const userStr = localStorage.getItem("lms_user");
      const profileIdStr = localStorage.getItem("lms_profile_id");

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          const profileId = profileIdStr ? parseInt(profileIdStr, 10) : undefined;
          
          setState({
            user,
            token,
            studentId: user.role === "student" ? profileId : undefined,
            facultyId: user.role === "faculty" ? profileId : undefined,
          });
        } catch (err) {
          localStorage.removeItem("lms_token");
          localStorage.removeItem("lms_user");
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const res = await apiLogin(data);
      localStorage.setItem("lms_token", res.token);
      localStorage.setItem("lms_user", JSON.stringify(res.user));
      
      let profileId = res.user.id;
      
      try {
        if (res.user.role === "student") {
          const studentsRes = await listStudents({ search: res.user.email });
          if (studentsRes.students && studentsRes.students.length > 0) {
            profileId = studentsRes.students[0].id;
          }
        } else if (res.user.role === "faculty") {
          const facultyRes = await listFaculty({ search: res.user.email });
          if (facultyRes && facultyRes.length > 0) {
            profileId = facultyRes[0].id;
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile ID", err);
      }

      localStorage.setItem("lms_profile_id", profileId.toString());
      
      setState({
        user: res.user,
        token: res.token,
        studentId: res.user.role === "student" ? profileId : undefined,
        facultyId: res.user.role === "faculty" ? profileId : undefined,
      });
      
      if (res.user.role === "admin" || res.user.role === "hod") {
        setLocation("/admin");
      } else if (res.user.role === "student") {
        setLocation("/student");
      } else if (res.user.role === "faculty") {
        setLocation("/faculty");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("lms_token");
    localStorage.removeItem("lms_user");
    localStorage.removeItem("lms_profile_id");
    setState({ user: null, token: null });
    setLocation("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        isAuthenticated: !!state.token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
