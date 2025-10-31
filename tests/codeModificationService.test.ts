import { describe, it, expect, vi } from "vitest";
import { analyzeCodebase } from "../server/codeModificationService";

describe("Code Modification Service", () => {
  describe("analyzeCodebase", () => {
    it("should analyze a simple codebase", async () => {
      const files = [
        {
          path: "src/index.ts",
          content: "console.log('Hello World');",
          language: "typescript",
        },
        {
          path: "package.json",
          content: '{"name": "test-project"}',
          language: "json",
        },
      ];

      const result = await analyzeCodebase(files);

      expect(result).toHaveProperty("techStack");
      expect(result).toHaveProperty("structure");
      expect(result).toHaveProperty("keyComponents");
      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("complexity");
      expect(result).toHaveProperty("totalFiles");
      expect(result).toHaveProperty("totalLines");
    });

    it("should determine complexity correctly", async () => {
      const simpleFiles = Array.from({ length: 5 }, (_, i) => ({
        path: `file${i}.ts`,
        content: "const x = 1;",
        language: "typescript",
      }));

      const result = await analyzeCodebase(simpleFiles);
      expect(result.complexity).toBe("simple");
      expect(result.totalFiles).toBe(5);
    });

    it("should handle moderate complexity", async () => {
      const moderateFiles = Array.from({ length: 25 }, (_, i) => ({
        path: `file${i}.ts`,
        content: "const x = 1;\n".repeat(50),
        language: "typescript",
      }));

      const result = await analyzeCodebase(moderateFiles);
      expect(result.complexity).toBe("moderate");
      expect(result.totalFiles).toBe(25);
    });

    it("should handle complex codebases", async () => {
      const complexFiles = Array.from({ length: 60 }, (_, i) => ({
        path: `file${i}.ts`,
        content: "const x = 1;\n".repeat(100),
        language: "typescript",
      }));

      const result = await analyzeCodebase(complexFiles);
      expect(result.complexity).toBe("complex");
      expect(result.totalFiles).toBe(60);
    });

    it("should count total lines correctly", async () => {
      const files = [
        {
          path: "file1.ts",
          content: "line1\nline2\nline3",
          language: "typescript",
        },
        {
          path: "file2.ts",
          content: "line1\nline2",
          language: "typescript",
        },
      ];

      const result = await analyzeCodebase(files);
      expect(result.totalLines).toBe(5);
    });

    it("should handle empty files array", async () => {
      const result = await analyzeCodebase([]);
      expect(result.totalFiles).toBe(0);
      expect(result.totalLines).toBe(0);
      expect(result.complexity).toBe("simple");
    });
  });
});
