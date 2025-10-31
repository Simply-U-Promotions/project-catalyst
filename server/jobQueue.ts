/**
 * Simple in-memory job queue for handling complex async operations
 * For production, consider using Redis-backed queue like Bull or BullMQ
 */

interface Job {
  id: string;
  type: "code_modification" | "code_generation";
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  data: any;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

class JobQueue {
  private jobs: Map<string, Job> = new Map();
  private processing: boolean = false;

  /**
   * Create a new job
   */
  createJob(type: Job["type"], data: any): string {
    const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job: Job = {
      id,
      type,
      status: "pending",
      progress: 0,
      data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.set(id, job);
    this.processNext();
    return id;
  }

  /**
   * Get job status
   */
  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  /**
   * Update job progress
   */
  updateProgress(id: string, progress: number, status?: Job["status"]) {
    const job = this.jobs.get(id);
    if (job) {
      job.progress = progress;
      if (status) job.status = status;
      job.updatedAt = new Date();
    }
  }

  /**
   * Complete job with result
   */
  completeJob(id: string, result: any) {
    const job = this.jobs.get(id);
    if (job) {
      job.status = "completed";
      job.progress = 100;
      job.result = result;
      job.updatedAt = new Date();
    }
  }

  /**
   * Fail job with error
   */
  failJob(id: string, error: string) {
    const job = this.jobs.get(id);
    if (job) {
      job.status = "failed";
      job.error = error;
      job.updatedAt = new Date();
    }
  }

  /**
   * Process next pending job
   */
  private async processNext() {
    if (this.processing) return;

    const pendingJob = Array.from(this.jobs.values()).find(
      (j) => j.status === "pending"
    );

    if (!pendingJob) return;

    this.processing = true;
    pendingJob.status = "processing";
    pendingJob.updatedAt = new Date();

    try {
      if (pendingJob.type === "code_modification") {
        await this.processCodeModification(pendingJob);
      } else if (pendingJob.type === "code_generation") {
        await this.processCodeGeneration(pendingJob);
      }
    } catch (error: any) {
      this.failJob(pendingJob.id, error.message || "Unknown error");
    }

    this.processing = false;
    this.processNext(); // Process next job
  }

  /**
   * Process code modification job
   */
  private async processCodeModification(job: Job) {
    const { analyzeAndModifyCode } = await import("./codeModificationService");
    const { description, files, repoName, userId, projectId } = job.data;

    try {
      // Step 1: Analysis (20%)
      this.updateProgress(job.id, 20);

      const result = await analyzeAndModifyCode(
        { description, files, repoName },
        { userId, projectId }
      );

      // Step 2: Modifications (80%)
      const filesCount = result.changes.length;
      for (let i = 0; i < filesCount; i++) {
        const progress = 20 + Math.floor((i / filesCount) * 60);
        this.updateProgress(job.id, progress);
        // Simulate processing time for large modifications
        if (filesCount > 10) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Step 3: Complete (100%)
      this.completeJob(job.id, result);
    } catch (error: any) {
      this.failJob(job.id, error.message || "Code modification failed");
    }
  }

  /**
   * Process code generation job
   */
  private async processCodeGeneration(job: Job) {
    const { generateProjectCode } = await import("./codeGenerator");
    const { projectName, description, templateId, conversationHistory } = job.data;

    try {
      // Step 1: Planning (20%)
      this.updateProgress(job.id, 20);

      const result = await generateProjectCode({
        projectName,
        description,
        templateId,
        conversationHistory,
      });

      // Step 2: File generation (80%)
      const filesCount = result.files.length;
      for (let i = 0; i < filesCount; i++) {
        const progress = 20 + Math.floor((i / filesCount) * 60);
        this.updateProgress(job.id, progress);
        // Simulate processing time for large projects
        if (filesCount > 10) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      // Step 3: Complete (100%)
      this.completeJob(job.id, result);
    } catch (error: any) {
      this.failJob(job.id, error.message || "Code generation failed");
    }
  }

  /**
   * Clean up old jobs (older than 1 hour)
   */
  cleanup() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [id, job] of this.jobs.entries()) {
      if (job.updatedAt < oneHourAgo && job.status !== "processing") {
        this.jobs.delete(id);
      }
    }
  }
}

// Singleton instance
export const jobQueue = new JobQueue();

// Cleanup every 10 minutes
setInterval(() => jobQueue.cleanup(), 10 * 60 * 1000);
