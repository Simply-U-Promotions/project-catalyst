/**
 * GitHub Webhooks Service
 * Handles webhook creation and management for deployment triggers
 */

interface CreateWebhookParams {
  owner: string;
  repo: string;
  webhookUrl: string;
  events?: string[];
  secret?: string;
}

/**
 * Create a webhook for a repository
 */
export async function createWebhook(params: CreateWebhookParams): Promise<{ id: number; url: string }> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN not configured");
  }

  const { owner, repo, webhookUrl, events = ["push", "pull_request"], secret } = params;

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/hooks`,
    {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "web",
        active: true,
        events,
        config: {
          url: webhookUrl,
          content_type: "json",
          insecure_ssl: "0",
          ...(secret && { secret }),
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create webhook: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    url: data.config.url,
  };
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(params: { owner: string; repo: string; hookId: number }): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN not configured");
  }

  const { owner, repo, hookId } = params;

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/hooks/${hookId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to delete webhook: ${response.statusText}`);
  }
}

/**
 * List webhooks for a repository
 */
export async function listWebhooks(params: { owner: string; repo: string }): Promise<Array<any>> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN not configured");
  }

  const { owner, repo } = params;

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/hooks`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to list webhooks: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

/**
 * Handle webhook payload
 */
export async function handleWebhookPayload(event: string, payload: any): Promise<void> {
  switch (event) {
    case "push":
      // Handle push event - trigger deployment
      console.log(`Push to ${payload.repository.full_name} on branch ${payload.ref}`);
      // TODO: Trigger deployment
      break;

    case "pull_request":
      // Handle pull request event
      console.log(`PR ${payload.action} on ${payload.repository.full_name}`);
      // TODO: Trigger preview deployment
      break;

    default:
      console.log(`Unhandled webhook event: ${event}`);
  }
}
