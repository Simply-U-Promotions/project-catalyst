import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileIcon, FolderIcon, Copy, Check, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface FileNode {
  path: string;
  content?: string;
  language?: string;
}

interface CodePreviewProps {
  files: FileNode[];
  projectName: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
}

export default function CodePreview({ files, projectName, onConfirm, onCancel, showActions = true }: CodePreviewProps) {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(files[0] || null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // Build file tree structure
  const fileTree = buildFileTree(files);

  const copyToClipboard = async (content: string, path: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedPath(path);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  const downloadFile = (file: FileNode) => {
    const blob = new Blob([file.content || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.path.split("/").pop() || "file.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${file.path}`);
  };

  const downloadAll = () => {
    files.forEach(file => {
      if (file.content) {
        downloadFile(file);
      }
    });
    toast.success(`Downloaded ${files.length} files`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Code Preview</h3>
          <p className="text-sm text-muted-foreground">
            Review the generated code for <span className="font-medium">{projectName}</span>
          </p>
        </div>
        {showActions && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadAll}>
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* File Tree */}
        <Card className="lg:col-span-1 p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <FolderIcon className="h-4 w-4" />
            File Structure
          </h4>
          <ScrollArea className="h-[500px]">
            <div className="space-y-1">
              {renderFileTree(fileTree, selectedFile, setSelectedFile)}
            </div>
          </ScrollArea>
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Total Files:</span>
                <span className="font-medium">{files.length}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Total Lines:</span>
                <span className="font-medium">
                  {files.reduce((acc, f) => acc + (f.content?.split("\n").length || 0), 0)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Code Viewer */}
        <Card className="lg:col-span-3 p-4">
          {selectedFile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{selectedFile.path}</span>
                  {selectedFile.language && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedFile.language}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectedFile.content && copyToClipboard(selectedFile.content, selectedFile.path)}
                  >
                    {copiedPath === selectedFile.path ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => downloadFile(selectedFile)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[500px] w-full rounded-md border">
                <pre className="p-4 text-sm">
                  <code className="language-{selectedFile.language}">
                    {selectedFile.content || "// No content"}
                  </code>
                </pre>
              </ScrollArea>
            </div>
          ) : (
            <div className="h-[500px] flex items-center justify-center text-muted-foreground">
              Select a file to preview
            </div>
          )}
        </Card>
      </div>

      {showActions && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {onConfirm && (
            <Button onClick={onConfirm}>
              Create Project
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Helper functions
interface TreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: TreeNode[];
  content?: string;
  language?: string;
}

function buildFileTree(files: FileNode[]): TreeNode[] {
  const root: TreeNode[] = [];

  files.forEach(file => {
    const parts = file.path.split("/");
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      let existing = currentLevel.find(node => node.name === part);

      if (!existing) {
        existing = {
          name: part,
          path: parts.slice(0, index + 1).join("/"),
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
          content: isFile ? file.content : undefined,
          language: isFile ? file.language : undefined,
        };
        currentLevel.push(existing);
      }

      if (!isFile && existing.children) {
        currentLevel = existing.children;
      }
    });
  });

  return root;
}

function renderFileTree(
  nodes: TreeNode[],
  selectedFile: FileNode | null,
  setSelectedFile: (file: FileNode) => void,
  depth: number = 0
): React.ReactElement[] {
  return nodes.map(node => (
    <div key={node.path} style={{ paddingLeft: `${depth * 12}px` }}>
      {node.type === "folder" ? (
        <div>
          <div className="flex items-center gap-1 py-1 text-sm text-muted-foreground">
            <FolderIcon className="h-3 w-3" />
            <span>{node.name}</span>
          </div>
          {node.children && renderFileTree(node.children, selectedFile, setSelectedFile, depth + 1)}
        </div>
      ) : (
        <button
          className={`flex items-center gap-1 py-1 text-sm w-full text-left rounded px-1 hover:bg-accent ${
            selectedFile?.path === node.path ? "bg-accent" : ""
          }`}
          onClick={() => setSelectedFile({ path: node.path, content: node.content, language: node.language })}
        >
          <FileIcon className="h-3 w-3" />
          <span>{node.name}</span>
        </button>
      )}
    </div>
  ));
}
