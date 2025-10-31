import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Copy,
  Check,
  Search,
  X,
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
  fullPath?: string;
}

function buildFileTree(files: FileNode[]): TreeNode[] {
  const root: TreeNode[] = [];

  files.forEach((file) => {
    const parts = file.path.split("/");
    let currentLevel = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = index === parts.length - 1;
      let existing = currentLevel.find((node) => node.name === part);

      if (!existing) {
        existing = {
          name: part,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
          file: isFile ? file : undefined,
          fullPath: currentPath,
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

function filterTree(nodes: TreeNode[], searchTerm: string): TreeNode[] {
  if (!searchTerm) return nodes;

  const filtered: TreeNode[] = [];

  for (const node of nodes) {
    if (node.type === "file") {
      if (node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.fullPath?.toLowerCase().includes(searchTerm.toLowerCase())) {
        filtered.push(node);
      }
    } else if (node.children) {
      const filteredChildren = filterTree(node.children, searchTerm);
      if (filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children: filteredChildren,
        });
      }
    }
  }

  return filtered;
}

function TreeItem({
  node,
  level = 0,
  onSelectFile,
  searchTerm,
}: {
  node: TreeNode;
  level?: number;
  onSelectFile: (file: FileNode) => void;
  searchTerm?: string;
}) {
  const [isOpen, setIsOpen] = useState(level < 2 || !!searchTerm);

  const handleClick = () => {
    if (node.type === "folder") {
      setIsOpen(!isOpen);
    } else if (node.file) {
      onSelectFile(node.file);
    }
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-900">{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div>
      <div
        className="flex items-center gap-1 py-1 px-2 hover:bg-accent rounded cursor-pointer group"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === "folder" ? (
          <>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            {isOpen ? (
              <FolderOpen className="h-4 w-4 text-blue-500 flex-shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
            )}
          </>
        ) : (
          <>
            <div className="w-4" />
            <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </>
        )}
        <span className="text-sm truncate">
          {searchTerm ? highlightText(node.name, searchTerm) : node.name}
        </span>
        {node.file && (
          <Badge variant="outline" className="ml-auto text-xs opacity-0 group-hover:opacity-100">
            {node.file.language}
          </Badge>
        )}
      </div>
      {node.type === "folder" && isOpen && node.children && (
        <div>
          {node.children.map((child, index) => (
            <TreeItem
              key={`${child.name}-${index}`}
              node={child}
              level={level + 1}
              onSelectFile={onSelectFile}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileExplorerEnhanced({ files }: { files: FileNode[] }) {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fileTree = useMemo(() => buildFileTree(files), [files]);
  const filteredTree = useMemo(() => filterTree(fileTree, searchTerm), [fileTree, searchTerm]);

  const handleCopy = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const matchCount = useMemo(() => {
    if (!searchTerm) return 0;
    let count = 0;
    const countMatches = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (node.type === "file" && 
            (node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             node.fullPath?.toLowerCase().includes(searchTerm.toLowerCase()))) {
          count++;
        } else if (node.children) {
          countMatches(node.children);
        }
      }
    };
    countMatches(fileTree);
    return count;
  }, [fileTree, searchTerm]);

  return (
    <div className="grid grid-cols-2 gap-4 h-[600px]">
      <Card className="flex flex-col">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Files ({files.length})</h3>
            {searchTerm && (
              <Badge variant="secondary">{matchCount} matches</Badge>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-8"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-7 w-7 p-0"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredTree.length > 0 ? (
              filteredTree.map((node, index) => (
                <TreeItem
                  key={`${node.name}-${index}`}
                  node={node}
                  onSelectFile={setSelectedFile}
                  searchTerm={searchTerm}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mb-2 opacity-20" />
                <p className="text-sm">No files match "{searchTerm}"</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      <Card className="flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">
              {selectedFile ? selectedFile.path : "Select a file"}
            </h3>
            {selectedFile && (
              <Badge variant="outline">{selectedFile.language}</Badge>
            )}
          </div>
          {selectedFile && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          )}
        </div>
        <ScrollArea className="flex-1">
          {selectedFile ? (
            <pre className="p-4 text-sm">
              <code>{selectedFile.content}</code>
            </pre>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <File className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Select a file to view its contents</p>
              </div>
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
}
