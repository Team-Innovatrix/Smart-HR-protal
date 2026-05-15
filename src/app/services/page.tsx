import Link from 'next/link'
import { 
  CodeBracketIcon, 
  ChartBarIcon, 
  UsersIcon, 
  CpuChipIcon, 
  BoltIcon, 
  CheckCircleIcon,
  ArrowRightIcon,
  StarIcon,
  ClockIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function Services() {
  const coreServices = [
    {
      icon: CodeBracketIcon,
      title: 'Product Development',
      description: 'Full-stack development with AI integration',
      features: [
        'Frontend & backend engineering',
        'AI/ML integration into your apps',
        'Rapid MVP creation & iteration',
        'API development & integration',
        'Database design & optimization',
        'Cloud infrastructure setup'
      ]
    },
    {
      icon: ChartBarIcon,
      title: 'Go-to-Market & Growth',
      description: 'AI-powered customer acquisition',
      features: [
        'Sales pipeline setup & automation',
        'AI-powered lead generation',
        'Marketing strategies that rank & convert',
        'Customer success & retention',
        'Growth hacking & experimentation',
        'Analytics & performance tracking'
      ]
    },
    {
      icon: UsersIcon,
      title: 'People & Operations',
      description: 'AI-enabled HR and process automation',
      features: [
        'AI-enabled HR platforms',
        'Recruiting & onboarding automation',
        'Process automation & optimization',
        'Team scaling & management',
        'Performance tracking & analytics',
        'Compliance & legal support'
      ]
    }
  ]

  const aiApproach = [
    'AI-powered lead generation and qualification',
    'Automated customer support and onboarding',
    'Predictive analytics for growth optimization',
    'Intelligent process automation',
    'AI-driven content creation and optimization',
    'Smart resource allocation and planning'
  ]

  const deliveryModels = [
    {
      icon: BoltIcon,
      title: 'Sprint-based',
      description: '2-4 week focused sprints with clear deliverables',
      bestFor: 'Specific projects with defined scope'
    },
    {
      icon: ClockIcon,
      title: 'Retainer-based',
      description: 'Ongoing support with flexible hours allocation',
      bestFor: 'Continuous development and support needs'
    },
    {
      icon: TagIcon,
      title: 'Project-based',
      description: 'Fixed scope and timeline with milestone payments',
      bestFor: 'Well-defined projects with clear requirements'
    }
  ]

  const techStack = [
    'React, Next.js, Node.js',
    'Python, Django, FastAPI',
    'AI/ML: Gemini, Anthropic, LangChain',
    'Cloud: AWS, GCP, Azure',
    'Databases: PostgreSQL, MongoDB, Redis',
    'DevOps: Docker, Kubernetes, CI/CD'
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
              Our{' '}
              <span className="text-blue-600">Services</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto animate-fade-in-delay-1">
              From product development to customer acquisition, we provide the full spectrum of services your startup needs to grow.
            </p>
          </div>
        </div>
      </section>

      {/* Core Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Core Service Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We cover the three critical areas that determine startup success: building the right product, finding customers, and scaling your team efficiently.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {coreServices.map((service) => (
              <div
                key={service.title}
                className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <service.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {service.description}
                </p>
                <ul className="space-y-3">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-start space-x-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI-Powered Approach Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              AI-Powered Approach
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every service we provide is enhanced with cutting-edge AI technology to deliver better results faster.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiApproach.map((item) => (
                              <div
                  key={item}
                  className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
                >
                <div className="flex items-center space-x-3">
                  <CpuChipIcon className="h-6 w-6 text-blue-600" />
                  <span className="text-gray-700 font-medium">{item}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Delivery Models Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Flexible Delivery Models
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the engagement model that best fits your current needs and budget.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {deliveryModels.map((model) => (
              <div
                key={model.title}
                className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <model.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {model.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {model.description}
                </p>
                <p className="text-sm text-blue-600 font-medium">
                  Best for: {model.bestFor}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Technology Stack
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We use modern, scalable technologies to build robust solutions that grow with your business.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((tech) => (
              <div
                key={tech}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center space-x-3">
                  <StarIcon className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">{tech}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Metrics Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              How We Measure Success
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We track key metrics to ensure our services are delivering real value to your business.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { metric: 'Time to Market', value: '50% faster' },
              { metric: 'Customer Acquisition', value: '3x improvement' },
              { metric: 'Team Efficiency', value: '40% increase' },
              { metric: 'Cost Reduction', value: '30% savings' }
            ].map((item) => (
              <div
                key={item.metric}
                className="text-center"
              >
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {item.value}
                </div>
                <div className="text-gray-700 font-medium">
                  {item.metric}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Scale Your Startup?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Let&apos;s discuss how our services can help you build, grow, and scale efficiently.
          </p>
          <Link
            href="/contact"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            Get Started Today
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
