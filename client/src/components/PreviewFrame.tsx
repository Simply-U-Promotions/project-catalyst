import { Loader2 } from "lucide-react";
import { useState } from "react";

interface PreviewFrameProps {
  projectId: number;
}

export default function PreviewFrame({ projectId }: PreviewFrameProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative w-full h-full" style={{ minHeight: '600px' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Building Preview...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Generating your application preview
            </p>
          </div>
        </div>
      )}
      <iframe
        src={`/api/preview/${projectId}`}
        className="w-full h-full border-0"
        style={{ minHeight: '600px' }}
        title="Project Preview"
        sandbox="allow-scripts allow-same-origin allow-forms"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
