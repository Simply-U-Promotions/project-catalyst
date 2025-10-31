import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface FileDiff {
  path: string;
  oldContent?: string;
  newContent: string;
  status: "added" | "modified" | "deleted";
}

interface DiffReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diffs: FileDiff[];
  onApprove: () => void;
  onReject: () => void;
}

export function DiffReviewDialog({
  open,
  onOpenChange,
  diffs,
  onApprove,
  onReject,
}: DiffReviewDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentDiff = diffs[currentIndex];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "added":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "modified":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "deleted":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "";
    }
  };

  const renderDiff = () => {
    if (!currentDiff) return null;

    if (currentDiff.status === "added") {
      return (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">New file content:</div>
          <pre className="bg-green-500/5 border border-green-500/20 rounded p-4 text-sm overflow-x-auto">
            <code>{currentDiff.newContent}</code>
          </pre>
        </div>
      );
    }

    if (currentDiff.status === "deleted") {
      return (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">File will be deleted</div>
          <pre className="bg-red-500/5 border border-red-500/20 rounded p-4 text-sm overflow-x-auto line-through opacity-60">
            <code>{currentDiff.oldContent}</code>
          </pre>
        </div>
      );
    }

    // Modified file - show side-by-side diff
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Before:</div>
          <pre className="bg-red-500/5 border border-red-500/20 rounded p-4 text-sm overflow-x-auto max-h-96">
            <code>{currentDiff.oldContent}</code>
          </pre>
        </div>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">After:</div>
          <pre className="bg-green-500/5 border border-green-500/20 rounded p-4 text-sm overflow-x-auto max-h-96">
            <code>{currentDiff.newContent}</code>
          </pre>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Review Changes</DialogTitle>
          <DialogDescription>
            Review each file change before applying. {currentIndex + 1} of {diffs.length}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File header */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {currentDiff?.path}
              </code>
              <Badge className={getStatusColor(currentDiff?.status || "")}>
                {currentDiff?.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {diffs.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex(Math.min(diffs.length - 1, currentIndex + 1))}
                disabled={currentIndex === diffs.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Diff content */}
          <ScrollArea className="h-[50vh]">
            {renderDiff()}
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={onReject}>
              <X className="h-4 w-4 mr-2" />
              Reject Changes
            </Button>
            <Button onClick={onApprove}>
              <Check className="h-4 w-4 mr-2" />
              Apply All Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
