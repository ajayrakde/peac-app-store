import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { interviewLevels } from "@shared/constants";
import { 
  BrainCircuit, 
  MessageSquare, 
  Play, 
  RotateCcw, 
  Star, 
  ThumbsUp, 
  ThumbsDown,
  Mic,
  MicOff,
  Clock,
  Target,
  TrendingUp,
  BookOpen
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface InterviewSession {
  id: string;
  jobRole: string;
  difficulty: string;
  questions: Array<{
    id: string;
    question: string;
    type: 'behavioral' | 'technical' | 'situational';
    answer?: string;
    feedback?: {
      score: number;
      strengths: string[];
      improvements: string[];
      suggestions: string;
    };
  }>;
  currentQuestionIndex: number;
  isCompleted: boolean;
  overallScore?: number;
}

interface InterviewFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  suggestions: string;
}

export const InterviewCoach: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [sessionConfig, setSessionConfig] = useState({
    jobRole: "",
    difficulty: "intermediate",
    questionCount: 5
  });
  const { toast } = useToast();

  const startSessionMutation = useMutation({
    mutationFn: async (config: typeof sessionConfig) => {
      return apiRequest<InterviewSession>("/api/interview-coach/start", {
        method: "POST",
        body: config
      });
    },
    onSuccess: (session) => {
      setCurrentSession(session);
      toast({
        title: "Interview session started",
        description: `Prepare for ${session.questions.length} questions about ${session.jobRole}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to start session",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: string }) => {
      return apiRequest<InterviewFeedback>("/api/interview-coach/submit-answer", {
        method: "POST",
        body: { 
          sessionId: currentSession?.id,
          questionId,
          answer 
        }
      });
    },
    onSuccess: (feedback, variables) => {
      if (currentSession) {
        const updatedSession = { ...currentSession };
        const currentQ = updatedSession.questions[updatedSession.currentQuestionIndex];
        currentQ.answer = variables.answer;
        currentQ.feedback = feedback;
        
        setCurrentSession(updatedSession);
        setCurrentAnswer("");
        
        toast({
          title: "Answer submitted",
          description: `Score: ${feedback.score}/10`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit answer",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  });

  const nextQuestion = () => {
    if (currentSession && currentSession.currentQuestionIndex < currentSession.questions.length - 1) {
      setCurrentSession({
        ...currentSession,
        currentQuestionIndex: currentSession.currentQuestionIndex + 1
      });
    } else if (currentSession) {
      // Complete session
      setCurrentSession({
        ...currentSession,
        isCompleted: true,
        overallScore: calculateOverallScore()
      });
    }
  };

  const calculateOverallScore = () => {
    if (!currentSession) return 0;
    const answeredQuestions = currentSession.questions.filter(q => q.feedback);
    if (answeredQuestions.length === 0) return 0;
    const totalScore = answeredQuestions.reduce((sum, q) => sum + (q.feedback?.score || 0), 0);
    return Math.round(totalScore / answeredQuestions.length);
  };

  const resetSession = () => {
    setCurrentSession(null);
    setCurrentAnswer("");
    setIsRecording(false);
  };

  const handleStartSession = () => {
    if (!sessionConfig.jobRole.trim()) {
      toast({
        title: "Job role required",
        description: "Please enter the job role you're preparing for",
        variant: "destructive",
      });
      return;
    }
    startSessionMutation.mutate(sessionConfig);
  };

  const handleSubmitAnswer = () => {
    if (!currentAnswer.trim()) {
      toast({
        title: "Answer required",
        description: "Please provide an answer before submitting",
        variant: "destructive",
      });
      return;
    }

    const currentQuestion = currentSession?.questions[currentSession.currentQuestionIndex];
    if (currentQuestion) {
      submitAnswerMutation.mutate({
        questionId: currentQuestion.id,
        answer: currentAnswer
      });
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'behavioral': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'technical': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'situational': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (!currentSession) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <BrainCircuit className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">AI Interview Coach</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Practice interview questions tailored to your target job role. Get AI-powered feedback 
            on your answers and improve your interview skills with personalized suggestions.
          </p>
        </div>

        <Card className="max-w-2xl mx-auto bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <Target className="h-5 w-5 mr-2 text-primary" />
              Start Interview Practice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="jobRole">Job Role/Position</Label>
              <Input
                id="jobRole"
                placeholder="e.g., Software Developer, Product Manager, Data Scientist"
                value={sessionConfig.jobRole}
                onChange={(e) => setSessionConfig({ ...sessionConfig, jobRole: e.target.value })}
                className="bg-background border-border"
              />
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select 
                value={sessionConfig.difficulty} 
                onValueChange={(value) => setSessionConfig({ ...sessionConfig, difficulty: value })}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {interviewLevels.map((lvl) => (
                    <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="questionCount">Number of Questions</Label>
              <Select 
                value={sessionConfig.questionCount.toString()} 
                onValueChange={(value) => setSessionConfig({ ...sessionConfig, questionCount: parseInt(value) })}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Questions (Quick Practice)</SelectItem>
                  <SelectItem value="5">5 Questions (Standard)</SelectItem>
                  <SelectItem value="8">8 Questions (Comprehensive)</SelectItem>
                  <SelectItem value="10">10 Questions (Full Interview)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleStartSession} 
              disabled={startSessionMutation.isPending}
              className="w-full bg-primary hover:bg-primary-dark text-primary-foreground"
            >
              {startSessionMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Interview Practice
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <MessageSquare className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-medium text-foreground">Behavioral Questions</h3>
              <p className="text-sm text-muted-foreground">Past experiences and soft skills</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <BookOpen className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-medium text-foreground">Technical Questions</h3>
              <p className="text-sm text-muted-foreground">Role-specific knowledge and skills</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-medium text-foreground">Situational Questions</h3>
              <p className="text-sm text-muted-foreground">Problem-solving scenarios</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentSession.isCompleted) {
    const overallScore = currentSession.overallScore || 0;
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className={`text-6xl font-bold ${getScoreColor(overallScore)} mb-2`}>
            {overallScore}/10
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Interview Complete!</h1>
          <p className="text-muted-foreground">
            Great job practicing for the {currentSession.jobRole} position
          </p>
        </div>

        <Card className="max-w-4xl mx-auto bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Session Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{currentSession.questions.length}</div>
                <div className="text-sm text-muted-foreground">Questions Answered</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}/10</div>
                <div className="text-sm text-muted-foreground">Average Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{currentSession.jobRole}</div>
                <div className="text-sm text-muted-foreground">Target Role</div>
              </div>
            </div>

            <Separator className="bg-border" />

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Question Review</h3>
              {currentSession.questions.map((question, index) => (
                <Card key={question.id} className="bg-muted/20 border-border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={getQuestionTypeColor(question.type)}>
                        {question.type}
                      </Badge>
                      {question.feedback && (
                        <div className={`font-bold ${getScoreColor(question.feedback.score)}`}>
                          {question.feedback.score}/10
                        </div>
                      )}
                    </div>
                    <p className="font-medium text-foreground mb-2">{question.question}</p>
                    {question.feedback && (
                      <div className="space-y-2 text-sm">
                        {question.feedback.strengths.length > 0 && (
                          <div>
                            <span className="text-green-600 dark:text-green-400 font-medium">Strengths: </span>
                            <span className="text-muted-foreground">{question.feedback.strengths.join(", ")}</span>
                          </div>
                        )}
                        {question.feedback.improvements.length > 0 && (
                          <div>
                            <span className="text-red-600 dark:text-red-400 font-medium">Areas to improve: </span>
                            <span className="text-muted-foreground">{question.feedback.improvements.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-2 justify-center">
              <Button onClick={resetSession} variant="outline" className="border-border hover:bg-accent">
                <RotateCcw className="h-4 w-4 mr-2" />
                Start New Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = currentSession.questions[currentSession.currentQuestionIndex];
  const progress = ((currentSession.currentQuestionIndex + 1) / currentSession.questions.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Interview Practice Session</h1>
          <p className="text-muted-foreground">{currentSession.jobRole} • {sessionConfig.difficulty}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Question {currentSession.currentQuestionIndex + 1} of {currentSession.questions.length}</div>
          <Progress value={progress} className="w-32" />
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex justify-between items-start">
            <Badge className={getQuestionTypeColor(currentQuestion.type)}>
              {currentQuestion.type} question
            </Badge>
            <Button variant="ghost" size="sm" onClick={resetSession} className="hover:bg-accent">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted/20 rounded-lg border border-border">
              <h2 className="text-lg font-medium text-foreground mb-2">
                {currentQuestion.question}
              </h2>
            </div>

            {currentQuestion.feedback ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center">
                    <ThumbsUp className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                    <span className="font-medium text-green-800 dark:text-green-400">Answer Submitted</span>
                  </div>
                  <div className={`font-bold text-lg ${getScoreColor(currentQuestion.feedback.score)}`}>
                    {currentQuestion.feedback.score}/10
                  </div>
                </div>

                {currentQuestion.feedback.strengths.length > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-800 dark:text-blue-400 mb-2">Strengths</h4>
                    <ul className="space-y-1">
                      {currentQuestion.feedback.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-blue-700 dark:text-blue-300">• {strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentQuestion.feedback.improvements.length > 0 && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <h4 className="font-medium text-orange-800 dark:text-orange-400 mb-2">Areas for Improvement</h4>
                    <ul className="space-y-1">
                      {currentQuestion.feedback.improvements.map((improvement, index) => (
                        <li key={index} className="text-sm text-orange-700 dark:text-orange-300">• {improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentQuestion.feedback.suggestions && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="font-medium text-purple-800 dark:text-purple-400 mb-2">Suggestions</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">{currentQuestion.feedback.suggestions}</p>
                  </div>
                )}

                <Button onClick={nextQuestion} className="w-full bg-primary hover:bg-primary-dark text-primary-foreground">
                  {currentSession.currentQuestionIndex < currentSession.questions.length - 1 ? "Next Question" : "Complete Session"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="answer">Your Answer</Label>
                  <Textarea
                    id="answer"
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Take your time to provide a thoughtful answer..."
                    rows={6}
                    className="bg-background border-border"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={submitAnswerMutation.isPending || !currentAnswer.trim()}
                    className="flex-1 bg-primary hover:bg-primary-dark text-primary-foreground"
                  >
                    {submitAnswerMutation.isPending ? "Analyzing..." : "Submit Answer"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsRecording(!isRecording)}
                    className="border-border hover:bg-accent"
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};