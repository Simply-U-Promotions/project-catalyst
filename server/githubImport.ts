import { ENV } from "./_core/env";

interface RepoFile {
  path: string;
  content: string;
  language?: string;
}

interface RepoInfo {
  name: string;
  description: string;
  defaultBranch: string;
  isPrivate: boolean;
}

/**
 * Fetch repository information from GitHub
 */
export async function getRepoInfo(repoUrl: string): Promise<RepoInfo> {
  const { owner, repo } = parseGitHubUrl(repoUrl);
  
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch repository info: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    name: data.name,
    description: data.description || "",
    defaultBranch: data.default_branch || "main",
    isPrivate: data.private,
  };
}

/**
 * Fetch file tree from GitHub repository
 */
export async function getRepoFileTree(repoUrl: string, branch: string = "main"): Promise<string[]> {
  const { owner, repo } = parseGitHubUrl(repoUrl);

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch file tree: ${response.statusText}`);
  }

  const data = await response.json();

  // Filter out directories, only return file paths
  return data.tree
    .filter((item: any) => item.type === "blob")
    .map((item: any) => item.path);
}

/**
 * Fetch file content from GitHub repository
 */
export async function getFileContent(
  repoUrl: string,
  filePath: string,
  branch: string = "main"
): Promise<string> {
  const { owner, repo } = parseGitHubUrl(repoUrl);

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch file content: ${response.statusText}`);
  }

  const data = await response.json();

  // GitHub returns content as base64
  if (data.content) {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }

  throw new Error("No content found in file");
}

/**
 * Import entire repository with all files
 */
export async function importRepository(repoUrl: string): Promise<{
  info: RepoInfo;
  files: RepoFile[];
}> {
  const info = await getRepoInfo(repoUrl);
  const filePaths = await getRepoFileTree(repoUrl, info.defaultBranch);

  // Fetch content for all files (limit to reasonable size)
  const MAX_FILES = 100;
  const filesToFetch = filePaths.slice(0, MAX_FILES);

  const files: RepoFile[] = await Promise.all(
    filesToFetch.map(async (filePath) => {
      try {
        const content = await getFileContent(repoUrl, filePath, info.defaultBranch);
        const language = getLanguageFromPath(filePath);

        return {
          path: filePath,
          content,
          language,
        };
      } catch (error) {
        console.error(`Failed to fetch ${filePath}:`, error);
        return {
          path: filePath,
          content: `// Failed to load file: ${error}`,
          language: getLanguageFromPath(filePath),
        };
      }
    })
  );

  return {
    info,
    files,
  };
}

/**
 * Create a pull request with changes
 */
export async function createPullRequest(
  repoUrl: string,
  branchName: string,
  title: string,
  body: string,
  baseBranch: string = "main"
): Promise<{ prUrl: string; prNumber: number }> {
  const { owner, repo } = parseGitHubUrl(repoUrl);

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      body,
      head: branchName,
      base: baseBranch,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create pull request: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    prUrl: data.html_url,
    prNumber: data.number,
  };
}

/**
 * Create a new branch from base branch
 */
export async function createBranch(
  repoUrl: string,
  newBranchName: string,
  baseBranch: string = "main"
): Promise<void> {
  const { owner, repo } = parseGitHubUrl(repoUrl);

  // Get the SHA of the base branch
  const refResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!refResponse.ok) {
    throw new Error(`Failed to get base branch ref: ${refResponse.statusText}`);
  }

  const refData = await refResponse.json();
  const sha = refData.object.sha;

  // Create new branch
  const createResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ref: `refs/heads/${newBranchName}`,
      sha,
    }),
  });

  if (!createResponse.ok) {
    throw new Error(`Failed to create branch: ${createResponse.statusText}`);
  }
}

/**
 * Commit file changes to a branch
 */
export async function commitFilesToBranch(
  repoUrl: string,
  branchName: string,
  files: { path: string; content: string }[],
  commitMessage: string
): Promise<void> {
  const { owner, repo } = parseGitHubUrl(repoUrl);

  // Get the latest commit SHA for the branch
  const refResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branchName}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!refResponse.ok) {
    throw new Error(`Failed to get branch ref: ${refResponse.statusText}`);
  }

  const refData = await refResponse.json();
  const latestCommitSha = refData.object.sha;

  // Get the tree SHA from the latest commit
  const commitResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!commitResponse.ok) {
    throw new Error(`Failed to get commit: ${commitResponse.statusText}`);
  }

  const commitData = await commitResponse.json();
  const baseTreeSha = commitData.tree.sha;

  // Create blobs for each file
  const tree = await Promise.all(
    files.map(async (file) => {
      const blobResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: file.content,
          encoding: "utf-8",
        }),
      });

      if (!blobResponse.ok) {
        throw new Error(`Failed to create blob for ${file.path}: ${blobResponse.statusText}`);
      }

      const blobData = await blobResponse.json();

      return {
        path: file.path,
        mode: "100644",
        type: "blob",
        sha: blobData.sha,
      };
    })
  );

  // Create a new tree
  const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree,
    }),
  });

  if (!treeResponse.ok) {
    throw new Error(`Failed to create tree: ${treeResponse.statusText}`);
  }

  const treeData = await treeResponse.json();

  // Create a new commit
  const newCommitResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/commits`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: commitMessage,
        tree: treeData.sha,
        parents: [latestCommitSha],
      }),
    }
  );

  if (!newCommitResponse.ok) {
    throw new Error(`Failed to create commit: ${newCommitResponse.statusText}`);
  }

  const newCommitData = await newCommitResponse.json();

  // Update the branch reference
  const updateRefResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branchName}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sha: newCommitData.sha,
      }),
    }
  );

  if (!updateRefResponse.ok) {
    throw new Error(`Failed to update branch ref: ${updateRefResponse.statusText}`);
  }
}

/**
 * Parse GitHub URL to extract owner and repo name
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  // Handle various GitHub URL formats
  // https://github.com/owner/repo
  // https://github.com/owner/repo.git
  // git@github.com:owner/repo.git

  const match = url.match(/github\.com[/:]([\w-]+)\/([\w-]+?)(\.git)?$/);

  if (!match) {
    throw new Error("Invalid GitHub URL format");
  }

  return {
    owner: match[1],
    repo: match[2],
  };
}

/**
 * Determine programming language from file path
 */
function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    rb: "ruby",
    java: "java",
    go: "go",
    rs: "rust",
    php: "php",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
    md: "markdown",
    yml: "yaml",
    yaml: "yaml",
    xml: "xml",
    sql: "sql",
    sh: "bash",
  };

  return languageMap[ext || ""] || "plaintext";
}
