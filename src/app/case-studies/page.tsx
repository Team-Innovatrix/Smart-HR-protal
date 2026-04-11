import Link from 'next/link'
import { 
  ChartBarIcon, 
  UsersIcon, 
  CheckCircleIcon,
  ArrowRightIcon,
  StarIcon,
  ClockIcon,
  UserIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function CaseStudies() {
  const featuredStudies = [
    {
      company: 'TechFlow',
      industry: 'Supply Chain Automation',
      challenge: 'Needed to launch MVP in 3 weeks to secure funding before runway ran out. Had limited technical team and no time for traditional development cycles.',
      solution: 'Assembled a 4-person development team (2 frontend, 1 backend, 1 DevOps) for a 3-week sprint. Integrated AI-powered inventory optimization algorithms.',
      results: [
        'MVP launched in 21 days (3 weeks ahead of deadline)',
        'Secured $2M in seed funding',
        'Reduced inventory costs by 30% for pilot customers',
        'Built scalable foundation for future development'
      ],
      metrics: {
        timeToMarket: '3 weeks',
        costSavings: '30%',
        fundingSecured: '$2M',
        teamSize: '4 people'
      }
    },
    {
      company: 'GrowthLab',
      industry: 'EdTech Platform',
      challenge: 'Struggling with lead generation and conversion. Marketing team was overwhelmed with manual processes and couldn\'t scale effectively.',
      solution: 'Implemented AI-powered lead generation system, automated email sequences, and created data-driven marketing campaigns. Provided ongoing marketing support.',
      results: [
        '3x increase in qualified leads in 6 months',
        '50% improvement in email conversion rates',
        'Reduced customer acquisition cost by 40%',
        'Scaled marketing operations without hiring'
      ],
      metrics: {
        leadIncrease: '3x',
        conversionImprovement: '50%',
        costReduction: '40%',
        teamEfficiency: '2x'
      }
    },
    {
      company: 'InnovateCorp',
      industry: 'FinTech',
      challenge: 'Hiring process was taking 3+ months, causing missed opportunities and team burnout. HR processes were manual and inefficient.',
      solution: 'Built AI-powered HR platform, automated candidate screening, and optimized onboarding processes. Provided HR operations support.',
      results: [
        'Reduced hiring time from 3 months to 6 weeks',
        'Improved employee retention by 40%',
        'Automated 80% of repetitive HR tasks',
        'Built scalable HR infrastructure'
      ],
      metrics: {
        hiringTime: '50% faster',
        retentionImprovement: '40%',
        automation: '80%',
        processEfficiency: '3x'
      }
    }
  ]

  const overallImpact = [
    { metric: 'Average Time Savings', value: '40%', description: 'across all projects' },
    { metric: 'Client Satisfaction', value: '95%', description: 'would recommend us' },
    { metric: 'Projects Delivered', value: '150+', description: 'on time and budget' },
    { metric: 'Team Members', value: '500+', description: 'in our talent bench' }
  ]

  const comparisonData = [
    {
      aspect: 'Time to Market',
      traditional: '3-6 months',
      //HR Dashboard: '2-4 weeks',
      advantage: '5x faster'
    },
    {
      aspect: 'Cost',
      traditional: '$50K - $200K+',
      HR Dashboard: '$15K - $50K',
      advantage: '60% savings'
    },
    {
      aspect: 'Flexibility',
      traditional: 'Long-term contracts',
      HR Dashboard: 'Month-to-month',
      advantage: 'No commitment'
    },
    {
      aspect: 'Team Scaling',
      traditional: 'Hire and fire cycle',
      HR Dashboard: 'Instant scaling',
      advantage: 'Immediate response'
    },
    {
      aspect: 'AI Integration',
      traditional: 'Manual processes',
      HR Dashboard: 'AI-powered efficiency',
      advantage: 'Better results'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
              Case{' '}
              <span className="text-blue-600">Studies</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto animate-fade-in-delay-1">
              Real results from real startups. See how we&apos;ve helped companies build, grow, and scale efficiently.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Case Studies Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Featured Case Studies
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These success stories demonstrate our approach to solving real startup challenges with AI-powered solutions.
            </p>
          </div>
          
          <div className="space-y-16">
            {featuredStudies.map((study, index) => (
              <div
                key={study.company}
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
                }`}
              >
                <div className={`${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                  <div className="bg-blue-50 p-6 rounded-lg mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {study.company}
                    </h3>
                    <p className="text-blue-600 font-medium">
                      {study.industry}
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <StarIcon className="h-5 w-5 text-red-500 mr-2" />
                        The Challenge
                      </h4>
                      <p className="text-gray-600">{study.challenge}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <Cog6ToothIcon className="h-5 w-5 text-blue-500 mr-2" />
                        Our Solution
                      </h4>
                      <p className="text-gray-600">{study.solution}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <ChartBarIcon className="h-5 w-5 text-green-500 mr-2" />
                        Results
                      </h4>
                      <ul className="space-y-2">
                        {study.results.map((result, resultIndex) => (
                          <li key={resultIndex} className="flex items-start space-x-2">
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600">{result}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className={`${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                  <div className="bg-gray-50 p-8 rounded-xl">
                    <h4 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                      Key Metrics
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      {Object.entries(study.metrics).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className="text-2xl font-bold text-blue-600 mb-2">
                            {value}
                          </div>
                          <div className="text-sm text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Overall Impact Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Overall Impact
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These numbers represent the cumulative impact of our work across all client projects.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {overallImpact.map((item) => (
              <div
                key={item.metric}
                className="text-center"
              >
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {item.value}
                </div>
                <div className="text-gray-900 font-medium mb-1">
                  {item.metric}
                </div>
                <div className="text-gray-600 text-sm">
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              HR Dashboard vs. Traditional Agencies
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how our AI-powered, flexible approach compares to traditional agency models.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Aspect</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Traditional Agencies</th>
                  <th className="text-center py-4 px-6 font-semibold text-blue-600">HR Dashboard</th>
                  <th className="text-center py-4 px-6 font-semibold text-green-600">Advantage</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={row.aspect} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                    <td className="py-4 px-6 font-medium text-gray-900">{row.aspect}</td>
                    <td className="py-4 px-6 text-center text-gray-600">{row.traditional}</td>
                    <td className="py-4 px-6 text-center text-blue-600 font-medium">{row.HR Dashboard}</td>
                    <td className="py-4 px-6 text-center text-green-600 font-semibold">{row.advantage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Why Choose HR Dashboard Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Why Startups Choose HR Dashboard
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our unique approach addresses the specific challenges that early-stage companies face.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ClockIcon,
                title: 'Speed',
                description: 'Launch faster with our rapid development cycles and AI-powered efficiency.'
              },
              {
                icon: UserIcon,
                title: 'Cost-Effective',
                description: 'Pay only for what you need, when you need it. No long-term commitments.'
              },
              {
                icon: UsersIcon,
                title: 'Flexibility',
                description: 'Scale your team up or down instantly based on your current needs.'
              }
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <item.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Write Your Success Story?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Let&apos;s discuss how we can help you achieve similar results for your startup.
          </p>
          <Link
            href="/contact"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            Start Your Project
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
