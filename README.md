# Innovatrix Smart HR Portal

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?style=flat&logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8?style=flat&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat&logo=typescript)

A modern, enterprise-grade Next.js application offering AI-powered, flexible team scaling solutions. The Innovatrix Smart HR Portal features a clean, native macOS System UI design, providing an intuitive, seamless experience for both employees and administrators.

## 🚀 Features

- **macOS System UI**: Completely custom, flat UI system built to mimic native Apple software with sleek system fonts, frosted glass elements, and intuitive spacing.
- **Dual Portals**: Dedicated, secure routing for the Employee Dashboard and the Admin Command Centre.
- **Real-Time Attendance**: Live clock-in/out tracking with precise time capture.
- **Leave Management**: Advanced tracking for leave balances, approvals, and history.
- **AI-Powered Analytics**: Predictive ML-powered forecasting for workforce trends and risk intelligence (BETA).
- **Enterprise Security**: Clerk authentication integration with strict role-based access control (RBAC).
- **Responsive**: Mobile-first architecture that seamlessly adapts to any device screen size.
- **Fast Performance**: Built on Next.js 14 App Router, optimized for maximum speed and minimal load times.

## 📱 Core Modules

- **Home** (`/`) - Landing page outlining service offerings, company values, and client case studies.
- **Employee Portal** (`/portal/dashboard`) - Personal dashboard for attendance, leaves, and quick tasks.
- **Admin Command Centre** (`/portal/admin`) - Unified dashboard for managing teams, approving leaves, and viewing enterprise analytics.
- **Authentication** (`/portal/auth`, `/portal/admin/login`) - Secure sign-in mechanisms utilizing Clerk and MongoDB session validation.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Custom macOS Theme)
- **Database**: MongoDB / Mongoose
- **Authentication**: Clerk (Employees) + Custom JWT/Cookies (Admins)
- **Icons**: Heroicons
- **Deployment**: Vercel (Recommended)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB connection string
- Clerk API keys

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Team-Innovatrix/Smart-HR-protal.git
cd Smart-HR-protal
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory and add the necessary environment variables:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
MONGODB_URI=your_mongodb_uri
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```text
src/
├── app/                    # Next.js App Router
│   ├── api/                # API Endpoints (Admin, User, Auth, etc.)
│   ├── portal/             # Application Portals
│   │   ├── admin/          # Admin Dashboard & Command Centre
│   │   ├── auth/           # Clerk Auth Pages
│   │   └── dashboard/      # Employee Dashboard
│   ├── about/              # Main Website Pages
│   ├── services/           # Services Pages
│   ├── globals.css         # Custom macOS Design Tokens & Styles
│   └── layout.tsx          # Root layout
├── components/             # Reusable UI components
│   ├── admin/              # Admin-specific components (Header, Sidebar, Auth)
│   └── hr/                 # Employee-specific components
├── data/                   # Static data and configurations
├── lib/                    # Utility functions & Database Connection setup
├── models/                 # MongoDB Mongoose schemas and models
└── proxy.ts                # Application Middleware & Route Protection
```

## 🔒 Security

- Strict Route Guards (`AdminAuthGuard`)
- Content Security Policy headers
- HTTP-only Secure Cookies for Admin sessions
- Next.js Server Actions & API Route validation

## 🔄 Updates & Maintenance

The Innovatrix HR Portal is designed to be easily maintainable:
- Component-based architecture
- Centralized CSS Variables for theming (`globals.css`)
- Reusable UI components

---

## 👥 Group Members

This project was built by Team Innovatrix:

1. **Mohit Mohatkar**
2. **Rudra Bambal**
3. **Vipav Bure**
4. **Kartikey Kalbande**
