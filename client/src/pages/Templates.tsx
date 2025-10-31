import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Code2, Clock, Layers, ArrowUpDown } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { TemplateCardSkeleton } from "@/components/TemplateCardSkeleton";

export default function Templates() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: templates, isLoading } = trpc.templates.list.useQuery();
  const { data: categories } = trpc.templates.categories.useQuery();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "recent">("newest");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSelectTemplate = (templateId: string) => {
    if (!isAuthenticated) {
      toast.info("Sign in to use templates", {
        action: {
          label: "Sign In",
          onClick: () => window.location.href = getLoginUrl(),
        },
      });
      return;
    }
    setLocation(`/projects/new?template=${templateId}`);
  };

  const allCategories = ["All", ...(categories || [])];

  const filteredTemplates = templates?.filter(
    (t: any) => selectedCategory === "All" || t.category === selectedCategory
  );

  // Sort templates based on selected sort option
  const sortedTemplates = filteredTemplates?.sort((a: any, b: any) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case "popular":
        return (b.usageCount || 0) - (a.usageCount || 0);
      case "recent":
        return new Date(b.lastUsed || 0).getTime() - new Date(a.lastUsed || 0).getTime();
      default:
        return 0;
    }
  });

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg cursor-pointer" onClick={() => setLocation("/")}>
            <Code2 className="h-5 w-5 text-primary" />
            {APP_TITLE}
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button size="sm" onClick={() => setLocation("/dashboard")}>
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <a href={getLoginUrl()}>Sign In</a>
                </Button>
                <Button size="sm" asChild>
                  <a href={getLoginUrl()}>Get Started</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Project Templates</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start with a pre-built template and customize it to your needs. Each template includes production-ready code and best practices.
            </p>
          </div>

          {/* Sort and Filter Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Sort by:</span>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="recent">Recently Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-2">
              {allCategories.map((category) => (
                <TabsTrigger key={category} value={category} className="px-4">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  // Show skeleton cards while loading
                  Array.from({ length: 6 }).map((_, i) => (
                    <TemplateCardSkeleton key={i} />
                  ))
                ) : (
                  sortedTemplates?.map((template: any) => (
                    <Card key={template.id} className="p-6 flex flex-col space-y-4 hover:shadow-lg transition-shadow">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-lg">{template.name}</h3>
                            <Badge variant="secondary" className={getComplexityColor(template.complexity)}>
                              {template.complexity}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {template.estimatedTime}
                        </div>
                        <div className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {template.features.length} features
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="pt-2 mt-auto">
                        <Button
                          className="w-full"
                          onClick={() => handleSelectTemplate(template.id)}
                        >
                          Use Template
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
