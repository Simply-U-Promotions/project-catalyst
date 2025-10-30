import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface FileNode {
  id: string;
  path: string;
  content: string;
  language: string;
}

interface TreeNode {
  name: string;
  type: "file" | "folder";
  children?: TreeNode[];
  file?: FileNode;
}

function buildFileTree(files: FileNode[]): TreeNode[] {
  const root: TreeNode[] = [];

  files.forEach((file) => {
    const parts = file.path.split("/");
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      let existing = currentLevel.find((node) => node.name === part);

      if (!existing) {
        existing = {
          name: part,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
          file: isFile ? file : undefined,
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

function TreeItem({
  node,
  level = 0,
  onSelectFile,
}: {
  node: TreeNode;
  level?: number;
  onSelectFile: (file: FileNode) => void;
}) {
  const [isOpen, setIsOpen] = useState(level < 2);

  const handleClick = () => {
    if (node.type === "folder") {
      setIsOpen(!isOpen);
    } else if (node.file) {
      onSelectFile(node.file);
    }
  };

  return (
    <div>
      <div
        className="flex items-center gap-1 py-1 px-2 hover:bg-accent rounded cursor-pointer text-sm"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === "folder" ? (
          <>
            {isOpen ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
            {isOpen ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500" />
            )}
          </>
        ) : (
          <>
            <span className="w-3" />
            <File className="h-4 w-4 text-muted-foreground" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </div>
      {node.type === "folder" && isOpen && node.children && (
        <div>
          {node.children.map((child, index) => (
            <TreeItem
              key={`${child.name}-${index}`}
              node={child}
              level={level + 1}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileExplorer({ files }: { files: FileNode[] }) {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(
    files[0] || null
  );
  const [copied, setCopied] = useState(false);

  const tree = buildFileTree(files);

  const handleCopyCode = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (files.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No files generated yet</p>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-4 h-[600px]">
      {/* File Tree */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Folder className="h-4 w-4" />
          Files ({files.length})
        </h3>
        <ScrollArea className="h-[520px]">
          {tree.map((node, index) => (
            <TreeItem
              key={`${node.name}-${index}`}
              node={node}
              onSelectFile={setSelectedFile}
            />
          ))}
        </ScrollArea>
      </Card>

      {/* File Content */}
      <Card className="flex flex-col">
        {selectedFile ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">{selectedFile.path}</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedFile.language}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyCode}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <ScrollArea className="flex-1 p-4">
              <pre className="text-xs font-mono">
                <code>{selectedFile.content}</code>
              </pre>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Select a file to view its content</p>
          </div>
        )}
      </Card>
    </div>
  );
}
