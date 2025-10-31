import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CodebaseSummary from "../client/src/components/CodebaseSummary";

describe("CodebaseSummary Component", () => {
  it("should render loading state", () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: null,
      isLoading: true,
      refetch: vi.fn(),
      isRefetching: false,
    });

    vi.doMock("@/lib/trpc", () => ({
      trpc: {
        github: {
          analyzeCodebase: {
            useQuery: mockUseQuery,
          },
        },
      },
    }));

    render(<CodebaseSummary projectId={1} />);
    
    expect(screen.getByText(/analyzing codebase/i)).toBeInTheDocument();
  });

  it("should render analysis data", async () => {
    const mockAnalysis = {
      techStack: ["React", "TypeScript", "Node.js"],
      structure: "Modern web application",
      keyComponents: [
        {
          name: "Authentication",
          description: "User auth system",
          files: ["src/auth.ts"],
        },
      ],
      summary: "This is a test project",
      recommendations: ["Add tests", "Improve docs"],
      complexity: "moderate" as const,
      totalFiles: 25,
      totalLines: 5000,
    };

    const mockUseQuery = vi.fn().mockReturnValue({
      data: mockAnalysis,
      isLoading: false,
      refetch: vi.fn(),
      isRefetching: false,
    });

    vi.doMock("@/lib/trpc", () => ({
      trpc: {
        github: {
          analyzeCodebase: {
            useQuery: mockUseQuery,
          },
        },
      },
    }));

    render(<CodebaseSummary projectId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/codebase overview/i)).toBeInTheDocument();
    });

    // Check tech stack badges
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Node.js")).toBeInTheDocument();

    // Check complexity badge
    expect(screen.getByText("Moderate")).toBeInTheDocument();

    // Check statistics
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("5,000")).toBeInTheDocument();
  });

  it("should handle empty analysis", () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: null,
      isLoading: false,
      refetch: vi.fn(),
      isRefetching: false,
    });

    vi.doMock("@/lib/trpc", () => ({
      trpc: {
        github: {
          analyzeCodebase: {
            useQuery: mockUseQuery,
          },
        },
      },
    }));

    render(<CodebaseSummary projectId={1} />);
    
    expect(screen.getByText(/no analysis available/i)).toBeInTheDocument();
  });
});
