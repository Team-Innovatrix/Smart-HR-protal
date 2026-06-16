# SmartWorkspace.me

SmartWorkspace.me is a modern Human Resource Management System built with Next.js, MongoDB, and Clerk Authentication. It provides organizations with a centralized platform to manage employees, attendance, leave requests, documents, and team communication efficiently.

🌐 **Live Demo:** https://smartworkspace.me

🔐 **Demo Access**
For access credentials and platform testing, please contact:
**[mohit.mohatkar@smartworkspace.me](mailto:mohit.mohatkar@smartworkspace.me)**

---

## 🚀 Features

### 👥 Employee Management

* Employee dashboard with key updates and insights
* Employee profile management
* Company announcements and holiday updates
* Secure authentication and account management

### 📅 Attendance Management

* Daily check-in and check-out tracking
* Attendance history and reporting
* Working hours calculation
* Attendance correction requests

### 🌴 Leave Management

* Apply for multiple leave types
* Track leave balances and history
* Leave approval and rejection workflow
* Team holiday calendar

### 📄 Document Hub

* Secure access to HR and company documents
* Centralized document storage and organization

### 🎙️ AI Voice Assistant

* Voice-based HR interactions
* Attendance and leave information through voice commands
* Company policy and FAQ assistance
* Multi-turn conversational support

### 💬 Team Communication

* Real-time team messaging
* User profile synchronization
* Internal workplace collaboration

### 🛡️ Admin Portal

* Dedicated administrative dashboard
* Employee management and oversight
* Leave and attendance administration
* Role-based access control and route protection

---

## 🛠️ Technology Stack

| Category                | Technology                |
| ----------------------- | ------------------------- |
| Framework               | Next.js 16 (App Router)   |
| Language                | TypeScript                |
| Database                | MongoDB & Mongoose        |
| Authentication          | Clerk                     |
| AI                      | Google Gemini & LangGraph |
| Real-Time Communication | Stream Chat               |
| Caching                 | Upstash Redis             |
| Storage                 | AWS S3                    |
| Email Services          | SendGrid & Nodemailer     |
| Styling                 | Tailwind CSS v4           |

---

## 📦 Getting Started

### Prerequisites

* Node.js (v20 or later)
* MongoDB Database
* Clerk API Keys

### Installation

Clone the repository:

```bash
git clone https://github.com/Team-Innovatrix/Smart-HR-protal.git
cd HR-main
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
CLERK_SECRET_KEY=your_clerk_secret_key
MONGODB_URI=your_mongodb_connection_string
```

Start the development server:

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 📁 Project Structure

```text
src/
├── app/          # Next.js App Router pages
├── components/   # Reusable UI components
├── lib/          # Utilities, hooks, and integrations
├── scripts/      # Database seeding scripts
└── public/       # Static assets
```

---

## 👨‍💻 Team Members

* **Rudra Bambal** — Developer
* **Mohit Mohatkar** — Developer
* **Vipav Bure** — Developer
* **Kartikey Kalbande** — Developer

---

Built with ❤️ by Team Innovatrix.
