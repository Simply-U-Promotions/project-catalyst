# Project Catalyst User Guide

Welcome to **Project Catalyst** - your AI-powered platform for building and deploying web applications from idea to production in minutes.

## Website URL

**Development:** https://3000-i7brafywqi4eizb7fw2jc-95cf3890.manusvm.computer

## Purpose

Project Catalyst enables developers to describe their project ideas in natural language and receive production-ready code with automatic GitHub integration and deployment capabilities. The platform combines AI code generation with a complete deployment pipeline.

## Access

- **Public Access:** Landing page with chat interface (no login required)
- **Login Required:** Saving projects, viewing dashboard, deploying applications
- **User Tiers:** Standard users and administrators

---

## Powered by Manus

### Technology Stack

**Frontend:**
- React 19 with TypeScript for type-safe component development
- Tailwind CSS 4 for modern, responsive styling
- tRPC 11 for end-to-end type-safe API communication
- Wouter for lightweight client-side routing
- Shadcn/ui for consistent, accessible UI components

**Backend:**
- Express 4 with TypeScript for robust server-side logic
- tRPC procedures for type-safe API endpoints
- Drizzle ORM for database operations
- OpenAI GPT-4 Turbo / Claude 3.5 Sonnet for AI code generation

**Database:**
- MySQL/TiDB for relational data storage
- Automated migrations with Drizzle Kit

**Authentication:**
- Manus OAuth for secure user authentication
- Session-based authentication with HTTP-only cookies

**Infrastructure:**
- GitHub API integration for repository management
- Automated deployment simulation with status tracking

**Deployment:**
- Auto-scaling infrastructure with global CDN
- Zero-downtime deployments
- Real-time deployment logs and monitoring

---

## Using Your Website

### Getting Started

**1. Start Chatting (No Login Required)**

Visit the homepage and you'll see a prominent chat interface. Click the input field and describe what you want to build. For example:

> "Build a SaaS landing page with pricing tiers, features section, and email signup"

The AI will ask clarifying questions to understand your requirements better. Answer naturally in the chat.

**2. Browse Templates**

Click "Browse Templates" on the homepage to see pre-built project types including SaaS Landing Pages, Dashboards, E-Commerce stores, Blogs, Portfolio sites, API Backends, Crypto Trackers, and Todo Apps. Click any template to see details about tech stack, complexity, and estimated generation time.

**3. Create Your Project**

Once you've described your project or selected a template, the system will prompt you to sign in. Click "Sign In" and authenticate through Manus OAuth. After signing in, you'll be redirected to create your project.

### Managing Projects

**View Your Dashboard**

Click "Dashboard" in the header to see all your projects. Each project card shows the project name, description, status (draft, generating, ready, deploying, deployed), and creation date. Click any project to open it.

**Project Detail View**

Inside a project, you'll find three tabs:

- **Chat Tab:** Continue conversations with the AI to refine your project. Ask for changes like "Add a dark mode toggle" or "Change the color scheme to blue."

- **Files Tab:** Browse all generated code files in a tree structure. Click any file to view its contents with syntax highlighting. Use the "Copy" button to copy code to your clipboard.

- **Deployments Tab:** View deployment history, trigger new deployments with "Deploy Now," and monitor real-time deployment logs. Click any deployment in the history to see detailed logs and status.

### Code Generation

When you generate code, the AI creates a complete project structure with 8-12 files including:
- `package.json` with dependencies
- Configuration files (`.gitignore`, `tsconfig.json`, etc.)
- Source code organized by feature
- `README.md` with setup instructions

All generated files are automatically committed to a GitHub repository in your connected organization.

### GitHub Integration

Every project automatically creates a GitHub repository with:
- Proper project structure and README
- All generated code files
- Descriptive commit messages
- `.gitignore` configured for your stack

Click "View on GitHub" in the project detail page to open the repository.

### Deploying Your Application

Navigate to the "Deployments" tab in your project and click "Deploy Now." The system will:

1. Create a deployment record (status: pending)
2. Build your project (status: building)
3. Deploy to production (status: deploying)
4. Complete with a live URL (status: success)

Monitor the deployment logs in real-time to see progress. If deployment fails, error messages will be displayed.

---

## Managing Your Website

### Settings Panel

Click your profile icon or "Settings" in the navigation to access:

**Profile Tab:**
- Update your name and view account information
- See your account ID, login method, and role

**API Keys Tab:**
- Generate API keys for programmatic access (coming soon)
- Manage existing API keys

**Notifications Tab:**
- Configure deployment notifications
- Enable project update alerts
- Manage platform news preferences

**Security Tab:**
- View security settings managed through OAuth
- Access account deletion options

### Dashboard Management

Your dashboard provides an overview of all projects:
- Filter projects by status
- Search projects by name
- Create new projects with "New Project" button
- Access templates library

### Project Management

Within each project:
- Continue AI conversations to iterate on code
- Browse and copy generated files
- Trigger deployments
- View deployment history and logs
- Access GitHub repository
- Monitor deployment status in real-time

---

## Next Steps

**Talk to Manus AI anytime to request changes or add features.** The platform is designed for rapid iteration - describe what you want to change, and the AI will update your code accordingly.

**Ready to deploy your first project?** Start by describing your idea in the chat interface on the homepage. Within minutes, you'll have production-ready code pushed to GitHub and ready to deploy.

**Explore the templates library** to see what's possible and get inspired for your next project. Each template provides a solid foundation that you can customize through AI conversations.

---

## Support

For questions, feature requests, or issues, please visit [https://help.manus.im](https://help.manus.im)

---

*© 2025 Project Catalyst. All rights reserved.*
