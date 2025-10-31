/**
 * GitHub Branch Management Service
 * Handles branch creation, deletion, and management
 */

interface CreateBranchParams {
  owner: string;
  repo: string;
  branchName: string;
  fromBranch?: string;
}

interface MergeBranchParams {
  owner: string;
  repo: string;
  head: string; // Branch to merge from
  base: string; // Branch to merge into
  commitMessage?: string;
}

/**
 * Create a new branch
 */
export async function createBranch(params: CreateBranchParams): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN not configured");
  }

  const { owner, repo, branchName, fromBranch = "main" } = params;

  // Get the SHA of the source branch
  const refResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${fromBranch}`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!refResponse.ok) {
    throw new Error(`Failed to get ${fromBranch} branch reference`);
  }

  const refData = await refResponse.json();
  const sha = refData.object.sha;

  // Create the new branch
  const createResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs`,
    {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha,
      }),
    }
  );

  if (!createResponse.ok) {
    const error = await createResponse.json();
    throw new Error(`Failed to create branch: ${error.message || createResponse.statusText}`);
  }
}

/**
 * Delete a branch
 */
export async function deleteBranch(params: { owner: string; repo: string; branchName: string }): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN not configured");
  }

  const { owner, repo, branchName } = params;

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branchName}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to delete branch: ${response.statusText}`);
  }
}

/**
 * List all branches
 */
export async function listBranches(params: { owner: string; repo: string }): Promise<Array<{ name: string; protected: boolean }>> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN not configured");
  }

  const { owner, repo } = params;

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/branches`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to list branches: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Merge a branch
 */
export async function mergeBranch(params: MergeBranchParams): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN not configured");
  }

  const { owner, repo, head, base, commitMessage } = params;

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/merges`,
    {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base,
        head,
        commit_message: commitMessage || `Merge ${head} into ${base}`,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to merge branch: ${error.message || response.statusText}`);
  }
}

/**
 * Get branch protection status
 */
export async function getBranchProtection(params: { owner: string; repo: string; branch: string }): Promise<any> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN not configured");
  }

  const { owner, repo, branch } = params;

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/branches/${branch}/protection`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (response.status === 404) {
    return null; // Branch not protected
  }

  if (!response.ok) {
    throw new Error(`Failed to get branch protection: ${response.statusText}`);
  }

  return await response.json();
}
