'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { useTimezone } from '@/lib/hooks/useTimezone'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  XMarkIcon, 
  ClockIcon, 
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

interface Lead {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  service: string;
  message: string;
  status: string;
  priority: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminLeads() {
  const { formatDateString } = useTimezone();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leads');
      const result = await response.json();
      
      if (result.success) {
        setLeads(result.data.leads);
      } else {
        setError('Failed to fetch leads');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceLabel = (service: string) => {
    switch (service) {
      case 'product-development': return 'Product Development';
      case 'gtm-growth': return 'Go-to-Market & Growth';
      case 'people-ops': return 'People & Operations';
      case 'custom': return 'Custom Package';
      case 'consultation': return 'Just a Consultation';
      default: return service;
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || lead.status === statusFilter;
    const matchesService = !serviceFilter || lead.service === serviceFilter;
    
    return matchesSearch && matchesStatus && matchesService;
  });

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'Invalid Date') {
      return 'Invalid Date'
    }
    try {
      return formatDateString(dateString, 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', dateString, error)
      return 'Invalid Date'
    }
  };

  // const safeFormatDate = (dateString: string, format: string) => {
  //   if (!dateString || dateString === 'Invalid Date' || dateString === 'null' || dateString === 'undefined') {
  //     return 'Invalid Date'
  //   }
  //   
  //   // Try to parse the date string
  //   let date: Date
  //   try {
  //     if (typeof dateString === 'string') {
  //       // Handle various date formats
  //       if (dateString.includes('T')) {
  //         // ISO string
  //         date = new Date(dateString)
  //       } else if (dateString.includes('-')) {
  //         // Date string (YYYY-MM-DD)
  //         date = parseDateString(dateString)
  //       } else {
  //         // Try parsing as is
  //         date = new Date(dateString)
  //       }
  //     } else {
  //       date = new Date(dateString)
  //     }
  //     
  //     // Check if the date is valid
  //     if (isNaN(date.getTime())) {
  //       console.error('Invalid date string:', dateString)
  //       return 'Invalid Date'
  //     }
  //     
  //     // Double-check the ISO string is valid
  //     const isoString = date.toISOString()
  //     if (!isoString || isoString === 'Invalid Date') {
  //       console.error('Invalid ISO string generated:', { dateString, date, isoString })
  //       return 'Invalid Date'
  //     }
  //     
  //     return formatDateString(isoString, format)
  //   } catch (error) {
  //     console.error('Error in safeFormatDate:', { dateString, error })
  //     return 'Invalid Date'
  //   }
  // };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Lead Management
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              View and manage leads from the contact form and other sources.
            </p>
            
            {/* Admin Navigation */}
            <div className="mt-6 flex justify-center space-x-4">
              <a
                href="/portal/admin/applications"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Applications
              </a>
              <a
                href="/portal/admin/leads"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Leads
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>

            {/* Service Filter */}
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Services</option>
              <option value="product-development">Product Development</option>
              <option value="gtm-growth">Go-to-Market & Growth</option>
              <option value="people-ops">People & Operations</option>
              <option value="custom">Custom Package</option>
              <option value="consultation">Just a Consultation</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={fetchLeads}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Leads Table */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <XMarkIcon className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <FunnelIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No leads found</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lead
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLeads.map((lead) => (
                      <tr key={lead._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {lead.firstName} {lead.lastName}
                              </div>
                              {lead.company && (
                                <div className="text-sm text-gray-500 flex items-center">
                                  <MapPinIcon className="h-3 w-3 mr-1" />
                                  {lead.company}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{lead.email}</div>
                          {lead.phone && (
                            <div className="text-sm text-gray-500 flex items-center">
                              <PhoneIcon className="h-3 w-3 mr-1" />
                              {lead.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getServiceLabel(lead.service)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(lead.priority)}`}>
                            {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {formatDate(lead.createdAt)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            Showing {filteredLeads.length} of {leads.length} leads
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
