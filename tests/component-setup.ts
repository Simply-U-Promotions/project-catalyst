import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock tRPC
vi.mock("@/lib/trpc", () => ({
  trpc: {
    github: {
      getRepoInfo: {
        useQuery: vi.fn(),
      },
      analyzeCodebase: {
        useQuery: vi.fn(),
      },
      modifyCode: {
        useMutation: vi.fn(),
      },
      createPR: {
        useMutation: vi.fn(),
      },
    },
    projects: {
      list: {
        useQuery: vi.fn(),
      },
      get: {
        useQuery: vi.fn(),
      },
    },
  },
}));

// Mock useAuth hook
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Test User", email: "test@example.com" },
    isAuthenticated: true,
    loading: false,
    logout: vi.fn(),
  }),
}));

// Mock wouter
vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
  useParams: () => ({ id: "1" }),
  Route: ({ children }: any) => children,
  Switch: ({ children }: any) => children,
  Link: ({ children }: any) => children,
}));
