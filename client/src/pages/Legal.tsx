import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Shield, Cookie } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const legalDocuments = {
  'terms': {
    title: 'Terms of Service',
    description: 'Last updated: October 31, 2025',
    icon: FileText,
    path: '/legal/terms-of-service.md',
  },
  'privacy': {
    title: 'Privacy Policy',
    description: 'Last updated: October 31, 2025',
    icon: Shield,
    path: '/legal/privacy-policy.md',
  },
  'cookies': {
    title: 'Cookie Policy',
    description: 'Last updated: October 31, 2025',
    icon: Cookie,
    path: '/legal/cookie-policy.md',
  },
};

type DocumentType = keyof typeof legalDocuments;

export default function Legal() {
  const [, setLocation] = useLocation();
  const [selectedDoc, setSelectedDoc] = useState<DocumentType>('terms');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocument = async () => {
      setLoading(true);
      try {
        const doc = legalDocuments[selectedDoc];
        const response = await fetch(doc.path);
        const text = await response.text();
        setContent(text);
      } catch (error) {
        console.error('Failed to load document:', error);
        setContent('# Error\n\nFailed to load document. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [selectedDoc]);

  const currentDoc = legalDocuments[selectedDoc];
  const Icon = currentDoc.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Legal Information</h1>
              <p className="text-sm text-muted-foreground">
                Terms, policies, and legal documents
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documents</CardTitle>
                <CardDescription>Select a document to view</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(Object.keys(legalDocuments) as DocumentType[]).map((key) => {
                  const doc = legalDocuments[key];
                  const DocIcon = doc.icon;
                  return (
                    <Button
                      key={key}
                      variant={selectedDoc === key ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setSelectedDoc(key)}
                    >
                      <DocIcon className="h-4 w-4 mr-2" />
                      {doc.title}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Have questions about our legal documents?
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <a href="mailto:legal@projectcatalyst.com">
                    Contact Legal Team
                  </a>
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Content */}
          <main className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{currentDoc.title}</CardTitle>
                    <CardDescription>{currentDoc.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
