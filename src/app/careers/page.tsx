'use client';

import Link from 'next/link'
import { 
  CodeBracketIcon, 
  UsersIcon, 
  ChartBarIcon, 
  MapPinIcon,
  ClockIcon,
  BriefcaseIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  StarIcon,
  HeartIcon,
  BoltIcon
} from '@heroicons/react/24/outline'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import ApplicationForm from '@/components/ApplicationForm'
import { useState, useEffect } from 'react';
// Removed timezone dependency - not needed for public pages

export default function Careers() {
  const [jobs, setJobs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingFor, setApplyingFor] = useState<string | null>(null);

  const safeFormatDate = (dateString: string, format: string) => {
    if (!dateString || dateString === 'Invalid Date') {
      return 'Invalid Date'
    }
    try {
      // Simple date formatting without timezone dependency
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      // Basic formatting for public pages
      if (format === 'MMM d, yyyy') {
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      }
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', dateString, error)
      return 'Invalid Date'
    }
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/jobs');
        const data = await response.json();
        
        if (data.success) {
          setJobs(data.data);
        } else {
          setError(data.message || 'Failed to fetch jobs');
        }
      } catch {
        setError('Failed to fetch jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Helper function to get icon based on department
  const getIconForDepartment = (department: string) => {
    switch (department.toLowerCase()) {
      case 'engineering':
        return CodeBracketIcon;
      case 'product':
        return ChartBarIcon;
      case 'design':
        return UsersIcon;
      case 'marketing':
        return ChartBarIcon;
      default:
        return BriefcaseIcon;
    }
  };

  // Helper function to format experience level
  const formatExperience = (experience: string) => {
    switch (experience) {
      case 'entry':
        return 'Entry Level';
      case 'mid':
        return 'Mid Level';
      case 'senior':
        return 'Senior Level';
      case 'lead':
        return 'Lead Level';
      default:
        return experience;
    }
  };

  // Helper function to format job type
  const formatJobType = (type: string) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const companyValues = [
    {
      icon: HeartIcon,
      title: 'People First',
      description: 'We believe in nurturing talent and providing growth opportunities for everyone on our team.'
    },
    {
      icon: BoltIcon,
      title: 'Innovation Driven',
      description: 'We encourage creative thinking and innovative approaches to solve complex problems.'
    },
    {
      icon: StarIcon,
      title: 'Excellence',
      description: 'We strive for excellence in everything we do, from code quality to client satisfaction.'
    },
    {
      icon: UsersIcon,
      title: 'Collaboration',
      description: 'We believe in the power of teamwork and diverse perspectives to achieve great results.'
    }
  ]

  const perks = [
    'Remote-first work environment',
    'Flexible working hours',
    'Learning and development opportunities',
    'Mentorship from industry experts',
    'Exposure to cutting-edge AI technology',
    'Networking with startup ecosystem',
    'Certificate and recommendation letter',
    'Potential for full-time employment'
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
              Join Our{' '}
              <span className="text-blue-600">Team</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto animate-fade-in-delay-1">
              Build your career with a company that&apos;s revolutionizing how startups grow. Learn from experts, work on real projects, and make a real impact.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-2">
              <Link
                href="#open-positions"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
              >
                View Open Positions
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/contact"
                className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Work With Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Why Work With Us?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We&apos;re building the future of startup services, and we want you to be part of it.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {companyValues.map((value: { title: string; description: string; icon: React.ComponentType<{ className?: string }> }) => (
              <div key={value.title} className="text-center">
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

      {/* Perks Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Perks & Benefits
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We believe in taking care of our team members and providing opportunities for growth.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {perks.map((perk: string, index: number) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircleIcon className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{perk}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section id="open-positions" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Open Positions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Perfect opportunities for final year college students looking to kickstart their careers in the tech industry.
            </p>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading available positions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-800">Error loading jobs: {error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No open positions at the moment. Check back later!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {jobs.map((job: Record<string, unknown>) => {
                const IconComponent = getIconForDepartment(job.department as string);
                return (
                  <div key={job._id as string} className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="p-8">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                        <div className="flex items-start space-x-4 mb-4 lg:mb-0">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <IconComponent className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                              {job.title as string}
                            </h3>
                            <div className="flex flex-wrap gap-3 text-sm">
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                                {job.department as string}
                              </span>
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                                {formatJobType(job.type as string)}
                              </span>
                              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                                {formatExperience(job.experience as string)}
                              </span>
                              {job.salary && typeof job.salary === 'object' && job.salary !== null ? (
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                                  ₹{(job.salary as { min: number; max: number; currency: string }).min.toLocaleString()} - ₹{(job.salary as { min: number; max: number; currency: string }).max.toLocaleString()} {(job.salary as { min: number; max: number; currency: string }).currency}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <MapPinIcon className="h-4 w-4" />
                            <span>{job.location as string}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <ClockIcon className="h-4 w-4" />
                            <span>Posted {safeFormatDate(job.postedDate as string, 'MMM d, yyyy')}</span>
                          </div>

                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-6">
                        {job.description as string}
                      </p>
                      
                      <div className="grid md:grid-cols-3 gap-8 mb-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Responsibilities:</h4>
                          <ul className="space-y-2">
                            {(job.responsibilities as string[]).map((item: string, index: number) => (
                              <li key={index} className="flex items-start space-x-2">
                                <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-600 text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Requirements:</h4>
                          <ul className="space-y-2">
                            {(job.requirements as string[]).map((item: string, index: number) => (
                              <li key={index} className="flex items-start space-x-2">
                                <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-600 text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Benefits:</h4>
                          <ul className="space-y-2">
                            {(job.benefits as string[]).map((item: string, index: number) => (
                              <li key={index} className="flex items-start space-x-2">
                                <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-600 text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-6">
                        {applyingFor === job._id ? (
                          <div className="mt-4">
                            <ApplicationForm 
                              jobTitle={job.title as string} 
                              onClose={() => setApplyingFor(null)} 
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => setApplyingFor(job._id as string)}
                            className="bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors inline-flex items-center"
                          >
                            Apply Now
                            <ArrowRightIcon className="ml-2 h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Application Process Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Application Process
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple and straightforward process to join our team.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: 'Apply',
                description: 'Submit your application with resume and cover letter through our contact form.'
              },
              {
                step: 2,
                title: 'Interview',
                description: 'Short phone/video interview to discuss your background and interests.'
              },
              {
                step: 3,
                title: 'Onboarding',
                description: 'Welcome to the team! We&apos;ll get you set up and ready to contribute.'
              }
            ].map((item: { step: number; title: string; description: string }) => (
              <div key={item.step} className="text-center">
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

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Don&apos;t see the perfect role? Send us your resume and we&apos;ll keep you in mind for future opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
            >
              Apply Now
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="mailto:careers@portal.inovatrix.io"
              className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center"
            >
              Send Resume
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
