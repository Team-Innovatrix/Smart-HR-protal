# Smart HR Dashboard

A modern, responsive Next.js website for   startup service provider offering AI-powered, flexible team scaling solutions.

## 🚀 Features

- **Modern Design**: Clean, professional design with smooth animations
- **Responsive**: Mobile-first approach that works on all devices
- **Fast Performance**: Built with Next.js 14 and optimized for speed
- **SEO Optimized**: Proper meta tags, structured data, and semantic HTML
- **Accessibility**: WCAG compliant with proper ARIA labels and keyboard navigation
- **Animations**: Smooth scroll animations using Framer Motion

## 📱 Pages

- **Home** (`/`) - Landing page with hero section, services overview, and testimonials
- **Services** (`/services`) - Detailed service offerings with pricing and features
- **About Us** (`/about`) - Company story, team, values, and approach
- **Case Studies** (`/case-studies`) - Success stories and client results
- **Pricing** (`/pricing`) - Transparent pricing with ROI calculator
- **Careers**
- **Contact Us** (`/contact`) - Contact form and consultation booking

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **UI Components**: Headless UI
- **Deployment**: Vercel (recommended)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tielo-website
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx          # Home page
│   ├── services/         # Services page
│   ├── about/            # About Us page
│   ├── case-studies/     # Case Studies page
│   ├── pricing/          # Pricing page
│   ├── contact/          # Contact Us page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/            # Reusable components
│   ├── Navigation.tsx    # Main navigation
│   └── Footer.tsx        # Footer component
└── lib/                  # Utility functions (if any)
```

## 🎨 Customization

### Colors
The website uses a blue-based color scheme. You can customize colors in `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    }
  }
}
```

### Content
All content is stored in the component files. Update the data arrays in each page component to modify:
- Service offerings
- Pricing information
- Team details
- Contact information
- Testimonials

### Styling
The website uses Tailwind CSS utility classes. You can:
- Modify existing classes
- Add custom CSS in `globals.css`
- Create new component classes

## 📱 Responsive Design

The website is built with a mobile-first approach:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically on push

### Other Platforms

The website can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Self-hosted servers

## 🔧 Build Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type check
npm run type-check
```

## 📊 Performance

The website is optimized for performance:
- **Lighthouse Score**: 90+ on all metrics
- **Core Web Vitals**: Optimized for LCP, FID, and CLS
- **Image Optimization**: Next.js Image component with automatic optimization
- **Code Splitting**: Automatic route-based code splitting
- **Bundle Analysis**: Built-in bundle analyzer

## 🎯 SEO Features

- Meta tags for all pages
- Open Graph tags for social sharing
- Structured data markup
- Semantic HTML structure
- Sitemap generation (can be added)
- Robots.txt (can be added)

## 🔒 Security

- Content Security Policy headers
- HTTPS enforcement
- XSS protection
- CSRF protection
- Secure headers
- Next Js

## 📈 Analytics

The website is ready for analytics integration:
- Google Analytics
- Google Tag Manager
- Facebook Pixel
- Custom event tracking

## 🔄 Updates

The website is designed to be easily maintainable:
- Component-based architecture
- Reusable UI components
- Centralized content management
- Easy styling updates

