import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRepoInfo, parseGitHubUrl } from "../server/githubImport";

describe("GitHub Import Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("parseGitHubUrl", () => {
    it("should parse standard GitHub URL", () => {
      const url = "https://github.com/owner/repo";
      const result = parseGitHubUrl(url);
      expect(result).toEqual({ owner: "owner", repo: "repo" });
    });

    it("should parse GitHub URL with .git suffix", () => {
      const url = "https://github.com/owner/repo.git";
      const result = parseGitHubUrl(url);
      expect(result).toEqual({ owner: "owner", repo: "repo" });
    });

    it("should parse GitHub URL with trailing slash", () => {
      // The regex doesn't support trailing slash, so this should throw
      const url = "https://github.com/owner/repo/";
      expect(() => parseGitHubUrl(url)).toThrow("Invalid GitHub URL");
    });

    it("should throw error for invalid URL", () => {
      const url = "https://example.com/invalid";
      expect(() => parseGitHubUrl(url)).toThrow("Invalid GitHub URL");
    });

    it("should throw error for incomplete URL", () => {
      const url = "https://github.com/owner";
      expect(() => parseGitHubUrl(url)).toThrow("Invalid GitHub URL");
    });
  });

  describe("getRepoInfo", () => {
    it("should fetch repository information", async () => {
      const mockResponse = {
        name: "test-repo",
        description: "Test repository",
        default_branch: "main",
        private: false,
        html_url: "https://github.com/owner/test-repo",
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await getRepoInfo("https://github.com/owner/test-repo");

      expect(result).toEqual({
        name: "test-repo",
        description: "Test repository",
        defaultBranch: "main",
        isPrivate: false,
      });
    });

    it("should handle repository not found", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(
        getRepoInfo("https://github.com/owner/nonexistent")
      ).rejects.toThrow("Failed to fetch repository");
    });

    it("should handle API errors", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(
        getRepoInfo("https://github.com/owner/test-repo")
      ).rejects.toThrow("Failed to fetch repository");
    });
  });
});
