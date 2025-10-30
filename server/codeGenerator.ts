import { invokeLLM } from "./_core/llm";
import { getTemplateById } from "./templates";

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

export interface CodeGenerationResult {
  files: GeneratedFile[];
  summary: string;
  nextSteps: string[];
}

/**
 * Generate code files based on user requirements and optional template
 */
export async function generateProjectCode(params: {
  projectName: string;
  description: string;
  templateId?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}): Promise<CodeGenerationResult> {
  const { projectName, description, templateId, conversationHistory = [] } = params;

  // Get template details if provided
  const template = templateId ? getTemplateById(templateId) : null;

  // Build system prompt
  const systemPrompt = `You are an expert full-stack developer. Generate production-ready code for web applications.

When generating code:
1. Create a complete, realistic project structure with multiple files
2. Include package.json, configuration files, and README.md
3. Use modern best practices and clean code principles
4. Add helpful comments explaining key sections
5. Ensure all files work together as a cohesive application

Return your response as a JSON object with this structure:
{
  "files": [
    {
      "path": "relative/path/to/file.ext",
      "content": "file content here",
      "language": "javascript|typescript|html|css|json|markdown"
    }
  ],
  "summary": "Brief description of what was generated",
  "nextSteps": ["Step 1", "Step 2", "Step 3"]
}`;

  // Build user prompt
  let userPrompt = `Generate a complete ${projectName} application.

Description: ${description}`;

  if (template) {
    userPrompt += `\n\nUse this template as a guide:
- Template: ${template.name}
- Features: ${template.features.join(", ")}
- Tech Stack: ${Object.entries(template.techStack || {})
      .map(([key, value]) => `${key}: ${value?.join(", ")}`)
      .join("; ")}`;
  }

  userPrompt += `\n\nGenerate a realistic project structure with at least 8-12 files including:
- package.json with dependencies
- Configuration files (tsconfig.json, tailwind.config.js, etc.)
- Source code files organized in folders
- README.md with setup instructions
- At least one main component/page
- Styling files

Make it production-ready and fully functional.`;

  // Call LLM
  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "code_generation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            files: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  path: { type: "string" },
                  content: { type: "string" },
                  language: { type: "string" },
                },
                required: ["path", "content", "language"],
                additionalProperties: false,
              },
            },
            summary: { type: "string" },
            nextSteps: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["files", "summary", "nextSteps"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  const result = typeof content === "string" ? JSON.parse(content) : content;

  return result as CodeGenerationResult;
}

/**
 * Get file language/type from extension
 */
export function getFileLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
    md: "markdown",
    yml: "yaml",
    yaml: "yaml",
    env: "shell",
    sh: "shell",
    py: "python",
    go: "go",
    rs: "rust",
  };
  return languageMap[ext || ""] || "text";
}
