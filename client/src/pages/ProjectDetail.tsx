import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Code2, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

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

  const generateCodeMutation = trpc.ai.generateCode.useMutation({
    onSuccess: () => {
      setMessage("");
      toast.success("Response generated!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate response");
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
      userMessage,
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
            <CardTitle>{project?.name || "Loading..."}</CardTitle>
            <CardDescription>
              {project?.description || "No description"}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Chat Interface */}
        <Card className="flex-1 flex flex-col">
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
      </main>
    </div>
  );
}
