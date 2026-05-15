'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { 
  PlusIcon, 
  TrashIcon, 
  ArrowUpTrayIcon, 
  DocumentTextIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  UserIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface Education {
  id: string;
  institute: string;
  degree: string;
  startDate: string;
  endDate: string;
}

interface Experience {
  id: string;
  company: string;
  startDate: string;
  endDate: string;
  position: string;
  duties: string;
}

interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  description: string;
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  salary?: { min: number; max: number; currency: string };
  tags?: string[];
  company: string;
  postedDate?: string;
  deadline?: string;
}

export default function JobApplication() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError, setJobError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    preferredName: '',
    email: '',
    phone: '',
    location: '',
    resume: null as File | null,
  });

  const [educations, setEducations] = useState<Education[]>([
    { id: '1', institute: '', degree: '', startDate: '', endDate: '' }
  ]);

  const [experiences, setExperiences] = useState<Experience[]>([
    { id: '1', company: '', startDate: '', endDate: '', position: '', duties: '' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [submittedApplication, setSubmittedApplication] = useState<Record<string, unknown> | null>(null);

  // Fetch job details on mount
  useEffect(() => {
    const fetchJob = async () => {
      try {
        setJobLoading(true);
        setJobError(null);
        const response = await fetch(`/api/jobs/${jobId}`);
        const result = await response.json();

        if (result.success) {
          setJob(result.data);
        } else {
          setJobError(result.message || 'Failed to load job details');
        }
      } catch (error) {
        console.error('Error fetching job:', error);
        setJobError('Failed to load job details. Please try again.');
      } finally {
        setJobLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return '';
    }
  };

  // Date format validation function
  const validateDateFormat = (dateString: string): boolean => {
    const dateRegex = /^(0[1-9]|1[0-2])\/\d{4}$/;
    return dateRegex.test(dateString);
  };

  // Validate all education dates
  const validateEducationDates = (): boolean => {
    for (const edu of educations) {
      if (!validateDateFormat(edu.startDate)) {
        alert(`Please enter a valid start date in MM/YYYY format for ${edu.institute}`);
        return false;
      }
      if (edu.endDate && !validateDateFormat(edu.endDate)) {
        alert(`Please enter a valid end date in MM/YYYY format for ${edu.institute}`);
        return false;
      }
    }
    return true;
  };

  // Validate all experience dates
  const validateExperienceDates = (): boolean => {
    for (const exp of experiences) {
      if (exp.startDate && !validateDateFormat(exp.startDate)) {
        alert(`Please enter a valid start date in MM/YYYY format for ${exp.company || 'experience entry'}`);
        return false;
      }
      if (exp.endDate && !validateDateFormat(exp.endDate)) {
        alert(`Please enter a valid end date in MM/YYYY format for ${exp.company || 'experience entry'}`);
        return false;
      }
    }
    return true;
  };

  const addEducation = () => {
    const newId = Date.now().toString();
    setEducations([...educations, { id: newId, institute: '', degree: '', startDate: '', endDate: '' }]);
  };

  const removeEducation = (id: string) => {
    if (educations.length > 1) {
      setEducations(educations.filter(edu => edu.id !== id));
    }
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setEducations(educations.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ));
  };

  const addExperience = () => {
    const newId = Date.now().toString();
    setExperiences([...experiences, { id: newId, company: '', startDate: '', endDate: '', position: '', duties: '' }]);
  };

  const removeExperience = (id: string) => {
    if (experiences.length > 1) {
      setExperiences(experiences.filter(exp => exp.id !== id));
    }
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setExperiences(experiences.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert('File size must be less than 5MB. Please choose a smaller file.');
        e.target.value = '';
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF, DOC, or DOCX file.');
        e.target.value = '';
        return;
      }

      setFormData({ ...formData, resume: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address.');
      return;
    }

    // Validate education dates
    if (!validateEducationDates()) {
      return;
    }

    // Validate experience dates
    if (!validateExperienceDates()) {
      return;
    }

    // Validate resume
    if (!formData.resume) {
      alert('Please upload your resume.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('jobId', jobId);
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      if (formData.preferredName) {
        formDataToSend.append('preferredName', formData.preferredName);
      }
      formDataToSend.append('email', formData.email);
      if (formData.phone) {
        formDataToSend.append('phone', formData.phone);
      }
      if (formData.location) {
        formDataToSend.append('location', formData.location);
      }
      formDataToSend.append('education', JSON.stringify(educations));
      formDataToSend.append('experience', JSON.stringify(experiences));
      
      if (formData.resume) {
        formDataToSend.append('resume', formData.resume);
      }

      // Submit application
      const response = await fetch('/api/applications', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (result.success) {
        setSubmittedApplication(result.data);
        setShowThankYou(true);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error submitting application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Loading State */}
          {jobLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading job details...</p>
            </div>
          )}

          {/* Error State */}
          {jobError && !jobLoading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-red-900 mb-2">Error Loading Job</h2>
              <p className="text-red-700 mb-4">{jobError}</p>
              <Link
                href="/portal/jobs"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Back to Jobs
              </Link>
            </div>
          )}

          {/* Job Details Header */}
          {job && !jobLoading && (
            <div className="mb-8 bg-white rounded-xl shadow-lg p-8 border border-gray-200">
              <div className="mb-4">
                <Link
                  href="/portal/jobs"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-flex items-center"
                >
                  ← Back to Jobs
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{job.title}</h1>
              
              <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <BriefcaseIcon className="h-5 w-5 text-gray-400" />
                  <span className="font-medium">{job.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <span className="capitalize">{job.type.replace('-', ' ')}</span>
                </div>
                <span className="capitalize">{job.experience} level</span>
              </div>

              {job.salary && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="text-sm text-gray-600 mb-1">Salary Range</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {job.salary.currency} {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}
                  </div>
                </div>
              )}

              {job.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Job Description</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                </div>
              )}

              {job.requirements && job.requirements.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Requirements</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {job.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {job.tags && job.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-block text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {job.deadline && (
                <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600">
                  <span className="font-medium">Application Deadline:</span> {formatDate(job.deadline)}
                </div>
              )}
            </div>
          )}

          {/* Application Form */}
          {job && !jobLoading && (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Application Form
                </h2>
                <p className="text-lg text-gray-600">
                  Complete the form below to apply for this position
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                  <UserIcon className="h-6 w-6 mr-3 text-blue-600" />
                  Personal Information
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your first name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="preferredName" className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Name
                  </label>
                  <input
                    type="text"
                    id="preferredName"
                    value={formData.preferredName}
                    onChange={(e) => setFormData({ ...formData, preferredName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your preferred name (optional)"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email address"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your city, state, or country"
                  />
                </div>
              </div>

              {/* Education Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                    <AcademicCapIcon className="h-6 w-6 mr-3 text-blue-600" />
                    Education
                  </h2>
                  <button
                    type="button"
                    onClick={addEducation}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Education
                  </button>
                </div>

                {educations.map((education, index) => (
                  <div key={education.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Education #{index + 1}</h3>
                      {educations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEducation(education.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Institute *
                        </label>
                        <input
                          type="text"
                          required
                          value={education.institute}
                          onChange={(e) => updateEducation(education.id, 'institute', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter institute name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Degree *
                        </label>
                        <input
                          type="text"
                          required
                          value={education.degree}
                          onChange={(e) => updateEducation(education.id, 'degree', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter degree name"
                        />
                      </div>
                      
                                               <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">
                             Start Date (MM/YYYY) *
                           </label>
                           <input
                             type="text"
                             required
                             value={education.startDate}
                             onChange={(e) => updateEducation(education.id, 'startDate', e.target.value)}
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                             placeholder="e.g., 09/2020"
                           />
                         </div>
                         
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">
                             End Date (MM/YYYY)
                           </label>
                           <input
                             type="text"
                             value={education.endDate}
                             onChange={(e) => updateEducation(education.id, 'endDate', e.target.value)}
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                             placeholder="e.g., 05/2024 or Present"
                           />
                         </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Experience Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                    <BriefcaseIcon className="h-6 w-6 mr-3 text-blue-600" />
                    Work Experience
                  </h2>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Experience
                  </button>
                </div>

                {experiences.map((experience, index) => (
                  <div key={experience.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Experience #{index + 1}</h3>
                      {experiences.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExperience(experience.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company
                        </label>
                        <input
                          type="text"
                          value={experience.company}
                          onChange={(e) => updateExperience(experience.id, 'company', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter company name (optional)"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Position
                        </label>
                        <input
                          type="text"
                          value={experience.position}
                          onChange={(e) => updateExperience(experience.id, 'position', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter job title (optional)"
                        />
                      </div>
                      
                                             <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           Start Date (MM/YYYY)
                         </label>
                         <input
                           type="text"
                           value={experience.startDate}
                           onChange={(e) => updateExperience(experience.id, 'startDate', e.target.value)}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="e.g., 06/2022 (optional)"
                         />
                       </div>
                       
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           End Date (MM/YYYY)
                         </label>
                         <input
                           type="text"
                           value={experience.endDate}
                           onChange={(e) => updateExperience(experience.id, 'endDate', e.target.value)}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="e.g., 12/2023 or Present"
                         />
                       </div>
                    </div>
                    
                                         <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         Duties & Responsibilities
                       </label>
                       <textarea
                         value={experience.duties}
                         onChange={(e) => updateExperience(experience.id, 'duties', e.target.value)}
                         rows={4}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                         placeholder="Describe your key responsibilities and achievements in this role (optional)"
                       />
                     </div>
                  </div>
                ))}
              </div>

              {/* Resume Upload */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                  <DocumentTextIcon className="h-6 w-6 mr-3 text-blue-600" />
                  Resume Upload
                </h2>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="resume"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="resume" className="cursor-pointer">
                    <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <div className="text-lg font-medium text-gray-900 mb-2">
                      {formData.resume ? formData.resume.name : 'Click to upload your resume'}
                    </div>
                    <p className="text-gray-600 mb-4">
                      PDF, DOC, or DOCX files accepted (Max 5MB)
                    </p>
                    {formData.resume && (
                      <div className="flex items-center justify-center space-x-2 text-green-600">
                        <DocumentTextIcon className="h-5 w-5" />
                        <span>{formData.resume.name}</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-4 px-8 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-5 w-5 mr-3" />
                      Submit Application
                    </>
                  )}
                </button>
              </div>
                </form>
              </div>
            </>
          )}

          {/* Thank You Message */}
          {showThankYou && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-2xl w-full p-8 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircleIcon className="h-12 w-12 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Thank You!
                  </h2>
                  <p className="text-xl text-gray-600 mb-6">
                    Your application has been submitted successfully.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-600 mb-2">Application ID:</p>
                    <p className="font-mono text-lg font-semibold text-gray-900">
                      {submittedApplication?.applicationId as string || 'N/A'}
                    </p>
                  </div>
                  <p className="text-gray-600 mb-8">
                    We&apos;ve received your application and will review it carefully. 
                    You&apos;ll hear from us soon regarding next steps.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push('/portal/jobs')}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Back to Jobs
                  </button>
                  <button
                    onClick={() => {
                      setShowThankYou(false);
                      setSubmittedApplication(null);
                      // Reset form
                      setFormData({
                        firstName: '',
                        lastName: '',
                        preferredName: '',
                        email: '',
                        phone: '',
                        location: '',
                        resume: null,
                      });
                      setEducations([{ id: '1', institute: '', degree: '', startDate: '', endDate: '' }]);
                      setExperiences([{ id: '1', company: '', startDate: '', endDate: '', position: '', duties: '' }]);
                    }}
                    className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Submit Another Application
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
