import { vi } from "vitest";

// Mock environment variables
process.env.DATABASE_URL = "mysql://test:test@localhost:3306/test";
process.env.JWT_SECRET = "test-secret";
process.env.GITHUB_TOKEN = "test-github-token";
process.env.BUILT_IN_FORGE_API_KEY = "test-api-key";
process.env.BUILT_IN_FORGE_API_URL = "https://test-api.example.com";

// Mock LLM invocation
vi.mock("../server/_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            techStack: ["React", "TypeScript", "Node.js"],
            structure: "Modern web application structure",
            keyComponents: [],
            summary: "Test project summary",
            recommendations: ["Add tests", "Improve documentation"],
          }),
        },
      },
    ],
  }),
}));

// Mock GitHub API
global.fetch = vi.fn();
