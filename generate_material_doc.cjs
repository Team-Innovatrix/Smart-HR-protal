const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageBreak, VerticalAlign
} = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const headerBorder = { style: BorderStyle.SINGLE, size: 1, color: "2E4B8F" };
const headerBorders = { top: headerBorder, bottom: headerBorder, left: headerBorder, right: headerBorder };

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, bold: true, size: 32, font: "Arial", color: "1F3864" })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, bold: true, size: 26, font: "Arial", color: "2E4B8F" })] });
}
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text, bold: true, size: 24, font: "Arial", color: "374151" })] });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22, font: "Arial", ...opts })]
  });
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 22, font: "Arial" })]
  });
}
function sub_bullet(text) {
  return new Paragraph({
    numbering: { reference: "subbullets", level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 20, font: "Arial", color: "374151" })]
  });
}
function gap() {
  return new Paragraph({ children: [new TextRun("")], spacing: { after: 160 } });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function makeTable(headers, rows, colWidths) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => new TableCell({
          borders: headerBorders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: "1F3864", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, size: 20, font: "Arial", color: "FFFFFF" })] })]
        }))
      }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, ci) => new TableCell({
          borders,
          width: { size: colWidths[ci], type: WidthType.DXA },
          shading: { fill: ri % 2 === 0 ? "F0F4FF" : "FFFFFF", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20, font: "Arial" })] })]
        }))
      }))
    ]
  });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
      },
      {
        reference: "subbullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }]
      }
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "1F3864" },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "2E4B8F" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "374151" },
        paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 }
      }
    },
    children: [

      // TITLE PAGE
      gap(), gap(), gap(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "SMART HR PORTAL", bold: true, size: 56, font: "Arial", color: "1F3864" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: "Team-Innovatrix", size: 30, font: "Arial", color: "2E4B8F", bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: "Technical & Functional Material Document", size: 26, font: "Arial", color: "374151" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: "What It Is | What It Uses | How It Works", size: 24, font: "Arial", color: "6B7280", italics: true })] }),
      gap(), gap(),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Repository: github.com/Team-Innovatrix/Smart-HR-protal", size: 20, font: "Arial", color: "6B7280" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Language: TypeScript 98.5%  |  Framework: Next.js 16  |  Deployment: Vercel", size: 20, font: "Arial", color: "6B7280" })] }),
      pageBreak(),

      // SECTION 1
      h1("1. Project Identity"),
      p("Smart HR Portal is an AI-powered, full-stack Human Resource management platform built by Team-Innovatrix. It serves two primary user groups: employees (self-service access) and HR managers (team oversight, hiring, administration). The system is architected as a modern SaaS application, deployable on Vercel, and integrates multiple third-party AI, authentication, storage, and communication services."),
      gap(),
      makeTable(
        ["Attribute", "Value"],
        [
          ["Project Name", "Smart HR Portal"],
          ["Team", "Team-Innovatrix"],
          ["Repository", "github.com/Team-Innovatrix/Smart-HR-protal"],
          ["Primary Language", "TypeScript (98.5% of codebase)"],
          ["Framework", "Next.js 16 with App Router"],
          ["Architecture", "Full-Stack SaaS Web Application"],
          ["Target Users", "Employees and HR Managers"],
          ["Deployment Target", "Vercel (cloud edge deployment)"],
          ["Database", "MongoDB (named 'hr')"],
          ["Auth Provider", "Clerk"],
          ["AI Engine", "Gemini + LangChain + LangGraph"],
          ["Commits", "9 commits on main branch"],
        ],
        [3500, 5860]
      ),
      gap(), pageBreak(),

      // SECTION 2
      h1("2. Full Technology Stack"),
      p("The portal is built using a modern JavaScript/TypeScript ecosystem. Every dependency is declared in package.json. Below is a complete breakdown of what is used and what role each technology plays."),
      gap(),

      h2("2.1 Core Framework & Language"),
      makeTable(["Package", "Version", "What It Does"],
        [
          ["next", "^16.0.8", "The core React framework providing App Router, SSR, SSG, API routes, image optimization, and edge deployment"],
          ["react", "^19.2.1", "UI rendering library — all components are React functional components"],
          ["react-dom", "^19.2.1", "React's DOM renderer for browser rendering"],
          ["typescript", "^5", "Strongly typed JavaScript — entire codebase is TypeScript for type safety"],
        ], [2500, 1500, 5360]),
      gap(),

      h2("2.2 Styling & UI"),
      makeTable(["Package", "Version", "What It Does"],
        [
          ["tailwindcss", "^4.1.11", "Utility-first CSS framework — all layout, color, spacing, and responsive design"],
          ["@tailwindcss/postcss", "^4.1.11", "PostCSS integration for Tailwind CSS processing"],
          ["postcss", "^8.5.6", "CSS transformation pipeline used alongside Tailwind"],
          ["@headlessui/react", "^2.2.7", "Fully accessible, unstyled UI primitives (modals, dropdowns, toggles)"],
          ["@heroicons/react", "^2.2.0", "Official icon set from Tailwind Labs — used throughout the UI"],
          ["lucide-react", "(used in frontend)", "Alternative icon library — referenced in README for icon system"],
          ["class-variance-authority", "^0.7.0", "Utility for creating variant-based component classes"],
          ["clsx", "^2.1.1", "Conditional CSS class merging utility"],
          ["tailwind-merge", "^2.5.4", "Merges Tailwind classes without conflicts"],
          ["critters", "^0.0.23", "Inlines critical CSS for faster first-paint performance"],
        ], [2800, 1500, 5060]),
      gap(),

      h2("2.3 AI & Intelligence Layer"),
      p("This is the most distinctive part of the stack. The portal integrates three separate AI/LLM libraries to power intelligent HR workflows."),
      makeTable(["Package", "Version", "What It Does"],
        [
          ["@google/generative-ai", "^0.24.1", "Direct Gemini API client — used for Gemini model calls"],
          ["@langchain/core", "^0.3.77", "Core abstractions for LangChain: chains, prompts, output parsers, memory"],
          ["@langchain/google-genai", "LangChain's Gemini integration"],
          ["@langchain/community", "^0.3.56", "Community-built LangChain integrations: MongoDB vector store, loaders, tools"],
          ["@langchain/langgraph", "^0.4.9", "Graph-based agentic AI framework — enables multi-step, stateful AI agents"],
        ], [2800, 1500, 5060]),
      gap(),
      p("LangGraph specifically is used for building stateful agent workflows — meaning the AI can execute multi-step reasoning tasks in a controlled graph of steps."),
      gap(),

      h2("2.4 Database"),
      makeTable(["Package", "Version", "What It Does"],
        [
          ["mongoose", "^8.17.1", "MongoDB ODM — defines schemas, models, and handles all DB queries"],
          ["mongodb", "^6.18.0", "Native MongoDB driver — used for low-level operations and seeding scripts"],
          ["mongodb-memory-server", "^9.4.1", "In-memory MongoDB for unit testing"],
          ["@upstash/redis", "^1.35.3", "Redis client for Upstash — used for caching and rate limiting"],
        ], [2800, 1500, 5060]),
      gap(),

      h2("2.5 Authentication & Identity"),
      makeTable(["Package", "Version", "What It Does"],
        [
          ["@clerk/nextjs", "^6.36.1", "Full authentication solution: sign-in, sign-up, session management, middleware protection"],
          ["svix", "^1.73.0", "Webhook delivery and verification library — used to verify Clerk's webhook payloads"],
        ], [2800, 1500, 5060]),
      gap(),

      h2("2.6 File Storage"),
      makeTable(["Package", "Version", "What It Does"],
        [
          ["@aws-sdk/client-s3", "^3.864.0", "AWS SDK for S3 — handles uploading, downloading, and managing files"],
          ["@aws-sdk/s3-request-presigner", "^3.864.0", "Generates presigned URLs for secure, time-limited direct file access"],
        ], [2800, 1500, 5060]),
      gap(),

      h2("2.7 Email"),
      makeTable(["Package", "Version", "What It Does"],
        [["@sendgrid/mail", "^8.1.5", "SendGrid email API client — sends transactional emails"]], [2800, 1500, 5060]),
      gap(),

      h2("2.8 Data & Utilities"),
      makeTable(["Package", "Version", "What It Does"],
        [
          ["zod", "^3.25.76", "Schema validation library"],
          ["date-fns", "^4.1.0", "Date manipulation library"],
          ["date-fns-tz", "^3.2.0", "Timezone-aware date operations"],
          ["lodash", "^4.17.21", "Utility functions for arrays, objects, and data manipulation"],
          ["gray-matter", "^4.0.3", "Parses markdown with frontmatter"],
          ["dotenv", "^16.4.5", "Loads environment variables from .env files"],
          ["recharts", "^3.1.2", "React-based charting library — used for HR analytics dashboards"],
          ["react-gauge-chart", "^0.5.1", "Gauge/speedometer chart component"],
        ], [2500, 1500, 5360]),
      gap(), pageBreak(),

      // SECTION 3
      h1("3. Application Pages & Routes"),
      p("The portal has two distinct surface areas: public-facing marketing/info pages and the authenticated HR portal."),
      gap(),
      h2("3.1 Public Pages"),
      makeTable(["Route", "Page Name", "What It Contains"],
        [
          ["/", "Home", "Landing page with hero section, AI services overview, client testimonials"],
          ["/services", "Services", "Detailed breakdown of HR service offerings"],
          ["/about", "About Us", "Company story, team profiles, values"],
          ["/case-studies", "Case Studies", "Client success stories with results"],
          ["/pricing", "Pricing", "Tiered pricing plans with ROI calculator"],
          ["/careers", "Careers", "Job listings page"],
          ["/contact", "Contact Us", "Consultation booking form"],
          ["/auth/sign-in", "Sign In", "Clerk-hosted sign-in UI"],
          ["/auth/sign-up", "Sign Up", "Clerk-hosted sign-up UI"],
        ], [1800, 1900, 5660]),
      gap(),

      h2("3.2 Authenticated Portal Pages"),
      makeTable(["Route", "Description"],
        [
          ["/dashboard", "Central hub — overview panels for employee and HR manager roles"],
          ["Employee self-service", "Profile, documents, leave status, and requests"],
          ["HR Manager area", "Team overviews, performance data, job postings, applicant pipelines"],
          ["Manager relationships", "Hierarchical reporting structure"],
        ], [2800, 6560]),
      gap(), pageBreak(),

      // SECTION 4
      h1("4. Environment Configuration & External Services"),
      p("The application requires the following environment variables. Each connects the app to an external service."),
      gap(),
      h2("4.1 Database"),
      makeTable(["Variable", "Value / Example", "Purpose"],
        [
          ["MONGODB_URI", "your_mongodb_uri_here", "Full MongoDB Atlas connection string"],
          ["MONGODB_DB_NAME", "hr", "Name of the database"],
        ], [3000, 2800, 3560]),
      gap(),
      h2("4.2 Authentication (Clerk)"),
      makeTable(["Variable", "Purpose"],
        [
          ["CLERK_SECRET_KEY", "Server-side Clerk API key"],
          ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "Client-side Clerk key"],
          ["CLERK_WEBHOOK_SECRET", "Secret for verifying Clerk webhook payloads"],
          ["NEXT_PUBLIC_CLERK_SIGN_IN_URL", "Set to /auth/sign-in"],
          ["NEXT_PUBLIC_CLERK_SIGN_UP_URL", "Set to /auth/sign-up"],
          ["NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL", "Set to /dashboard"],
          ["NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL", "Set to /dashboard"],
        ], [3500, 5860]),
      gap(),
      h2("4.3 AI, S3, Redis, Email, App URLs"),
      makeTable(["Variable", "Purpose"],
        [
          ["GEMINI_API_KEY", "API key for Gemini model calls"],
          ["AWS_S3_BUCKET_NAME", "S3 bucket for file storage"],
          ["AWS_S3_REGION", "AWS region (us-east-2)"],
          ["AWS_ACCESS_KEY_ID", "AWS IAM access key"],
          ["AWS_SECRET_ACCESS_KEY", "AWS IAM secret key"],
          ["UPSTASH_REDIS_REST_URL", "Upstash Redis endpoint"],
          ["UPSTASH_REDIS_REST_TOKEN", "Upstash Redis auth token"],
          ["SENDGRID_API_KEY", "SendGrid email API key"],
          ["SENDGRID_FROM_EMAIL", "Sender email address"],
          ["NEXT_PUBLIC_APP_URL", "Public base URL"],
          ["NEXT_PUBLIC_VOICE_COMMANDS_ENABLED", "Feature flag for voice interface"],
        ], [3500, 5860]),
      gap(), pageBreak(),

      // SECTION 5
      h1("5. Project File & Folder Structure"),
      p("The repository follows Next.js App Router conventions with clear separation of concerns."),
      gap(),
      makeTable(["Path", "What It Contains"],
        [
          ["src/app/", "All Next.js App Router pages"],
          ["src/app/page.tsx", "Home page component"],
          ["src/app/services/", "Services page route"],
          ["src/app/about/", "About Us page route"],
          ["src/app/portal/admin/", "Admin portal pages (dashboard, users, leaves, attendance, etc.)"],
          ["src/app/portal/dashboard/", "Employee dashboard"],
          ["src/app/portal/auth/", "Clerk authentication pages"],
          ["src/app/layout.tsx", "Root layout"],
          ["src/app/globals.css", "Global CSS styles and design system tokens"],
          ["src/components/", "Reusable React components"],
          ["src/components/admin/", "Admin-specific components (sidebar, header, auth guard)"],
          ["src/components/hr/", "Employee-specific components"],
          ["src/lib/", "Utility functions and shared logic"],
          ["src/models/", "MongoDB Mongoose schemas and models"],
          ["src/data/", "Static data and configurations"],
          ["public/", "Static assets"],
          ["clerk.json", "Clerk subdomain routing configuration"],
          ["vercel.json", "Vercel deployment configuration"],
          ["tailwind.config.ts", "Tailwind CSS configuration"],
          ["tsconfig.json", "TypeScript compiler configuration"],
          ["package.json", "All dependencies and npm scripts"],
        ], [3200, 6160]),
      gap(), pageBreak(),

      // SECTION 6
      h1("6. NPM Scripts"),
      p("The package.json defines npm scripts for operating the system."),
      gap(),
      makeTable(["Script Command", "Runs", "Purpose"],
        [
          ["npm run dev", "next dev", "Starts local dev server with hot reload"],
          ["npm run build", "next build", "Compiles for production"],
          ["npm start", "next start", "Starts production server"],
          ["npm run lint", "next lint", "Runs ESLint"],
        ], [2400, 3200, 3760]),
      gap(), pageBreak(),

      // SECTION 8 - HOW IT WORKS
      h1("7. How It Works — System Data Flows"),
      gap(),
      h2("7.1 Authentication Flow"),
      bullet("User visits /auth/sign-in — Clerk renders its embedded UI"),
      bullet("Clerk handles credential verification (password, OAuth, MFA)"),
      bullet("On success, Clerk issues a session JWT and redirects to /dashboard"),
      bullet("Clerk fires webhook events verified via Svix"),
      bullet("User data is synced to MongoDB via Mongoose"),
      bullet("Subsequent requests pass through Clerk middleware for JWT validation"),
      gap(),
      h2("7.2 AI / LangGraph Agent Flow"),
      bullet("User action triggers an AI agent"),
      bullet("LangGraph agent breaks task into a graph of steps"),
      bullet("Each node calls Gemini models"),
      bullet("State is passed between nodes — LangGraph manages the state machine"),
      bullet("Community integrations query MongoDB vector stores for semantic search"),
      bullet("Final output is returned to UI or stored in MongoDB"),
      gap(), pageBreak(),

      // SECTION 10 - PERFORMANCE & SECURITY
      h1("8. Performance & Security"),
      gap(),
      h2("8.1 Performance"),
      makeTable(["Feature", "Implementation"],
        [
          ["Lighthouse Score 90+", "Built-in Next.js optimizations"],
          ["Image Optimization", "next/image with auto format conversion"],
          ["Code Splitting", "Automatic route-based bundle splitting"],
          ["Critical CSS", "critters inlines above-the-fold CSS"],
          ["Redis Caching", "Upstash Redis for repeated queries"],
          ["SSR / SSG", "Server-side rendering via App Router"],
        ], [2800, 6560]),
      gap(),
      h2("8.2 Security"),
      makeTable(["Measure", "Implementation"],
        [
          ["HTTPS Enforcement", "Vercel enforces HTTPS on all deployments"],
          ["Content Security Policy", "Headers configured via next.config.js"],
          ["Webhook Verification", "Svix verifies Clerk webhooks"],
          ["Presigned S3 URLs", "Time-limited file access"],
          ["Schema Validation", "Zod validates all API inputs"],
          ["Auth Middleware", "Clerk protects all dashboard routes"],
        ], [2800, 6560]),
      gap(), pageBreak(),

      // SECTION 15 - SUMMARY
      h1("9. Complete Technology Summary"),
      p("A single-view reference of every technology in the Smart HR Portal."),
      gap(),
      makeTable(["Category", "Technology", "Role"],
        [
          ["Framework", "Next.js 16", "Full-stack React framework with App Router"],
          ["Language", "TypeScript 5", "Typed JavaScript for entire codebase"],
          ["Styling", "Tailwind CSS 4", "Utility-first CSS for all styling"],
          ["AI — LLM", "Gemini API", "Gemini model calls"],
          ["AI — Agents", "LangGraph", "Stateful multi-step AI workflows"],
          ["Database", "MongoDB + Mongoose", "Primary data store"],
          ["Cache", "Upstash Redis", "Serverless Redis caching"],
          ["Auth", "Clerk", "User authentication and sessions"],
          ["File Storage", "AWS S3", "Document storage with presigned URLs"],
          ["Email", "SendGrid", "Transactional email delivery"],
          ["Deployment", "Vercel", "Cloud edge deployment"],
          ["CI/CD", "GitHub Actions", "Automated pipelines"],
        ], [2000, 2800, 4560]),
      gap(), gap(),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "— End of Document —", size: 20, font: "Arial", color: "9CA3AF", italics: true })] }),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  const outputPath = require('path').join(__dirname, 'Smart_HR_Portal_Material.docx');
  fs.writeFileSync(outputPath, buf);
  console.log("Done! File saved to: " + outputPath);
});
