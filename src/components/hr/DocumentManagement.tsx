'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { formInputs, buttons } from '@/lib/utils';
import { 
  DocumentTextIcon, 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  ClockIcon,
  CalendarIcon,
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'image' | 'spreadsheet' | 'other';
  category: 'contracts' | 'policies' | 'forms' | 'reports' | 'certificates' | 'other';
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
  tags: string[];
  status: 'active' | 'archived' | 'draft';
}

const DocumentManagement: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDocumentDetails, setShowDocumentDetails] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: 'other',
    description: '',
    tags: ''
  });

  // For Day 1, fetch real data. For now, it starts blank!
  useEffect(() => {
    // In the future: api/documents
    setDocuments([]);
  }, []);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <DocumentTextIcon className="w-8 h-8 text-red-600" />;
      case 'doc':
        return <DocumentTextIcon className="w-8 h-8 text-blue-600" />;
      case 'spreadsheet':
        return <ChartBarIcon className="w-8 h-8 text-green-600" />;
      case 'image':
        return <EyeIcon className="w-8 h-8 text-purple-600" />;
      default:
        return <DocumentTextIcon className="w-8 h-8 text-gray-600" />;
    }
  };

  const getFileTypeLabel = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'PDF';
      case 'doc':
        return 'Document';
      case 'spreadsheet':
        return 'Spreadsheet';
      case 'image':
        return 'Image';
      default:
        return 'Other';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'contracts':
        return 'Contracts';
      case 'policies':
        return 'Policies';
      case 'forms':
        return 'Forms';
      case 'reports':
        return 'Reports';
      case 'certificates':
        return 'Certificates';
      default:
        return 'Other';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = () => {
    // Implement file upload functionality
    console.log('Uploading document:', uploadForm);
    setShowUploadModal(false);
    setUploadForm({ name: '', category: 'other', description: '', tags: '' });
  };

  const handleDelete = (documentId: string) => {
    // Implement delete functionality
    setDocuments(docs => docs.filter(doc => doc.id !== documentId));
  };

  // Loading state removed to prevent mobile loading issues
  // if (loading) {
  //   console.log('DocumentManagement: Rendering loading state');
  //   return (
  //     <div className="space-y-4">
  //       <div className="animate-pulse">
  //         <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
  //         <div className="space-y-3">
  //           {[1, 2, 3].map((i) => (
  //             <div key={i} className="h-20 bg-gray-200 rounded"></div>
  //           ))}
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        {/* Modern geometric pattern decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 opacity-5">
          <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg rotate-45"></div>
          <div className="absolute top-8 right-8 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full"></div>
          <div className="absolute top-12 right-12 w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={formInputs.search}
                />
              </div>
            </div>
            
            {/* Filters and Upload Button - Responsive Layout */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={formInputs.select}
              >
                <option value="all">All Categories</option>
                <option value="contracts">Contracts</option>
                <option value="policies">Policies</option>
                <option value="forms">Forms</option>
                <option value="reports">Reports</option>
                <option value="certificates">Certificates</option>
                <option value="other">Other</option>
              </select>
              
              <button
                onClick={() => setShowUploadModal(true)}
                className={buttons.success}
              >
                <span className="hidden min-[480px]:inline">Upload</span>
                <span className="min-[480px]:hidden">Upload</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        {/* Modern diagonal pattern decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 opacity-5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 transform rotate-12 rounded-lg"></div>
          <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 transform -rotate-12 rounded-lg"></div>
          <div className="absolute top-8 right-8 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 transform rotate-45 rounded-lg"></div>
        </div>
        
        <div className="relative z-10">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group hover:bg-white/90"
                onClick={() => {
                  setSelectedDocument(doc);
                  setShowDocumentDetails(true);
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                    {getFileIcon(doc.type)}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Implement download
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Implement edit
                      }}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-3 truncate">{doc.name}</h3>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full font-medium">
                      {getFileTypeLabel(doc.type)}
                    </span>
                    <span className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full font-medium">
                      {getCategoryLabel(doc.category)}
                    </span>
                  </div>
                  <div className="text-gray-500">{formatFileSize(doc.size)}</div>
                  <div className="text-gray-500">Uploaded by {doc.uploadedBy}</div>
                  <div className="text-gray-500">{format(new Date(doc.uploadedAt), 'MMM dd, yyyy')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* No Results */}
      {filteredDocuments.length === 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-12 text-center relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          {/* Modern triangular pattern decoration */}
          <div className="absolute top-0 right-0 w-40 h-40 opacity-5">
            <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-b-[20px] border-b-blue-500"></div>
            <div className="absolute top-4 right-4 w-0 h-0 border-l-[16px] border-l-transparent border-b-[16px] border-b-indigo-500"></div>
            <div className="absolute top-8 right-8 w-0 h-0 border-l-[12px] border-l-transparent border-b-[12px] border-b-purple-500"></div>
          </div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <DocumentTextIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Your Document Vault is Empty</h3>
            <p className="text-gray-600">
              {searchTerm ? 'No documents matched your search.' : "You haven't uploaded any company policies, handbooks, or forms yet. Click 'Upload' to get started."}
            </p>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-md w-full shadow-2xl border border-gray-200/50">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                  <PlusIcon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Upload Document</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document Name</label>
                  <input
                    type="text"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                    className={formInputs.input}
                    placeholder="Enter document name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                    className={formInputs.select}
                  >
                    <option value="contracts">Contracts</option>
                    <option value="policies">Policies</option>
                    <option value="forms">Forms</option>
                    <option value="reports">Reports</option>
                    <option value="certificates">Certificates</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    className={formInputs.textarea}
                    rows={3}
                    placeholder="Enter document description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input
                    type="text"
                    value={uploadForm.tags}
                    onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                    className={formInputs.input}
                    placeholder="Enter tags separated by commas"
                  />
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gradient-to-r from-gray-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <PlusIcon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, DOC, XLS, Images up to 10MB</p>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleUpload}
                  className={`flex-1 ${buttons.primary}`}
                >
                  Upload
                </button>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className={`flex-1 ${buttons.secondary}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Details Modal */}
      {showDocumentDetails && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200/50">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <DocumentTextIcon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedDocument.name}</h2>
                </div>
                <button
                  onClick={() => setShowDocumentDetails(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200/50">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <DocumentTextIcon className="w-3 h-3 text-white" />
                    </div>
                    Document Information
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Type:</span>
                      <span className="text-gray-900 font-semibold">{getFileTypeLabel(selectedDocument.type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Category:</span>
                      <span className="text-gray-900 font-semibold">{getCategoryLabel(selectedDocument.category)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Size:</span>
                      <span className="text-gray-900 font-semibold">{formatFileSize(selectedDocument.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Status:</span>
                      <span className="text-gray-900 font-semibold capitalize">{selectedDocument.status}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200/50">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <ClockIcon className="w-3 h-3 text-white" />
                    </div>
                    Upload Details
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Uploaded By:</span>
                      <span className="text-gray-900 font-semibold">{selectedDocument.uploadedBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Upload Date:</span>
                      <span className="text-gray-900 font-semibold">
                        {format(new Date(selectedDocument.uploadedAt), 'MMMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedDocument.description && (
                  <div className="md:col-span-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200/50">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <InformationCircleIcon className="w-3 h-3 text-white" />
                      </div>
                      Description
                    </h3>
                    <p className="text-gray-700">{selectedDocument.description}</p>
                  </div>
                )}

                {selectedDocument.tags.length > 0 && (
                  <div className="md:col-span-2 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200/50">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-lg flex items-center justify-center">
                        <ChartBarIcon className="w-3 h-3 text-white" />
                      </div>
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedDocument.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm rounded-full font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-8 border-t border-gray-200/50">
                <button className={`flex-1 ${buttons.primary}`}>
                  Download
                </button>
                <button className={`flex-1 ${buttons.secondary}`}>
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManagement;
