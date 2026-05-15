'use client'

import Link from 'next/link'
import { useState } from 'react'
import { 
  ClockIcon, 
  CheckCircleIcon,
  ArrowRightIcon,
  StarIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function Contact() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const consultationDetails = [
    '30-minute free consultation',
    'No commitment required',
    'Custom proposal within 24 hours',
    'Expert team assessment',
    'Tailored solution design'
  ]

  const serviceContacts = [
    {
      service: 'Product Development',
      contact: 'dev@portal.inovatrix.io',
      responseTime: 'Within 2 hours'
    },
    {
      service: 'Go-to-Market & Growth',
      contact: 'gtm@portal.inovatrix.io',
      responseTime: 'Within 4 hours'
    },
    {
      service: 'People & Operations',
      contact: 'hr@portal.inovatrix.io',
      responseTime: 'Within 6 hours'
    }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitMessage('');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus('success');
        setSubmitMessage(result.message);
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          service: '',
          message: ''
        });
      } else {
        setSubmitStatus('error');
        setSubmitMessage(result.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setSubmitStatus('error');
      setSubmitMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      question: 'How quickly can you start working on our project?',
      answer: 'We can typically assemble a team and begin work within 48 hours of project approval. For urgent projects, we can start even sooner.'
    },
    {
      question: 'What if we\'re not satisfied with the work?',
      answer: 'We offer a 100% satisfaction guarantee. If you\'re not happy with our work, we\'ll fix it at no additional cost or provide a full refund.'
    },
    {
      question: 'Can we scale our team up or down as needed?',
      answer: 'Absolutely! That\'s one of our core benefits. You can scale your team up or down monthly, or even weekly for urgent needs.'
    },
    {
      question: 'Do you work with international clients?',
      answer: 'Yes! We work with startups globally and have experience with different time zones, cultures, and business practices.'
    },
    {
      question: 'What makes HR Dashboard different from traditional agencies?',
      answer: 'We combine AI-powered efficiency with flexible team scaling, no long-term contracts, and startup-focused expertise. We\'re built for speed and flexibility.'
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
              Get in{' '}
              <span className="text-blue-600">Touch</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto animate-fade-in-delay-1">
              Ready to start building your startup&apos;s foundation? Let&apos;s discuss how we can help you grow.
            </p>
          </div>
        </div>
      </section>



      {/* Book Consultation Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Book Your Free Consultation
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                The best way to get started is with a free 30-minute consultation. We&apos;ll discuss your needs, answer your questions, and create a custom proposal.
              </p>
              
              <div className="space-y-4 mb-8">
                {consultationDetails.map((detail) => (
                  <div key={detail} className="flex items-center space-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">{detail}</span>
                  </div>
                ))}
              </div>
              
              <Link
                href="#contact-form"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                Schedule Consultation
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  What to Expect
                </h3>
                <div className="space-y-4 text-left">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-semibold">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Discovery Call</h4>
                      <p className="text-gray-600 text-sm">30-minute discussion about your needs and goals</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-semibold">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Custom Proposal</h4>
                      <p className="text-gray-600 text-sm">Detailed proposal delivered within 24 hours</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-semibold">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Project Kickoff</h4>
                      <p className="text-gray-600 text-sm">Team assembled and work begins within 48 hours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact-form" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Send Us a Message
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Fill out the form below and we&apos;ll get back to you within 4 hours.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="bg-gray-50 p-8 rounded-xl">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
                Service Interest *
              </label>
              <select
                id="service"
                name="service"
                value={formData.service}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a service</option>
                <option value="product-development">Product Development</option>
                <option value="gtm-growth">Go-to-Market & Growth</option>
                <option value="people-ops">People & Operations</option>
                <option value="custom">Custom Package</option>
                <option value="consultation">Just a Consultation</option>
              </select>
            </div>
            
            <div className="mb-6">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Tell us about your project *
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleInputChange}
                required
                placeholder="Describe your needs, timeline, and any specific requirements..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              ></textarea>
            </div>
            
            {/* Status Messages */}
            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <p className="text-green-700">{submitMessage}</p>
                </div>
              </div>
            )}
            
            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <div className="h-5 w-5 bg-red-500 rounded-full mr-2 flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <p className="text-red-700">{submitMessage}</p>
                </div>
              </div>
            )}
            
            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Service-Specific Contacts Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Service-Specific Contacts
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              For specific service inquiries, contact our specialized teams directly.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {serviceContacts.map((service) => (
              <div
                key={service.service}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {service.service}
                </h3>
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {service.contact}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4" />
                  <span>{service.responseTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Response Times & SLAs Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Response Commitments
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We believe in transparent communication and quick responses to keep your projects moving forward.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { time: '2 minutes', service: 'Live Chat' },
              { time: '4 hours', service: 'Email' },
              { time: 'Immediate', service: 'Phone' },
              { time: '24 hours', service: 'Custom Proposals' }
            ].map((item) => (
              <div
                key={item.service}
                className="text-center"
              >
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {item.time}
                </div>
                <div className="text-gray-700 font-medium">
                  {item.service}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Quick answers to common questions about working with HR Dashboard.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {faqs.map((faq) => (
                              <div
                  key={faq.question}
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Social Media Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Connect With Us
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Follow us on social media for updates, insights, and startup tips.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { platform: 'LinkedIn', handle: '@HR Dashboard', description: 'Professional updates and insights' },
              { platform: 'Twitter', handle: '@HR Dashboard', description: 'Real-time news and tips' },
              { platform: 'Instagram', handle: '@HR Dashboard', description: 'Behind-the-scenes and culture' },
              { platform: 'YouTube', handle: 'HR Dashboard', description: 'Educational content and webinars' }
            ].map((social) => (
              <div
                key={social.platform}
                className="bg-white p-6 rounded-xl text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <StarIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {social.platform}
                </h3>
                <div className="text-blue-600 font-medium mb-2">
                  {social.handle}
                </div>
                <p className="text-gray-600 text-sm">
                  {social.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>



      <Footer />
    </div>
  )
}
