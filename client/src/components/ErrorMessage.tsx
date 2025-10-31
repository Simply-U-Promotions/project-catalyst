import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function ErrorMessage({ 
  title = "Something went wrong", 
  message, 
  onRetry,
  showRetry = true 
}: ErrorMessageProps) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>{message}</p>
        {showRetry && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// User-friendly error messages for common errors
export function getUserFriendlyError(error: any): { title: string; message: string } {
  const errorMessage = error?.message || error?.toString() || "Unknown error";
  
  // Network errors
  if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
    return {
      title: "Connection Error",
      message: "Unable to connect to the server. Please check your internet connection and try again."
    };
  }
  
  // Authentication errors
  if (errorMessage.includes("auth") || errorMessage.includes("unauthorized") || errorMessage.includes("401")) {
    return {
      title: "Authentication Required",
      message: "Your session has expired. Please sign in again to continue."
    };
  }
  
  // Permission errors
  if (errorMessage.includes("forbidden") || errorMessage.includes("403")) {
    return {
      title: "Permission Denied",
      message: "You don't have permission to perform this action."
    };
  }
  
  // Not found errors
  if (errorMessage.includes("not found") || errorMessage.includes("404")) {
    return {
      title: "Not Found",
      message: "The requested resource could not be found."
    };
  }
  
  // Rate limit errors
  if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
    return {
      title: "Too Many Requests",
      message: "You've made too many requests. Please wait a moment and try again."
    };
  }
  
  // Server errors
  if (errorMessage.includes("500") || errorMessage.includes("server error")) {
    return {
      title: "Server Error",
      message: "Our servers are experiencing issues. Please try again in a few moments."
    };
  }
  
  // Validation errors
  if (errorMessage.includes("validation") || errorMessage.includes("invalid")) {
    return {
      title: "Invalid Input",
      message: "Please check your input and try again."
    };
  }
  
  // GitHub API errors
  if (errorMessage.includes("GitHub") || errorMessage.includes("repository")) {
    return {
      title: "GitHub Error",
      message: "Unable to connect to GitHub. Please check your GitHub connection and try again."
    };
  }
  
  // AI/LLM errors
  if (errorMessage.includes("OpenAI") || errorMessage.includes("Claude") || errorMessage.includes("generation")) {
    return {
      title: "AI Generation Error",
      message: "Unable to generate code at this time. Please try again or simplify your request."
    };
  }
  
  // Database errors
  if (errorMessage.includes("database") || errorMessage.includes("SQL")) {
    return {
      title: "Database Error",
      message: "Unable to save or retrieve data. Please try again."
    };
  }
  
  // Default error
  return {
    title: "Error",
    message: errorMessage.length > 200 
      ? "An unexpected error occurred. Please try again or contact support if the problem persists."
      : errorMessage
  };
}
