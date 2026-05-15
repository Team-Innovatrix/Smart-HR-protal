import Link from 'next/link'
import { 
  UsersIcon, 
  TagIcon, 
  HeartIcon, 
  TrophyIcon, 
  ChartBarIcon, 
  CheckCircleIcon,
  ArrowRightIcon,
  StarIcon,
  GlobeAltIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function About() {
  const values = [
    {
      icon: HeartIcon,
      title: 'Empathy First',
      description: 'We understand the startup journey because we\'ve lived it. Every decision we make starts with understanding your unique challenges.'
    },
    {
      icon: TagIcon,
      title: 'Results-Driven',
      description: 'We don\'t just work hard — we work smart. Every action is measured against its impact on your business goals.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Transparency',
      description: 'No hidden fees, no surprises. We believe in clear communication and honest feedback, even when it\'s hard to hear.'
    },
    {
      icon: UsersIcon,
      title: 'Partnership',
      description: 'We\'re not just a vendor — we\'re your partner in growth. Your success is our success.'
    }
  ]



  const impact = [
    { metric: 'Startups Supported', value: '100+' },
    { metric: 'Jobs Created', value: '500+' },
    { metric: 'Revenue Generated', value: '$50M+' },
    { metric: 'Time Saved', value: '2M+ hours' }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
              About{' '}
              <span className="text-blue-600">HR Dashboard</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto animate-fade-in-delay-1">
              We&apos;re a team of startup veterans who believe that every great company deserves great support.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                HR Dashboard was born from frustration. Our founder, Alex, was running his third startup and kept hitting the same wall: great ideas, limited resources, and the constant struggle to find the right people at the right time.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Traditional agencies were expensive and slow. Freelancers were hit-or-miss. Full-time hires were a huge commitment when you weren&apos;t sure what you&apos;d need next month.
              </p>
              <p className="text-lg text-gray-600">
                So we built HR Dashboard: a flexible, AI-powered team that scales with your needs. No long-term contracts, no overhead, just the right people at the right time.
              </p>
            </div>
            <div className="bg-blue-50 p-8 rounded-2xl">
              <div className="text-center">
                <UsersIcon className="h-24 w-24 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Built by Founders</h3>
                <p className="text-gray-600">For founders who know what it&apos;s like to bootstrap, pivot, and scale.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="text-center">
              <TagIcon className="h-16 w-16 text-blue-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-lg text-gray-600">
                To democratize access to world-class startup services through AI-powered solutions that scale with your business.
              </p>
            </div>
            <div className="text-center">
              <ChartBarIcon className="h-16 w-16 text-blue-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-lg text-gray-600">
                A world where every startup has access to the resources they need to succeed, regardless of their size or funding stage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These principles guide every decision we make and every relationship we build.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div
                key={value.title}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <value.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Our Approach Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Approach
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We believe in a collaborative, transparent approach that puts your success first.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Understand',
                description: 'We start by deeply understanding your business, goals, and challenges.'
              },
              {
                step: '2',
                title: 'Plan',
                description: 'We create a customized plan that aligns with your timeline and budget.'
              },
              {
                step: '3',
                title: 'Execute',
                description: 'We assemble the right team and execute with regular check-ins and updates.'
              }
            ].map((item) => (
              <div
                key={item.step}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {item.step}
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

      {/* Impact Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Impact
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The numbers tell the story of how we&apos;ve helped startups grow and succeed.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {impact.map((item) => (
              <div
                key={item.metric}
                className="text-center"
              >
                <div className="text-4xl font-bold text-blue-600 mb-2">
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

      {/* Quality Commitment Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Quality Commitment
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We&apos;re committed to delivering exceptional results that exceed your expectations.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              'Rigorous vetting of all team members',
              'Regular performance reviews and feedback',
              'Continuous learning and skill development',
              'Quality assurance processes for all deliverables',
              'Client satisfaction surveys and improvement plans',
              'Transparent reporting and communication'
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-start space-x-3"
              >
                <CheckCircleIcon className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Recognition Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Industry Recognition
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our work has been recognized by industry leaders and our clients.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: TrophyIcon,
                title: 'Top 100 AI Companies',
                description: 'Recognized by TechCrunch for our innovative AI-powered approach to startup services.'
              },
              {
                icon: StarIcon,
                title: '5-Star Client Rating',
                description: 'Consistently rated 5 stars by our clients for quality, communication, and results.'
              },
              {
                icon: GlobeAltIcon,
                title: 'Global Impact',
                description: 'Serving startups across 15+ countries with localized expertise and global best practices.'
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
            Ready to Work with Us?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Let&apos;s discuss how our team can help you build, grow, and scale your startup.
          </p>
          <Link
            href="/contact"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            Get in Touch
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
