import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2,
  Rocket,
  Code,
  Zap,
  Github,
  Database,
  Globe,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({
    role: "",
    experience: "",
    goals: [] as string[],
    projectName: "",
    template: "",
  });

  const totalSteps = 4;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const roles = [
    { id: "developer", label: "Developer", icon: Code, description: "I write code professionally" },
    { id: "founder", label: "Founder/Entrepreneur", icon: Rocket, description: "Building my own product" },
    { id: "designer", label: "Designer", icon: Sparkles, description: "Focused on UI/UX" },
    { id: "student", label: "Student/Learner", icon: Zap, description: "Learning to code" },
  ];

  const experiences = [
    { id: "beginner", label: "Beginner", description: "Just getting started" },
    { id: "intermediate", label: "Intermediate", description: "Some experience with web dev" },
    { id: "advanced", label: "Advanced", description: "Experienced developer" },
    { id: "expert", label: "Expert", description: "Professional with years of experience" },
  ];

  const goals = [
    { id: "saas", label: "Build a SaaS product", icon: Rocket },
    { id: "portfolio", label: "Create a portfolio site", icon: Globe },
    { id: "ecommerce", label: "Launch an e-commerce store", icon: Database },
    { id: "api", label: "Build an API/Backend", icon: Code },
    { id: "learn", label: "Learn and experiment", icon: Sparkles },
    { id: "mvp", label: "Ship an MVP quickly", icon: Zap },
  ];

  const templates = [
    { id: "saas", name: "SaaS Application", description: "Full-featured SaaS with auth, billing, dashboard" },
    { id: "dashboard", name: "Admin Dashboard", description: "Internal tool with data visualization" },
    { id: "ecommerce", name: "E-commerce Store", description: "Online store with cart and checkout" },
    { id: "portfolio", name: "Portfolio Site", description: "Personal website to showcase work" },
    { id: "api", name: "REST API", description: "Backend API with database" },
    { id: "blank", name: "Blank Project", description: "Start from scratch" },
  ];

  const handleNext = () => {
    if (currentStep === 0 && !userData.role) {
      toast.error("Please select your role");
      return;
    }
    if (currentStep === 1 && !userData.experience) {
      toast.error("Please select your experience level");
      return;
    }
    if (currentStep === 2 && userData.goals.length === 0) {
      toast.error("Please select at least one goal");
      return;
    }
    if (currentStep === 3 && !userData.projectName) {
      toast.error("Please enter a project name");
      return;
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Save onboarding data
    localStorage.setItem("onboarding_completed", "true");
    localStorage.setItem("user_profile", JSON.stringify(userData));
    
    toast.success("Welcome to Project Catalyst!");
    
    // Navigate to create project with template
    if (userData.template && userData.template !== "blank") {
      setLocation(`/projects/new?template=${userData.template}&name=${encodeURIComponent(userData.projectName)}`);
    } else {
      setLocation("/projects/new");
    }
    
    onComplete();
  };

  const toggleGoal = (goalId: string) => {
    setUserData(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId]
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Welcome to Project Catalyst! 🚀</CardTitle>
              <CardDescription className="mt-2">
                Let's personalize your experience in just a few steps
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              Step {currentStep + 1} of {totalSteps}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 0: Role Selection */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">What best describes you?</h3>
                <p className="text-sm text-muted-foreground">
                  This helps us tailor your experience
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <button
                      key={role.id}
                      onClick={() => setUserData({ ...userData, role: role.id })}
                      className={`p-4 border-2 rounded-lg text-left transition-all hover:border-primary hover:bg-accent ${
                        userData.role === role.id
                          ? "border-primary bg-accent"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="h-6 w-6 mt-1 text-primary" />
                        <div className="flex-1">
                          <div className="font-semibold">{role.label}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {role.description}
                          </div>
                        </div>
                        {userData.role === role.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1: Experience Level */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">What's your experience level?</h3>
                <p className="text-sm text-muted-foreground">
                  We'll adjust our guidance accordingly
                </p>
              </div>
              <div className="space-y-3">
                {experiences.map((exp) => (
                  <button
                    key={exp.id}
                    onClick={() => setUserData({ ...userData, experience: exp.id })}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all hover:border-primary hover:bg-accent ${
                      userData.experience === exp.id
                        ? "border-primary bg-accent"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{exp.label}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {exp.description}
                        </div>
                      </div>
                      {userData.experience === exp.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Goals */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">What do you want to build?</h3>
                <p className="text-sm text-muted-foreground">
                  Select all that apply
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = userData.goals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={`p-4 border-2 rounded-lg text-left transition-all hover:border-primary hover:bg-accent ${
                        isSelected
                          ? "border-primary bg-accent"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-primary" />
                        <div className="flex-1 font-medium">{goal.label}</div>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: First Project */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Let's create your first project!</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a template or start from scratch
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="my-awesome-app"
                  value={userData.projectName}
                  onChange={(e) => setUserData({ ...userData, projectName: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <Label>Choose a Template</Label>
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setUserData({ ...userData, template: template.id })}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all hover:border-primary hover:bg-accent ${
                      userData.template === template.id
                        ? "border-primary bg-accent"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{template.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </div>
                      </div>
                      {userData.template === template.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex gap-2">
              {currentStep < totalSteps - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleNext} className="bg-primary">
                  <Rocket className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
