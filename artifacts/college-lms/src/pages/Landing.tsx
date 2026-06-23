import React from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Users, BookOpen, GraduationCap, BarChart3, Bell } from "lucide-react";

export default function Landing() {
  const features = [
    { title: "Attendance Tracking", desc: "Automated tracking and reporting for seamless monitoring.", icon: <CheckCircle2 className="w-6 h-6 text-primary" /> },
    { title: "Smart Assignments", desc: "Digital submissions, auto-grading, and plagiarism checks.", icon: <BookOpen className="w-6 h-6 text-primary" /> },
    { title: "Live Quizzes", desc: "Real-time assessments with instant feedback and analytics.", icon: <CheckCircle2 className="w-6 h-6 text-primary" /> },
    { title: "Grade Analytics", desc: "Comprehensive performance insights and trend analysis.", icon: <BarChart3 className="w-6 h-6 text-primary" /> },
    { title: "Notice Board", desc: "Instant campus-wide announcements and targeted alerts.", icon: <Bell className="w-6 h-6 text-primary" /> },
    { title: "Resource Library", desc: "Centralized repository for all course materials and notes.", icon: <BookOpen className="w-6 h-6 text-primary" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <header className="absolute inset-x-0 top-0 z-50 flex items-center justify-between p-6 lg:px-8">
        <div className="flex items-center gap-x-3">
          <div className="bg-primary/20 p-2 rounded-lg">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">LMS Platform</span>
        </div>
        <div className="flex items-center gap-x-4">
          <Link href="/login">
            <Button variant="ghost" className="text-muted-foreground hover:text-white">Log in</Button>
          </Link>
          <Link href="/login">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <div className="relative isolate pt-32 lg:pt-48 pb-20 sm:pb-32 overflow-hidden">
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }} />
          </div>

          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="mx-auto max-w-3xl"
            >
              <div className="hidden sm:mb-8 sm:flex sm:justify-center">
                <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-muted-foreground ring-1 ring-white/10 hover:ring-white/20 transition-all">
                  Announcing our next generation platform.{' '}
                  <Link href="/login"><span className="font-semibold text-primary cursor-pointer"><span className="absolute inset-0" aria-hidden="true" />Read more <span aria-hidden="true">&rarr;</span></span></Link>
                </div>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
                The Modern LMS for Forward-Thinking Colleges
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
                Elevate your institution's digital experience. A unified platform for administration, faculty, and students that feels less like software and more like magic.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link href="/login">
                  <Button size="lg" className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold">
                    Get Started Now
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="ghost" size="lg" className="h-12 px-8 text-base font-semibold text-white hover:bg-white/10">
                    Watch Demo <span aria-hidden="true" className="ml-2">&rarr;</span>
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12 border-y border-white/5 bg-white/[0.02]">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-4">
            {[
              { id: 1, name: 'Active Students', value: '1,000+' },
              { id: 2, name: 'Faculty Members', value: '50+' },
              { id: 3, name: 'Departments', value: '4' },
              { id: 4, name: 'Satisfaction Rate', value: '95%' },
            ].map((stat) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                key={stat.id} 
                className="mx-auto flex max-w-xs flex-col gap-y-4"
              >
                <dt className="text-base leading-7 text-muted-foreground">{stat.name}</dt>
                <dd className="order-first text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  {stat.value}
                </dd>
              </motion.div>
            ))}
          </dl>
        </div>

        {/* Features */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
          <div className="mx-auto max-w-2xl lg:text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-primary">Everything you need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              A complete toolkit for modern education
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  key={feature.title} 
                  className="flex flex-col rounded-2xl bg-card p-8 border border-card-border hover:border-primary/30 transition-colors"
                >
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10">
                      {feature.icon}
                    </div>
                    {feature.title}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                    <p className="flex-auto">{feature.desc}</p>
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="mt-32 border-t border-white/10 bg-card py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-bold text-white text-lg">LMS Platform</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} LMS Platform, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
