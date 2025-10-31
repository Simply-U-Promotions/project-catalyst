import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildImage, deployContainer, generateSubdomain, detectBuildpack } from '../server/dockerService';

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn(),
  execFile: vi.fn((cmd, args, callback) => {
    callback(null, { stdout: 'container-id-123\n', stderr: '' });
  }),
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

describe('Docker Service', () => {
  describe('generateSubdomain', () => {
    it('should generate valid subdomain from project name', () => {
      const subdomain = generateSubdomain('My Test Project', 123);
      expect(subdomain).toMatch(/^my-test-project-[a-z0-9]{6}$/);
    });

    it('should sanitize special characters', () => {
      const subdomain = generateSubdomain('Project@#$%Name!!!', 456);
      expect(subdomain).toMatch(/^project-name-[a-z0-9]{6}$/);
    });

    it('should convert to lowercase', () => {
      const subdomain = generateSubdomain('UPPERCASE', 789);
      expect(subdomain).toMatch(/^uppercase-[a-z0-9]{6}$/);
    });

    it('should remove consecutive dashes', () => {
      const subdomain = generateSubdomain('multi---dash---name', 101);
      expect(subdomain).toMatch(/^multi-dash-name-[a-z0-9]{6}$/);
    });
  });

  describe('detectBuildpack', () => {
    it('should detect Node.js project from package.json', async () => {
      const sourceCode = [
        { path: 'package.json', content: '{"name": "test"}' },
        { path: 'index.js', content: 'console.log("hello")' },
      ];

      const result = await detectBuildpack(sourceCode);
      expect(result.framework).toBe('node');
      expect(result.buildCommand).toContain('npm');
      expect(result.startCommand).toContain('npm start');
    });

    it('should detect Python project from requirements.txt', async () => {
      const sourceCode = [
        { path: 'requirements.txt', content: 'flask==2.0.0' },
        { path: 'app.py', content: 'print("hello")' },
      ];

      const result = await detectBuildpack(sourceCode);
      expect(result.framework).toBe('python');
      expect(result.buildCommand).toContain('pip');
      expect(result.startCommand).toContain('python app.py');
    });

    it('should detect Go project from go.mod', async () => {
      const sourceCode = [
        { path: 'go.mod', content: 'module example.com/app' },
        { path: 'main.go', content: 'package main' },
      ];

      const result = await detectBuildpack(sourceCode);
      expect(result.framework).toBe('go');
      expect(result.buildCommand).toContain('go build');
    });

    it('should default to static site for unknown projects', async () => {
      const sourceCode = [
        { path: 'index.html', content: '<html></html>' },
      ];

      const result = await detectBuildpack(sourceCode);
      expect(result.framework).toBe('static');
      expect(result.startCommand).toContain('serve');
    });
  });

  describe('buildImage', () => {
    it('should build Docker image with correct parameters', async () => {
      const options = {
        projectId: 1,
        projectName: 'test-project',
        sourceCode: [
          { path: 'package.json', content: '{"name": "test"}' },
          { path: 'index.js', content: 'console.log("hello")' },
        ],
        subdomain: 'test-app',
      };

      // Mock successful build
      const { exec } = await import('child_process');
      vi.mocked(exec).mockImplementation((cmd, opts, callback: any) => {
        callback(null, { stdout: 'Build successful', stderr: '' });
        return null as any;
      });

      const result = await buildImage(options);
      expect(result.imageName).toBe('catalyst-test-app:latest');
      expect(result.buildLogs).toContain('Build successful');
    });

    it('should handle build failures gracefully', async () => {
      const options = {
        projectId: 1,
        projectName: 'test-project',
        sourceCode: [],
        subdomain: 'test-app',
      };

      const { exec } = await import('child_process');
      vi.mocked(exec).mockImplementation((cmd, opts, callback: any) => {
        callback(new Error('Build failed'), null);
        return null as any;
      });

      await expect(buildImage(options)).rejects.toThrow('Build failed');
    });
  });

  describe('deployContainer', () => {
    it('should deploy container with resource limits', async () => {
      const options = {
        imageName: 'catalyst-test:latest',
        subdomain: 'test-app',
        cpuLimit: 2000,
        memoryLimit: 1024,
      };

      const result = await deployContainer(options);
      expect(result.containerId).toBe('container-id-123');
      expect(result.port).toBeGreaterThan(0);
      expect(result.deploymentUrl).toContain('test-app');
    });

    it('should sanitize subdomain to prevent injection', async () => {
      const options = {
        imageName: 'catalyst-test:latest',
        subdomain: 'test;rm -rf /',
        cpuLimit: 1000,
        memoryLimit: 512,
      };

      const result = await deployContainer(options);
      // Subdomain should be sanitized
      expect(result.deploymentUrl).toContain('testrmrf');
      expect(result.deploymentUrl).not.toContain(';');
    });

    it('should use default resource limits when not specified', async () => {
      const options = {
        imageName: 'catalyst-test:latest',
        subdomain: 'test-app',
      };

      const result = await deployContainer(options);
      expect(result.containerId).toBeTruthy();
      expect(result.port).toBeGreaterThan(0);
    });
  });
});
