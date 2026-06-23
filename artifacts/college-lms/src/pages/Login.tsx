import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { GraduationCap, Users, ShieldAlert, BookOpen, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const { login, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("student1@example.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (value: string) => {
    setRole(value);
    // Auto-fill hints for demo purposes
    if (value === "student") {
      setEmail("student1@example.com");
    } else if (value === "faculty") {
      setEmail("faculty1@example.com");
    } else if (value === "admin") {
      setEmail("admin@example.com");
    } else if (value === "hod") {
      setEmail("hod.cs@example.com");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login({ email, password, role });
      toast.success("Successfully logged in");
      // Redirect happens in AuthContext
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <div className="bg-primary/20 p-3 rounded-xl border border-primary/30">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground"
        >
          Sign in to your account
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-2 text-center text-sm text-muted-foreground"
        >
          Access your personalized dashboard
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <Card className="bg-card/50 backdrop-blur-xl border-card-border shadow-2xl">
          <CardHeader className="pb-4">
            <Tabs defaultValue="student" className="w-full" onValueChange={handleRoleChange}>
              <TabsList className="grid w-full grid-cols-4 bg-background/50 border border-border">
                <TabsTrigger value="student" className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <BookOpen className="w-3 h-3 mr-1.5 hidden sm:inline-block" /> Student
                </TabsTrigger>
                <TabsTrigger value="faculty" className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <Users className="w-3 h-3 mr-1.5 hidden sm:inline-block" /> Faculty
                </TabsTrigger>
                <TabsTrigger value="admin" className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <ShieldAlert className="w-3 h-3 mr-1.5 hidden sm:inline-block" /> Admin
                </TabsTrigger>
                <TabsTrigger value="hod" className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <GraduationCap className="w-3 h-3 mr-1.5 hidden sm:inline-block" /> HOD
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 focus:bg-background transition-colors"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50 focus:bg-background transition-colors"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full font-semibold" 
                disabled={loading || authLoading}
              >
                {loading || authLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/50 pt-4 pb-4">
            <p className="text-xs text-muted-foreground">
              Demo accounts: student1@ / faculty1@ / admin@ / hod.cs@ (password: password123)
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
