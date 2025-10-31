import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Code2, Send, FileCode } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import FileExplorer from "@/components/FileExplorer";
import Deployments from "@/components/Deployments";
import CodeModification from "@/components/CodeModification";
import CodebaseSummary from "@/components/CodebaseSummary";
import BuiltInDeployment from "@/components/BuiltInDeployment";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProjectDetail() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const projectId = parseInt(params.id || "0");
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: project } = trpc.projects.get.useQuery(
    { projectId },
    { enabled: isAuthenticated && projectId > 0 }
  );

  const { data: conversations = [] } = trpc.projects.getConversations.useQuery(
    { projectId },
    { enabled: isAuthenticated && projectId > 0 }
  );

  const { data: files = [], isLoading: filesLoading } = trpc.projects.getFiles.useQuery(
    { projectId },
    { enabled: isAuthenticated && projectId > 0 }
  );

  const generateCodeMutation = trpc.ai.generateCode.useMutation({
    onSuccess: (data) => {
      setMessage("");
      if (data.githubRepoUrl) {
        toast.success(`Project generated and pushed to GitHub!`);
      } else {
        toast.success("Project generated successfully!");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate project");
    },
  });

  const utils = trpc.useUtils();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations]);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || generateCodeMutation.isPending) return;

    const userMessage = message.trim();
    await generateCodeMutation.mutateAsync({
      projectId,
      projectName: project?.name || "My Project",
      description: userMessage,
      templateId: project?.templateId?.toString(),
    });

    // Refetch conversations
    utils.projects.getConversations.invalidate({ projectId });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
      <main className="container py-8 flex-1 flex flex-col max-w-4xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/dashboard")}
          className="mb-6 self-start"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{project?.name || "Loading..."}</CardTitle>
                <CardDescription>
                  {project?.description || "No description"}
                </CardDescription>
              </div>
              {project?.githubRepoUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a
                    href={project.githubRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    View on GitHub
                  </a>
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue={project?.isImported === 1 ? "overview" : "chat"} className="flex-1 flex flex-col">
          <TabsList className="mb-4">
            {project?.isImported === 1 && (
              <TabsTrigger value="overview" className="gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Overview
              </TabsTrigger>
            )}
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <FileCode className="h-4 w-4" />
              Files {files.length > 0 && `(${files.length})`}
            </TabsTrigger>
            {project?.isImported === 1 && (
              <TabsTrigger value="modify" className="gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modify Code
              </TabsTrigger>
            )}
            <TabsTrigger value="catalyst" className="gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Deploy to Catalyst
            </TabsTrigger>
            <TabsTrigger value="deployments" className="gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              External Providers
            </TabsTrigger>
          </TabsList>

          {project?.isImported === 1 && (
            <TabsContent value="overview">
              <CodebaseSummary projectId={projectId} />
            </TabsContent>
          )}

          <TabsContent value="chat" className="flex-1">
            <Card className="flex-1 flex flex-col h-full">
          <CardHeader>
            <CardTitle>AI Assistant</CardTitle>
            <CardDescription>
              Describe what you want to build and I'll help you generate the code
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[400px]">
              {conversations.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Start a conversation to generate your project</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`flex ${
                      conv.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        conv.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {conv.role === "assistant" ? (
                        <Streamdown>{conv.content}</Streamdown>
                      ) : (
                        <p className="whitespace-pre-wrap">{conv.content}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
              {generateCodeMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-muted-foreground">Generating...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder="Describe what you want to build..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={generateCodeMutation.isPending}
              />
              <Button
                type="submit"
                disabled={!message.trim() || generateCodeMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="files">
            {filesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <FileExplorer
                files={files.map((f: any) => ({
                  id: f.id.toString(),
                  path: f.filePath,
                  content: f.content,
                  language: f.language || "text",
                }))}
              />
            )}
          </TabsContent>

          {project?.isImported === 1 && (
            <TabsContent value="modify">
              <CodeModification projectId={projectId} repoUrl={project.githubRepoUrl || ""} />
            </TabsContent>
          )}

          <TabsContent value="catalyst">
            <BuiltInDeployment projectId={projectId} />
          </TabsContent>

          <TabsContent value="deployments">
            <Deployments projectId={projectId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
