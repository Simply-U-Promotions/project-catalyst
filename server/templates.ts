export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  icon: string;
  features: string[];
  techStack: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    other?: string[];
  };
  estimatedTime: string;
  complexity: "beginner" | "intermediate" | "advanced";
}

export const templates: Template[] = [
  {
    id: "saas-landing",
    name: "SaaS Landing Page",
    description: "Modern landing page with hero section, features, pricing tiers, and CTA",
    category: "Marketing",
    tags: ["landing", "saas", "marketing", "conversion"],
    icon: "Layout",
    features: [
      "Responsive hero section with CTA",
      "Feature showcase grid",
      "Pricing table with tier comparison",
      "Testimonials section",
      "FAQ accordion",
      "Contact form",
      "SEO optimized",
    ],
    techStack: {
      frontend: ["Next.js", "React", "Tailwind CSS", "TypeScript"],
      other: ["Framer Motion", "React Hook Form"],
    },
    estimatedTime: "2-3 minutes",
    complexity: "beginner",
  },
  {
    id: "dashboard-app",
    name: "Dashboard Application",
    description: "Full-featured dashboard with authentication, data visualization, and CRUD operations",
    category: "Application",
    tags: ["dashboard", "admin", "analytics", "crud"],
    icon: "LayoutDashboard",
    features: [
      "User authentication (email/password)",
      "Sidebar navigation",
      "Data tables with sorting/filtering",
      "Charts and visualizations",
      "CRUD operations",
      "User profile management",
      "Dark/light mode toggle",
    ],
    techStack: {
      frontend: ["Next.js", "React", "Tailwind CSS", "TypeScript", "Recharts"],
      backend: ["Node.js", "tRPC", "Express"],
      database: ["PostgreSQL", "Drizzle ORM"],
    },
    estimatedTime: "4-5 minutes",
    complexity: "intermediate",
  },
  {
    id: "ecommerce-store",
    name: "E-Commerce Store",
    description: "Complete online store with product catalog, cart, and Stripe checkout",
    category: "E-Commerce",
    tags: ["ecommerce", "store", "shopping", "stripe"],
    icon: "ShoppingCart",
    features: [
      "Product catalog with categories",
      "Product search and filtering",
      "Shopping cart functionality",
      "Stripe payment integration",
      "Order management",
      "User accounts and order history",
      "Admin product management",
    ],
    techStack: {
      frontend: ["Next.js", "React", "Tailwind CSS", "TypeScript"],
      backend: ["Node.js", "tRPC", "Express"],
      database: ["PostgreSQL", "Drizzle ORM"],
      other: ["Stripe API", "Uploadthing"],
    },
    estimatedTime: "5-7 minutes",
    complexity: "advanced",
  },
  {
    id: "blog-cms",
    name: "Blog & CMS",
    description: "Content management system with markdown editor and blog functionality",
    category: "Content",
    tags: ["blog", "cms", "content", "markdown"],
    icon: "FileText",
    features: [
      "Markdown editor with preview",
      "Post categories and tags",
      "Draft/publish workflow",
      "SEO metadata management",
      "Comment system",
      "RSS feed generation",
      "Admin dashboard",
    ],
    techStack: {
      frontend: ["Next.js", "React", "Tailwind CSS", "TypeScript"],
      backend: ["Node.js", "tRPC", "Express"],
      database: ["PostgreSQL", "Drizzle ORM"],
      other: ["MDX", "React Markdown"],
    },
    estimatedTime: "4-5 minutes",
    complexity: "intermediate",
  },
  {
    id: "portfolio-site",
    name: "Portfolio Website",
    description: "Personal portfolio with project showcase, blog, and contact form",
    category: "Personal",
    tags: ["portfolio", "personal", "showcase"],
    icon: "User",
    features: [
      "About me section",
      "Project showcase with filters",
      "Skills and experience timeline",
      "Blog integration",
      "Contact form with email notifications",
      "Resume/CV download",
      "Social media links",
    ],
    techStack: {
      frontend: ["Next.js", "React", "Tailwind CSS", "TypeScript"],
      other: ["Framer Motion", "Resend API"],
    },
    estimatedTime: "2-3 minutes",
    complexity: "beginner",
  },
  {
    id: "api-backend",
    name: "REST API Backend",
    description: "RESTful API with authentication, database, and comprehensive documentation",
    category: "Backend",
    tags: ["api", "backend", "rest", "documentation"],
    icon: "Server",
    features: [
      "JWT authentication",
      "CRUD endpoints",
      "Request validation",
      "Error handling middleware",
      "Rate limiting",
      "API documentation (Swagger)",
      "Database migrations",
    ],
    techStack: {
      backend: ["Node.js", "Express", "TypeScript"],
      database: ["PostgreSQL", "Drizzle ORM"],
      other: ["JWT", "Zod", "Swagger"],
    },
    estimatedTime: "3-4 minutes",
    complexity: "intermediate",
  },
  {
    id: "crypto-dashboard",
    name: "Crypto Portfolio Tracker",
    description: "Real-time cryptocurrency portfolio tracking with price alerts",
    category: "Crypto",
    tags: ["crypto", "portfolio", "tracking", "blockchain"],
    icon: "TrendingUp",
    features: [
      "Real-time price updates",
      "Portfolio value tracking",
      "Transaction history",
      "Price alerts and notifications",
      "Multiple wallet support",
      "Profit/loss calculations",
      "Market data charts",
    ],
    techStack: {
      frontend: ["Next.js", "React", "Tailwind CSS", "TypeScript", "Recharts"],
      backend: ["Node.js", "tRPC", "Express"],
      database: ["PostgreSQL", "Drizzle ORM"],
      other: ["CoinGecko API", "WebSocket"],
    },
    estimatedTime: "5-6 minutes",
    complexity: "advanced",
  },
  {
    id: "todo-app",
    name: "Todo & Task Manager",
    description: "Feature-rich task management app with categories, priorities, and due dates",
    category: "Productivity",
    tags: ["todo", "tasks", "productivity", "organization"],
    icon: "CheckSquare",
    features: [
      "Create, edit, delete tasks",
      "Task categories and labels",
      "Priority levels",
      "Due dates and reminders",
      "Task filtering and search",
      "Completion tracking",
      "Dark/light mode",
    ],
    techStack: {
      frontend: ["Next.js", "React", "Tailwind CSS", "TypeScript"],
      backend: ["Node.js", "tRPC", "Express"],
      database: ["PostgreSQL", "Drizzle ORM"],
    },
    estimatedTime: "3-4 minutes",
    complexity: "beginner",
  },
];

export function getTemplateById(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: string): Template[] {
  return templates.filter((t) => t.category === category);
}

export function getAllCategories(): string[] {
  return Array.from(new Set(templates.map((t) => t.category)));
}
