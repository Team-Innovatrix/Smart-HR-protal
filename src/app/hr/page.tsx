import Link from 'next/link'
import Image from 'next/image'
import { UsersIcon, ClockIcon, ShieldCheckIcon, BoltIcon, ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function HRHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="HR Dashboard" 
                width={48} 
                height={48} 
                className="h-12 w-auto" 
                priority
              />
              <span className="ml-3 text-2xl font-bold text-gray-900">HR Module</span>
            </div>
            <Link 
              href="/portal" 
              className="btn-primary"
            >
              Go to Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            AI-Enabled HR
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              {' '}in Minutes
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your HR operations with intelligent automation. Onboard employees, manage performance, 
            and streamline processes with AI-powered insights and workflows.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/portal" 
              className="btn-primary text-lg py-4 px-8 shadow-lg hover:shadow-xl"
            >
              Get Started Now
            </Link>
            <button className="btn-secondary text-lg py-4 px-8">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need for modern HR
            </h2>
            <p className="text-xl text-gray-600">
              From onboarding to offboarding, we&apos;ve got you covered with intelligent automation
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Onboarding</h3>
              <p className="text-gray-600 mb-4">
                AI-powered workflows that guide new hires through their first days, 
                automatically assigning tasks and tracking progress.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Automated document collection
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Personalized welcome experience
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Progress tracking & reminders
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-6">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Time & Attendance</h3>
              <p className="text-gray-600 mb-4">
                Intelligent time tracking with AI-powered insights into productivity patterns 
                and automated overtime calculations.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Automated time tracking
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Overtime & leave management
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Productivity analytics
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-6">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Compliance & Security</h3>
              <p className="text-gray-600 mb-4">
                Built-in compliance features that automatically adapt to changing regulations 
                and ensure data security.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  GDPR & CCPA compliance
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  SOC 2 Type II certified
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Automated audit trails
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-6">
                <BoltIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Performance Management</h3>
              <p className="text-gray-600 mb-4">
                AI-driven performance insights that help managers make data-driven decisions 
                and support employee growth.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Goal setting & tracking
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  360° feedback system
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  AI-powered insights
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center mb-6">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Employee Self-Service</h3>
              <p className="text-gray-600 mb-4">
                Empower employees with self-service portals for common HR tasks, 
                reducing administrative overhead.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Profile management
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Leave requests
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Document access
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-6">
                <BoltIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Analytics</h3>
              <p className="text-gray-600 mb-4">
                Advanced analytics and AI-powered insights that help you understand 
                workforce trends and optimize HR strategies.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Predictive analytics
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Turnover prediction
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  Custom dashboards
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to transform your HR operations?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of companies using AI-powered HR to streamline their operations 
            and focus on what matters most - their people.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/portal/auth" 
              className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-lg text-indigo-600 bg-white hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Sign Up Now
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              href="/portal" 
              className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-lg text-white border-2 border-white hover:bg-white hover:text-indigo-600 transition-all duration-200"
            >
              Sign In
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Image 
                src="/logo.png" 
                alt="HR Dashboard" 
                width={32} 
                height={32} 
                className="h-8 w-auto mb-4" 
              />
              <p className="text-gray-400">
                AI-powered HR solutions for modern businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 HR Dashboard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
