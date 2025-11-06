import { invokeLLM } from "./_core/llm";

interface FileContext {
  path: string;
  content: string;
  language?: string;
}

interface ModificationRequest {
  description: string;
  files: FileContext[];
  repoName: string;
}

interface ModificationResult {
  filesToModify: string[];
  changes: Array<{
    path: string;
    content: string;
    explanation: string;
  }>;
  summary: string;
  branchName: string;
  prTitle: string;
  prBody: string;
}

/**
 * Analyze modification request and generate code changes
 */
export async function analyzeAndModifyCode(
  request: ModificationRequest,
  context?: { userId: number; projectId?: number }
): Promise<ModificationResult> {
  const { description, files, repoName } = request;

  // Step 1: Analyze which files need to be modified
  const analysisPrompt = `You are an expert software engineer analyzing a codebase to implement a requested change.

Repository: ${repoName}
Change Request: ${description}

Available Files:
${files.map((f) => `- ${f.path} (${f.language || "unknown"})`).join("\n")}

**ANALYSIS GUIDELINES:**
1. Identify the MINIMUM set of files that need modification
2. Consider the impact on existing functionality
3. Avoid modifying files unless absolutely necessary
4. Think about dependencies and side effects
5. Preserve the existing architecture and patterns

Analyze the request and determine:
1. Which files need to be modified (be conservative)
2. What changes are needed in each file
3. A brief summary of the modifications
4. Why these specific files need to be changed

Respond in JSON format:
{
  "filesToModify": ["path1", "path2"],
  "summary": "Brief description of changes",
  "reasoning": "Why these files need to be changed and what will be preserved"
}`;

  const analysisResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an expert software engineer. Respond only with valid JSON.",
      },
      {
        role: "user",
        content: analysisPrompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "code_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            filesToModify: {
              type: "array",
              items: { type: "string" },
              description: "List of file paths that need to be modified",
            },
            summary: {
              type: "string",
              description: "Brief summary of the changes to be made",
            },
            reasoning: {
              type: "string",
              description: "Explanation of why these files need to be changed",
            },
          },
          required: ["filesToModify", "summary", "reasoning"],
          additionalProperties: false,
        },
      },
    },
  });

  const analysisContent = analysisResponse.choices[0].message.content;
  const analysis = JSON.parse(typeof analysisContent === 'string' ? analysisContent : "{}");

  // Step 2: Generate actual code modifications for each file
  const modifications: Array<{ path: string; content: string; explanation: string }> = [];

  for (const filePath of analysis.filesToModify) {
    const fileToModify = files.find((f) => f.path === filePath);
    if (!fileToModify) continue;

    const modificationPrompt = `You are an expert software engineer modifying existing code.

File: ${filePath}
Language: ${fileToModify.language || "unknown"}
Change Request: ${description}

Current File Content:
\`\`\`${fileToModify.language || ""}
${fileToModify.content}
\`\`\`

**CRITICAL INSTRUCTIONS:**
1. PRESERVE ALL EXISTING FUNCTIONALITY - Do not remove or break any existing features
2. Generate the COMPLETE modified file content with your changes integrated
3. Maintain the existing code style, patterns, and architecture
4. Only modify what is necessary to implement the requested change
5. Keep all imports, exports, and dependencies intact
6. Preserve all comments, error handling, and edge cases
7. Ensure backward compatibility with existing code that depends on this file

Respond in JSON format:
{
  "modifiedContent": "complete file content with modifications",
  "explanation": "brief explanation of what was changed and what was preserved"
}`;

    const modificationResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert software engineer. Generate complete, production-ready code. Respond only with valid JSON.",
        },
        {
          role: "user",
          content: modificationPrompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "code_modification",
          strict: true,
          schema: {
            type: "object",
            properties: {
              modifiedContent: {
                type: "string",
                description: "Complete modified file content",
              },
              explanation: {
                type: "string",
                description: "Brief explanation of changes made",
              },
            },
            required: ["modifiedContent", "explanation"],
            additionalProperties: false,
          },
        },
      },
    });

    const modificationContent = modificationResponse.choices[0].message.content;
    const modification = JSON.parse(typeof modificationContent === 'string' ? modificationContent : "{}");

    modifications.push({
      path: filePath,
      content: modification.modifiedContent,
      explanation: modification.explanation,
    });
  }

  // Step 3: Generate PR metadata
  const timestamp = Date.now();
  const branchName = `feature/ai-${timestamp}`;
  const prTitle = description.slice(0, 72);
  const prBody = generatePRBody(description, modifications, analysis.summary);

  return {
    filesToModify: analysis.filesToModify,
    changes: modifications,
    summary: analysis.summary,
    branchName,
    prTitle,
    prBody,
  };
}

/**
 * Generate pull request body with detailed information
 */
function generatePRBody(
  description: string,
  modifications: Array<{ path: string; explanation: string }>,
  summary: string
): string {
  return `## 🤖 AI-Generated Changes

### Description
${description}

### Summary
${summary}

### Modified Files
${modifications.map((m) => `- **${m.path}**: ${m.explanation}`).join("\n")}

### Review Notes
- All changes were generated by AI based on the provided description
- Please review carefully before merging
- Test thoroughly in your development environment

---
*Generated by Project Catalyst AI*`;
}

/**
 * Analyze codebase structure and provide comprehensive insights
 */
export async function analyzeCodebase(files: FileContext[]): Promise<{
  techStack: string[];
  structure: string;
  recommendations: string[];
  keyComponents: Array<{ name: string; description: string; files: string[] }>;
  summary: string;
  complexity: "simple" | "moderate" | "complex";
  totalFiles: number;
  totalLines: number;
}> {
  // Calculate statistics
  const totalFiles = files.length;
  const totalLines = files.reduce((sum, f) => sum + f.content.split("\n").length, 0);
  
  // Determine complexity
  let complexity: "simple" | "moderate" | "complex" = "simple";
  if (totalFiles > 50 || totalLines > 10000) complexity = "complex";
  else if (totalFiles > 20 || totalLines > 3000) complexity = "moderate";

  const analysisPrompt = `Analyze this codebase and provide comprehensive insights.

Repository Statistics:
- Total Files: ${totalFiles}
- Total Lines: ${totalLines}

File Structure:
${files.slice(0, 30).map((f) => `${f.path} (${f.content.length} bytes, ${f.language || "unknown"})`).join("\n")}

Sample File Contents:
${files
  .slice(0, 5)
  .map((f) => `\n--- ${f.path} ---\n${f.content.slice(0, 800)}...`)
  .join("\n")}

Provide a comprehensive analysis:
1. Tech stack (frameworks, libraries, languages)
2. Project structure and architecture
3. Key components/features (name, description, related files)
4. High-level summary (2-3 sentences)
5. Recommendations for improvements

Respond in JSON format:
{
  "techStack": ["React", "TypeScript", "Node.js"],
  "structure": "description of architecture",
  "keyComponents": [
    {
      "name": "Authentication System",
      "description": "Handles user login and session management",
      "files": ["src/auth/login.ts", "src/auth/session.ts"]
    }
  ],
  "summary": "High-level overview of the project",
  "recommendations": ["recommendation1", "recommendation2"]
}`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an expert software architect. Respond only with valid JSON.",
      },
      {
        role: "user",
        content: analysisPrompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "codebase_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            techStack: {
              type: "array",
              items: { type: "string" },
              description: "List of technologies and frameworks",
            },
            structure: {
              type: "string",
              description: "Description of project structure",
            },
            keyComponents: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  files: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["name", "description", "files"],
                additionalProperties: false,
              },
              description: "Key components and features",
            },
            summary: {
              type: "string",
              description: "High-level project summary",
            },
            recommendations: {
              type: "array",
              items: { type: "string" },
              description: "List of recommendations",
            },
          },
          required: ["techStack", "structure", "keyComponents", "summary", "recommendations"],
          additionalProperties: false,
        },
      },
    },
  });

  const responseContent = response.choices[0].message.content;
  const result = JSON.parse(typeof responseContent === 'string' ? responseContent : "{}");
  
  return {
    ...result,
    complexity,
    totalFiles,
    totalLines,
  };
}
