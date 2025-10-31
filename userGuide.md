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

## Repository Workflow

### Understanding Your GitHub Repository

When you create a project, Catalyst automatically creates a GitHub repository with this structure:

```
my-project/
├── client/              # Frontend application
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable UI components
│   │   ├── lib/        # Utilities and helpers
│   │   └── App.tsx     # Main application
│   └── package.json
├── server/              # Backend application
│   ├── routers.ts      # API endpoints (tRPC)
│   ├── db.ts           # Database queries
│   └── _core/          # Framework code
├── drizzle/             # Database schema
│   └── schema.ts
├── README.md            # Project documentation
├── package.json         # Dependencies
└── .gitignore          # Ignored files
```

### Working with Your Repository

**Clone Your Repository:**
```bash
git clone https://github.com/yourusername/my-project.git
cd my-project
npm install
```

**Run Locally:**
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

**Make Changes:**
1. Create a new branch: `git checkout -b feature/new-feature`
2. Make your changes in the code
3. Commit: `git commit -m "feat: add new feature"`
4. Push: `git push origin feature/new-feature`
5. Create pull request on GitHub
6. After review, merge to main branch

**Deploy Changes:**
- **Automatic:** Push to main branch triggers auto-deploy (if enabled)
- **Manual:** Use "Deploy Now" button in Deployments tab
- **CLI:** Run `catalyst deploy` (requires CLI tool)

### Commit Message Format

Catalyst uses conventional commits for clear history:

- `feat:` New feature (e.g., "feat: add user authentication")
- `fix:` Bug fix (e.g., "fix: resolve login redirect issue")
- `refactor:` Code refactoring (e.g., "refactor: simplify API calls")
- `docs:` Documentation changes (e.g., "docs: update README")
- `style:` Formatting changes (e.g., "style: fix indentation")
- `test:` Adding tests (e.g., "test: add login flow tests")
- `chore:` Maintenance tasks (e.g., "chore: update dependencies")

### Branch Strategy

**Main Branch:**
- Protected branch (requires pull request reviews)
- Always deployable
- Production deployments pull from here

**Feature Branches:**
- Create from main: `git checkout -b feature/feature-name`
- Work on your feature
- Merge via pull request
- Delete after merge

**Environment Branches (Advanced):**
- `develop` → Staging environment
- `main` → Production environment
- Feature branches → Development environment

### Continuous Integration

Every push to your repository triggers:
1. **Build Check:** Verifies code compiles without errors
2. **Type Check:** Ensures TypeScript types are valid
3. **Linting:** Checks code style and quality
4. **Tests:** Runs automated test suite (if configured)

If any check fails, the deployment is blocked until fixed.

---

## Advanced Features

### Cost Management

Monitor and control your usage through the Cost Management dashboard:

**Usage Dashboard:**
- View AI tokens used
- Track code generations
- Monitor active deployments
- See GitHub commit count
- Review total cost breakdown

**Cost Alerts:**
Set spending limits and receive notifications:
1. Go to Cost Management → Alerts
2. Click "Create Alert"
3. Choose threshold type (daily, weekly, monthly, total)
4. Set amount limit
5. Choose notification method (dashboard, email)

**Fair Use Policy:**
- Free tier includes $10/month in credits
- Additional usage billed at cost
- Transparent pricing with no hidden fees

### Team Collaboration

Invite team members to collaborate on projects:

**Invite Team Members:**
1. Go to Settings → Team
2. Click "Invite Member"
3. Enter email address
4. Choose role (Admin, Member, Viewer)
5. Click "Send Invitation"

**Roles & Permissions:**
- **Owner:** Full control, billing access, can transfer ownership
- **Admin:** Manage team, create/delete projects, configure deployments
- **Member:** Create projects, deploy code, manage own projects
- **Viewer:** Read-only access to projects and deployments

**Activity Log:**
Track team member actions:
- Project creations and deletions
- Deployment triggers
- Code changes and commits
- Settings updates

### Multi-Environment Support

Manage multiple environments for each project:

**Configure Environments:**
1. Go to project Settings → Environments
2. Click "Add Environment"
3. Enter name (e.g., "staging", "production")
4. Link to Git branch
5. Set environment-specific variables
6. Enable auto-deploy on push (optional)

**Environment-Specific Variables:**
- Different API keys per environment
- Separate database connections
- Feature flags for testing
- Debug settings for development

### External Deployment Providers

Deploy to platforms beyond Catalyst:

**Supported Providers:**
- **Vercel:** Optimized for Next.js and React
- **Netlify:** Great for static sites and JAMstack
- **Railway:** Full-stack apps with databases
- **Render:** Web services, databases, and cron jobs

**Configure Provider:**
1. Go to Settings → External Providers
2. Select provider (Vercel, Netlify, Railway, Render)
3. Enter API key or token
4. Configure deployment settings
5. Click "Save Configuration"
6. Use "Deploy to [Provider]" button in project

See [DEPLOYMENT_PROVIDERS.md](./DEPLOYMENT_PROVIDERS.md) for detailed setup instructions.

---

## Troubleshooting

### Deployment Failed

**Check deployment logs:**
1. Go to project Deployments tab
2. Click the failed deployment
3. Review error messages in logs

**Common issues:**
- **Build errors:** Check code syntax and TypeScript errors
- **Missing environment variables:** Add required variables in Settings
- **Database connection:** Verify database credentials
- **Port conflicts:** Ensure correct port configuration
- **Memory limits:** Upgrade plan for more resources

### GitHub Connection Issues

**Reconnect GitHub:**
1. Go to Settings → Integrations
2. Click "Disconnect GitHub"
3. Click "Connect GitHub"
4. Authorize the application
5. Grant repository access

**Repository not created:**
- Check GitHub permissions (requires repo creation rights)
- Verify account has available repository slots
- Try creating repository manually and linking it

### Performance Issues

**Slow loading:**
- Enable caching in deployment settings
- Optimize images and assets
- Review database query performance
- Consider upgrading to higher tier for more resources

**High costs:**
- Review usage in Cost Management dashboard
- Set cost alerts to prevent overages
- Optimize autoscaling settings
- Delete unused projects and deployments

---

## Support

For questions, feature requests, or issues, please visit [https://help.manus.im](https://help.manus.im)

**Additional Resources:**
- **API Documentation:** [PUBLIC_API.md](./PUBLIC_API.md)
- **CLI Documentation:** [CLI_TOOL.md](./CLI_TOOL.md)
- **Security Audit:** [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)
- **Deployment Providers:** [DEPLOYMENT_PROVIDERS.md](./DEPLOYMENT_PROVIDERS.md)

---

*© 2025 Project Catalyst. All rights reserved.*
