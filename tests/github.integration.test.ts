import { describe, it, expect, vi, beforeEach } from "vitest";

describe("GitHub API Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/trpc/github.getRepoInfo", () => {
    it("should return repository information", async () => {
      const mockRepoData = {
        name: "test-repo",
        description: "A test repository",
        default_branch: "main",
        private: false,
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockRepoData,
      } as Response);

      // This would be called through tRPC in real scenario
      const { getRepoInfo } = await import("../server/githubImport");
      const result = await getRepoInfo("https://github.com/owner/test-repo");

      expect(result).toEqual({
        name: "test-repo",
        description: "A test repository",
        defaultBranch: "main",
        isPrivate: false,
      });
    });

    it("should handle invalid repository URL", async () => {
      const { getRepoInfo } = await import("../server/githubImport");
      
      await expect(
        getRepoInfo("https://invalid-url.com/repo")
      ).rejects.toThrow("Invalid GitHub URL");
    });
  });

  describe("POST /api/trpc/github.import", () => {
    it("should import repository successfully", async () => {
      const mockRepoData = {
        name: "test-repo",
        description: "Test",
        default_branch: "main",
        private: false,
      };

      const mockTreeData = {
        tree: [
          { path: "README.md", type: "blob", sha: "abc123" },
          { path: "src/index.ts", type: "blob", sha: "def456" },
        ],
      };

      const mockFileContent1 = { content: Buffer.from("# README").toString("base64") };
      const mockFileContent2 = { content: Buffer.from("console.log('test')").toString("base64") };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockRepoData,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTreeData,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFileContent1,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFileContent2,
        } as Response);

      const { importRepository } = await import("../server/githubImport");
      const result = await importRepository("https://github.com/owner/test-repo");

      expect(result).toHaveProperty("info");
      expect(result).toHaveProperty("files");
      expect(result.info.name).toBe("test-repo");
      expect(result.files.length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/trpc/github.createPR", () => {
    it("should create pull request successfully", async () => {
      const mockPRData = {
        number: 1,
        html_url: "https://github.com/owner/repo/pull/1",
        title: "Test PR",
      };

      // createPullRequest only makes one API call to create the PR
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockPRData,
      } as Response);

      const { createPullRequest } = await import("../server/githubImport");
      const result = await createPullRequest(
        "https://github.com/owner/repo",
        "feature-branch",
        "Test PR",
        "Test PR body"
      );

      expect(result).toHaveProperty("prNumber");
      expect(result).toHaveProperty("prUrl");
      expect(result.prNumber).toBe(1);
      expect(result.prUrl).toBe("https://github.com/owner/repo/pull/1");
    });
  });
});
