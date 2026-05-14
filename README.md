# Smart HR Portal

A modern, high-performance HR Management System built with Next.js, featuring a stunning dark-mode glassmorphism UI, timezone-aware analytics, and a fully isolated secure Admin Portal.

## 🚀 Key Features

### 🌟 Core Speciality: AI-Powered Predictive HR Analytics
What truly sets the Smart HR Portal apart from traditional systems is our integration of advanced predictive modeling:
- **Holiday Prediction**: Intelligent algorithms that forecast peak holiday seasons and auto-suggest optimal team scheduling to prevent productivity dips.
- **Risk Analysis**: Proactive identification of employee flight risks and burnout patterns based on attendance anomalies and leave frequency.
- **Predictive Analysis**: Deep data insights that help HR managers make data-driven decisions regarding resource allocation and team well-being.

### 🎨 Premium Glassmorphism UI
- **Dark Theme by Default**: A carefully crafted dark aesthetic using tailored `ambient-bg` and `mesh-overlay` tokens.
- **Glassmorphic Components**: UI elements use `glass` and `glass-strong` tokens for beautiful transparency and blur effects.
- **Dynamic UX**: Features a responsive hover-to-open sidebar (with pin functionality) to maximize screen real estate, and a custom animated cursor.

### 👥 Employee Portal
- **Dashboard**: Overview of recent activity, upcoming holidays, and quick stats.
- **Attendance Management**: Track check-ins/check-outs, calculate working hours, and view attendance history.
- **Leave Management**: Apply for leaves (sick, casual, annual, maternity, paternity), view leave balances, and track approval status with a visual team calendar.
- **Document Hub**: Securely access and manage HR and company documents.
- **Timezone-Aware**: All dates, times, and calendars are automatically synchronized to the user's local timezone ensuring no cross-border confusion.

### 🛡️ Secure Admin Portal
- **Isolated Authentication**: The Admin Portal uses a completely separate, secure login system bypassing standard employee auth.
- **HR & Team Oversight**: Full control over employee leaves, attendance overrides, and team configurations.
- **Advanced Routing Guards**: Middleware prevents unauthorized employees from accessing admin routes.

## 🛠️ Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **UI & Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom Glassmorphism tokens
- **Authentication**: [Clerk](https://clerk.dev/)
- **Database**: [MongoDB](https://www.mongodb.com/) & Mongoose
- **Date/Time**: `date-fns` and `date-fns-tz` for precise timezone handling
- **Charts**: `recharts` for leave and attendance analytics

## 📦 Getting Started

### Prerequisites
- Node.js (v20 or higher recommended)
- MongoDB URI
- Clerk API Keys

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Team-Innovatrix/Smart-HR-protal.git
   cd HR-main
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Environment Variables:
   Create a `.env.local` file in the root directory and add the following:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   MONGODB_URI=your_mongodb_connection_string
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

- `/src/app` - Next.js App Router pages (Portal, Admin, Auth)
- `/src/components` - Reusable UI components organized by domain (Global, HR, Admin)
- `/src/lib` - Core utilities, hooks (e.g., `useTimezone`), and service connections
- `/src/scripts` - Database seeding and maintenance scripts
- `/public` - Static assets and global CSS

## 📄 License & Legal

**INNOVATRIX PROPRIETARY SOFTWARE LICENSE**

Copyright (c) 2025-2026 **Team Innovatrix**. All Rights Reserved.

This software and all associated source code, documentation, and intellectual property are the exclusive property of Team Innovatrix:
1. **Mohit Mohatkar** — Owner & Developer
2. **Rudra Bambal** — Developer
3. **Vipav Bure** — Developer
4. **Kartikey Kalbande** — Developer

### Key Terms:
- **No Copying or Reproduction**: Unauthorized copying, duplication, or replication is strictly prohibited.
- **No Distribution**: You may not share or publish this software without explicit permission.
- **No Modification**: Creating derivative works or reverse-engineering is not allowed.
- **No Commercial Use**: Cannot be used, sold, or offered as a service without a commercial agreement.

For full terms, conditions, and legal enforcement details, please see the [LICENSE](LICENSE) file in the root directory.
