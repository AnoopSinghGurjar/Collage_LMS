import React, { useState } from 'react';
import { useListQuizzes, useGetQuiz, useSubmitQuizAttempt } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/Modal';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentQuizzes() {
  const { studentId } = useAuth();
  const { data: quizzes, isLoading: loadingQuizzes } = useListQuizzes();
  
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{score: number, total: number} | null>(null);

  const { data: activeQuiz, isLoading: loadingQuiz } = useGetQuiz(
    activeQuizId!, 
    { query: { enabled: !!activeQuizId } }
  );

  const submitAttempt = useSubmitQuizAttempt({
    mutation: {
      onSuccess: (data) => {
        setResult({ score: data.score, total: data.totalMarks || 0 });
        toast.success("Quiz submitted successfully!");
      }
    }
  });

  const handleStartQuiz = (id: number) => {
    setActiveQuizId(id);
    setAnswers({});
    setResult(null);
  };

  const handleSubmitQuiz = () => {
    if (!activeQuiz || !studentId) return;
    
    // Format answers array based on questions
    const answerArray = (activeQuiz.questions || []).map(q => 
      answers[q.id] !== undefined ? answers[q.id] : -1
    );

    submitAttempt.mutate({
      id: activeQuiz.id,
      data: {
        studentId,
        answers: answerArray
      }
    });
  };

  if (loadingQuizzes) return <LoadingSkeleton type="dashboard" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Active Quizzes</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes?.map(quiz => (
          <Card key={quiz.id} className="bg-card border-card-border flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="secondary">{quiz.subjectName}</Badge>
                {quiz.isActive ? (
                  <Badge className="bg-success hover:bg-success text-success-foreground flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live</Badge>
                ) : (
                  <Badge variant="outline">Closed</Badge>
                )}
              </div>
              <CardTitle className="text-lg leading-tight">{quiz.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground line-clamp-2">{quiz.description}</p>
              
              <div className="mt-4 flex gap-4 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Clock className="w-4 h-4 mr-1.5" />
                  {quiz.durationMinutes} mins
                </div>
                <div className="flex items-center text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  {quiz.totalMarks} Marks
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t border-border">
              <Button 
                className="w-full" 
                disabled={!quiz.isActive}
                onClick={() => handleStartQuiz(quiz.id)}
              >
                {quiz.isActive ? "Take Quiz" : "Currently Unavailable"}
              </Button>
            </CardFooter>
          </Card>
        ))}
        {(!quizzes || quizzes.length === 0) && (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-card/30">
            No quizzes available at the moment.
          </div>
        )}
      </div>

      {/* Quiz Modal */}
      <Modal 
        open={!!activeQuizId} 
        onOpenChange={(open) => {
          if (!open) {
            if (!result && Object.keys(answers).length > 0 && !confirm("Are you sure you want to exit? Your progress will be lost.")) {
              return;
            }
            setActiveQuizId(null);
          }
        }} 
        title={activeQuiz?.title || "Loading Quiz..."}
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        {loadingQuiz ? (
          <div className="py-12 flex justify-center"><LoadingSkeleton type="table" /></div>
        ) : result ? (
          <div className="py-12 flex flex-col items-center text-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center text-success mb-4">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold">Quiz Submitted!</h3>
            <p className="text-muted-foreground">You scored</p>
            <div className="text-5xl font-black text-primary">{result.score} <span className="text-2xl text-muted-foreground font-medium">/ {result.total}</span></div>
            <Button className="mt-8" onClick={() => setActiveQuizId(null)}>Back to Quizzes</Button>
          </div>
        ) : (
          <div className="space-y-8 pt-4">
            <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center text-warning font-mono font-medium">
                <Clock className="w-4 h-4 mr-2" />
                {activeQuiz?.durationMinutes}:00 remaining
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                {Object.keys(answers).length} of {activeQuiz?.questions?.length || 0} answered
              </div>
            </div>

            <div className="space-y-8">
              {activeQuiz?.questions?.map((q, idx) => (
                <div key={q.id} className="space-y-4 border-b border-border pb-6 last:border-0">
                  <h4 className="font-medium text-base">
                    <span className="text-muted-foreground mr-2">{idx + 1}.</span> 
                    {q.question}
                  </h4>
                  <RadioGroup 
                    value={answers[q.id]?.toString() || ""} 
                    onValueChange={(val) => setAnswers({...answers, [q.id]: parseInt(val)})}
                    className="space-y-3 pl-6"
                  >
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center space-x-3 bg-muted/10 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                        <RadioGroupItem value={optIdx.toString()} id={`q${q.id}-opt${optIdx}`} />
                        <Label htmlFor={`q${q.id}-opt${optIdx}`} className="flex-1 cursor-pointer font-normal leading-relaxed">{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-border gap-4 items-center">
              <span className="text-xs text-muted-foreground flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                You cannot change answers after submission
              </span>
              <Button 
                onClick={handleSubmitQuiz} 
                disabled={submitAttempt.isPending || Object.keys(answers).length === 0}
              >
                {submitAttempt.isPending ? "Submitting..." : "Submit Quiz"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
