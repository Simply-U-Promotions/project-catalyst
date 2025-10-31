import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Code2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import CodePreview from "@/components/CodePreview";

export default function NewProjectEnhanced() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"details" | "preview" | "creating">("details");
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  
  // Preview state
  const [generatedFiles, setGeneratedFiles] = useState<any[]>([]);

  const { data: templates } = trpc.templates.list.useQuery();

  const generateCodeMutation = trpc.projects.generateCode.useMutation({
    onSuccess: (data) => {
      setGeneratedFiles(data.files || []);
      setStep("preview");
      toast.success("Code generated successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate code");
    },
  });

  const createProjectMutation = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      toast.success("Project created successfully!");
      setLocation(`/projects/${data.projectId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create project");
      setStep("preview");
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleGenerateCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a project name");
      return;
    }
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }

    generateCodeMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      templateId: selectedTemplate,
    });
  };

  const handleConfirmCreate = () => {
    setStep("creating");
    createProjectMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      templateId: selectedTemplate,
      files: generatedFiles,
    });
  };

  const handleCancelPreview = () => {
    setStep("details");
    setGeneratedFiles([]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-xl">
            <Code2 className="h-6 w-6 text-primary" />
            {APP_TITLE}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {step === "details" && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Create New Project</CardTitle>
                <CardDescription>
                  Choose a template and let AI generate production-ready code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerateCode} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      id="name"
                      placeholder="My Awesome App"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="template">Template *</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates?.map((template: any) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              <span>{template.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({template.complexity})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedTemplate && (
                      <p className="text-sm text-muted-foreground">
                        {templates?.find((t: any) => t.id === selectedTemplate)?.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Additional Requirements (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="e.g., Add dark mode, use PostgreSQL instead of MySQL, include user authentication..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                    <p className="text-sm text-muted-foreground">
                      Customize the template with specific requirements
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={generateCodeMutation.isPending}
                      className="flex-1"
                    >
                      {generateCodeMutation.isPending ? (
                        <>
                          <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                          Generating Code...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Code Preview
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/dashboard")}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "preview" && (
          <div>
            <CodePreview
              files={generatedFiles}
              projectName={name}
              onConfirm={handleConfirmCreate}
              onCancel={handleCancelPreview}
            />
          </div>
        )}

        {step === "creating" && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <h3 className="text-lg font-semibold">Creating Your Project...</h3>
                  <p className="text-sm text-muted-foreground">
                    Setting up repository, committing files, and initializing project
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
