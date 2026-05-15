import Link from 'next/link'
import Image from 'next/image'
import { EnvelopeIcon, MapPinIcon, LinkIcon } from '@heroicons/react/24/outline'

const Footer = () => {
  const footerSections = [
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Team', href: '/about#team' },
        { name: 'Careers', href: '/careers' },
        { name: 'Press', href: '/press' }
      ]
    },
    {
      title: 'Services',
      links: [
        { name: 'Product Development', href: '/services#product-development' },
        { name: 'Go-to-Market & Growth', href: '/services#gtm-growth' },
        { name: 'People & Operations', href: '/services#people-ops' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { name: 'Blog', href: '/blog' },
        { name: 'Case Studies', href: '/case-studies' },
        { name: 'Webinars', href: '/webinars' },
        { name: 'Startup Guide', href: '/startup-guide' }
      ]
    },
    {
      title: 'Support',
      links: [
        { name: 'Contact Us', href: '/contact' },
        { name: 'Help Center', href: '/help' },
        { name: 'Documentation', href: '/docs' },
        { name: 'Community', href: '/community' }
      ]
    },

  ]

  const socialLinks = [
    { name: 'LinkedIn', href: 'https://www.linkedin.com/company/inovatrix/', icon: LinkIcon }
  ]

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <Image
                src="/logo.png"
                alt="HR Dashboard logo"
                width={316}
                height={295}
                className="h-12 w-auto"
              />
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Rooted support for startup growth. We&apos;re your flexible, AI-powered product and operations partner.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">

              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="h-5 w-5 text-blue-400" />
                <span className="text-gray-300">hello@inovatrix.io</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPinIcon className="h-5 w-5 text-blue-400" />
                <span className="text-gray-300">San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-lg font-semibold text-white mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-blue-400 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2026 HR Dashboard. All rights reserved.
            </div>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-400 transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
