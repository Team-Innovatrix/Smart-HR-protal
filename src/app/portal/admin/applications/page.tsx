'use client';

import { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useTimezone } from '@/lib/hooks/useTimezone';
import { 
  MagnifyingGlassIcon, 
  EyeIcon, 
  CheckIcon, 
  XMarkIcon, 
  ClockIcon, 
  UserIcon,
  AcademicCapIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface Application {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    department: string;
  };
  firstName: string;
  lastName: string;
  preferredName?: string;
  email: string;
  phone?: string;
  location?: string;
  education: Array<{
    institute: string;
    degree: string;
    startDate: string;
    endDate: string;
  }>;
  experience: Array<{
    company: string;
    startDate: string;
    endDate: string;
    position: string;
    duties: string;
  }>;
  resumeUrl: string;
  status: string;
  appliedDate: string;
  isActive: boolean;
}

export default function AdminApplications() {
  const { formatDateString } = useTimezone();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const safeFormatDate = (dateString: string, format: string) => {
    if (!dateString || dateString === 'Invalid Date') {
      return 'Invalid Date'
    }
    try {
      return formatDateString(dateString, format)
    } catch (error) {
      console.error('Error formatting date:', dateString, error)
      return 'Invalid Date'
    }
  };

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'all' 
        ? '/api/applications' 
        : `/api/applications?status=${statusFilter}`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setApplications(result.data);
      } else {
        setError(result.message || 'Failed to fetch applications');
      }
    } catch {
      setError('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setApplications(applications.map(app => 
          app._id === applicationId ? { ...app, status: newStatus } : app
        ));
        
        if (selectedApplication?._id === applicationId) {
          setSelectedApplication({ ...selectedApplication, status: newStatus });
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewing': return 'bg-blue-100 text-blue-800';
      case 'shortlisted': return 'bg-purple-100 text-purple-800';
      case 'interviewed': return 'bg-indigo-100 text-indigo-800';
      case 'offered': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'reviewing': return <EyeIcon className="h-4 w-4" />;
      case 'shortlisted': return <CheckIcon className="h-4 w-4" />;
      case 'interviewed': return <UserIcon className="h-4 w-4" />;
      case 'offered': return <CheckIcon className="h-4 w-4" />;
      case 'rejected': return <XMarkIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading applications...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Job Applications
            </h1>
            <p className="text-gray-600">
              Manage and review submitted job applications
            </p>
            
            {/* Admin Navigation */}
            <div className="mt-4 flex space-x-4">
              <a
                href="/portal/admin/applications"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Applications
              </a>
              <a
                href="/portal/admin/leads"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Leads
              </a>
            </div>
          </div>

          {/* Status Filter */}
          <div className="mb-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Applications</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interviewed">Interviewed</option>
              <option value="offered">Offered</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-800">{error}</p>
              <button 
                onClick={fetchApplications}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No applications found.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {applications.map((application) => (
                <div key={application._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.firstName} {application.lastName}
                          {application.preferredName && ` (${application.preferredName})`}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)} flex items-center space-x-1`}>
                          {getStatusIcon(application.status)}
                          <span className="capitalize">{application.status}</span>
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-2">
                          <UserIcon className="h-4 w-4" />
                          <span>{application.email}</span>
                        </div>
                        {application.phone && (
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4" />
                            <span>{application.phone}</span>
                          </div>
                        )}
                        {application.location && (
                          <div className="flex items-center space-x-2">
                            <MapPinIcon className="h-4 w-4" />
                            <span>{application.location}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Applied: {safeFormatDate(application.appliedDate, 'MM/dd/yyyy')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <AcademicCapIcon className="h-4 w-4" />
                          <span>Position: {application.jobId.title} - {application.jobId.department}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedApplication(application)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>View</span>
                      </button>
                      
                      <a
                        href={application.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        {/* MagnifyingGlassIcon is not used for resume download, but keeping it for consistency */}
                        <MagnifyingGlassIcon className="h-4 w-4" /> 
                        <span>Resume</span>
                      </a>
                    </div>
                  </div>

                  {/* Status Update Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                    {['pending', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'rejected'].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateApplicationStatus(application._id, status)}
                        disabled={application.status === status}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          application.status === status
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Application Details
                </h2>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-gray-900">{selectedApplication.firstName} {selectedApplication.lastName}</p>
                    </div>
                    {selectedApplication.preferredName && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Preferred Name</label>
                        <p className="text-gray-900">{selectedApplication.preferredName}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{selectedApplication.email}</p>
                    </div>
                    {selectedApplication.phone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <p className="text-gray-900">{selectedApplication.phone}</p>
                      </div>
                    )}
                    {selectedApplication.location && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <p className="text-gray-900">{selectedApplication.location}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Education */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Education</h3>
                  <div className="space-y-4">
                    {selectedApplication.education.map((edu, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Institute</label>
                            <p className="text-gray-900">{edu.institute}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Degree</label>
                            <p className="text-gray-900">{edu.degree}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Start Date</label>
                            <p className="text-gray-900">{edu.startDate}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">End Date</label>
                            <p className="text-gray-900">{edu.endDate || 'Present'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                {selectedApplication.experience.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Experience</h3>
                    <div className="space-y-4">
                      {selectedApplication.experience.map((exp, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="grid md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Company</label>
                              <p className="text-gray-900">{exp.company}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Position</label>
                              <p className="text-gray-900">{exp.position}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Start Date</label>
                              <p className="text-gray-900">{exp.startDate}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">End Date</label>
                              <p className="text-gray-900">{exp.endDate || 'Present'}</p>
                            </div>
                          </div>
                          {exp.duties && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Duties & Responsibilities</label>
                              <p className="text-gray-900">{exp.duties}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resume */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Resume</h3>
                  <a
                    href={selectedApplication.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                  >
                    <MagnifyingGlassIcon className="h-4 w-4" />
                    <span>Download Resume</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
