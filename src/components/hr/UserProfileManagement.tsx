'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  UserIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon, 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  ClockIcon,
  CalendarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { useTimezone } from '../../lib/hooks/useTimezone';
import { AddEducation, AddExperience } from '../global';
import { FormInput } from '../global/FormInput';
import { layoutSpacing } from '@/lib/utils/spacingUtils';
import { iconContextSizes } from '@/lib/utils/iconUtils';

interface UserProfile {
  _id: string
  clerkUserId: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  department: string
  position: string
  joinDate: string
  managerId?: string
  managerName?: string
  organization?: string
  leaveBalance: {
    sick: number
    casual: number
    annual: number
    maternity?: number
    paternity?: number
  }
  contactNumber?: string
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
  }
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  isActive: boolean
}

interface UserProfileManagementProps {
  userId: string
}

const UserProfileManagement = ({ userId }: UserProfileManagementProps) => {
  const { formatDateString, parseDateString } = useTimezone()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false) // legacy (unused for personal subsections)
  const [editingContact, setEditingContact] = useState(false)
  const [editingAddress, setEditingAddress] = useState(false)
  const [editingEmergency, setEditingEmergency] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [saving, setSaving] = useState(false)

  const handleEducationChange = (updatedEducations: any[]) => {
    // This callback can be used if the parent component needs to react to education changes
    console.log('Education records updated:', updatedEducations);
    // No direct update to UserProfile model needed as education is managed separately
  }

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/profile?userId=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setProfile(data.data)
        setEditForm(data.data)
        // If this was a newly created profile, show a success message
        if (data.message && data.message.includes('created')) {
          // You could add a toast notification here if you have one
          console.log('Profile automatically created from Clerk data')
        }
      } else {
        console.error('Failed to fetch profile:', data.message)
        // Don't set profile to null here, let the error handling below show the message
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchUserProfile()
  }, [fetchUserProfile])


  const handleEdit = () => {
    setEditing(true)
    setEditForm(profile)
    setErrors({})
  }

  const savePartial = async (payload: any, onDone: () => void) => {
    try {
      setSaving(true)
      const response = await fetch(`/api/profile?userId=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (response.ok) {
        const updated = await response.json()
        setProfile(updated.data)
        setEditForm(updated.data)
        onDone()
      } else {
        const errorData = await response.json()
        console.error('Failed to update profile:', errorData)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setEditForm(profile)
    setErrors({})
  }

  const handleInputChange = (field: string, value: any) => {
    setEditForm((prev: any) => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev: {[key: string]: string}) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }



  const handleSave = async () => {
    const newErrors: {[key: string]: string} = {}
    
    // Only validate editable fields
    if (editForm.contactNumber && !/^[\+]?[1-9][\d]{0,15}$/.test(editForm.contactNumber.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.contactNumber = 'Please enter a valid phone number'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setSaving(true)
    try {
      const response = await fetch(`/api/profile?userId=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Only send editable fields
          contactNumber: editForm.contactNumber?.trim() || undefined,
          emergencyContact: editForm.emergencyContact || undefined,
          address: editForm.address || undefined,
        }),
      })
      
      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile.data)
        setEditForm(updatedProfile.data)
        setEditing(false)
        setErrors({})
      } else {
        const errorData = await response.json()
        console.error('Failed to update profile:', errorData)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'sick':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'casual':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'annual':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'maternity':
        return 'bg-pink-100 text-pink-800 border-pink-200'
      case 'paternity':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'Invalid Date') {
      return 'Invalid Date'
    }
    try {
      return formatDateString(dateString, 'MMMM d, yyyy')
    } catch (error) {
      console.error('Error formatting date:', dateString, error)
      return 'Invalid Date'
    }
  }

  const safeFormatDate = (dateString: string, format: string) => {
    if (!dateString || dateString === 'Invalid Date' || dateString === 'null' || dateString === 'undefined') {
      return 'Invalid Date'
    }
    
    // Try to parse the date string
    let date: Date
    try {
      if (typeof dateString === 'string') {
        // Handle various date formats
        if (dateString.includes('T')) {
          // ISO string
          date = new Date(dateString)
        } else if (dateString.includes('-')) {
          // Date string (YYYY-MM-DD)
          date = parseDateString(dateString)
        } else {
          // Try parsing as is
          date = new Date(dateString)
        }
      } else {
        date = new Date(dateString)
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString)
        return 'Invalid Date'
      }
      
      // Double-check the ISO string is valid
      const isoString = date.toISOString()
      if (!isoString || isoString === 'Invalid Date') {
        console.error('Invalid ISO string generated:', { dateString, date, isoString })
        return 'Invalid Date'
      }
      
      return formatDateString(isoString, format)
    } catch (error) {
      console.error('Error in safeFormatDate:', { dateString, error })
      return 'Invalid Date'
    }
  }

  if (loading) {
    return (
      <div className="glass-strong p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="glass-strong p-6">
        <div className="text-center py-12">
          <ShieldCheckIcon className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-500">Profile not found</p>
          <p className="text-sm text-gray-400 mb-6">Unable to load user profile. Please contact your administrator.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Profile Header */}
      <div className="glass-strong p-4 sm:p-8 relative overflow-hidden group">
        {/* Background decoration - hidden on mobile */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-5 rounded-full -translate-y-16 translate-x-16 hidden sm:block"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4 sm:gap-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg sm:text-xl font-bold">
                  {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-sm sm:text-lg text-gray-600 mb-1">{profile.position}  {profile.department}</p>
                <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">Employee ID: {profile.employeeId}</p>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-gray-500">
                    <span className="font-medium">Email:</span> {profile.email}
                  </p>
                  {profile.organization && (
                    <p className="text-xs sm:text-sm text-gray-500">
                      <span className="font-medium">Organization:</span> {profile.organization}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
          </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          </div>
        )}
        </div>
      </div>


      {/* Employment Information */}
      <div className="glass-strong p-4 sm:p-8 relative overflow-hidden group">
        {/* Background decoration - hidden on mobile */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-600 opacity-5 rounded-full -translate-y-16 translate-x-16 hidden sm:block"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
              <BuildingOfficeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Employment Information</h3>
              <p className="text-sm sm:text-base text-gray-600">Your work details and position</p>
            </div>
          </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Department</p>
            <p className="text-gray-900 font-medium">{profile.department}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Position</p>
            <p className="text-gray-900 font-medium">{profile.position}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Join Date</p>
            <p className="text-gray-900 font-medium">{formatDate(profile.joinDate)}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Manager</p>
            <p className="text-gray-900 font-medium">{profile.managerName || profile.managerId || 'Not assigned'}</p>
          </div>
        </div>
        </div>
      </div>

      {/* Leave Balance */}
      <div className="glass-strong p-4 sm:p-8 relative overflow-hidden group">
        {/* Background decoration - hidden on mobile */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-600 opacity-5 rounded-full -translate-y-16 translate-x-16 hidden sm:block"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Leave Balance</h3>
              <p className="text-sm sm:text-base text-gray-600">Your available leave days</p>
            </div>
          </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {Object.entries(profile.leaveBalance).map(([type, balance]) => {
            // Skip allotted fields as they will be shown with their corresponding available fields
            if (type.includes('_alloted')) return null;
            
            const allottedType = `${type}_alloted`;
            const allottedBalance = (profile.leaveBalance as any)[allottedType] || 0;
            
            return (
              <div key={type} className="text-center p-3 sm:p-4 glass rounded-lg border border-gray-200/20">
                <div className={`inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${getLeaveTypeColor(type)} mb-1 sm:mb-2`}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  {balance} / {allottedBalance}
                </div>
                <div className="text-xs text-gray-500">available / allotted</div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
          <p>Leave balances are updated automatically when leaves are approved or rejected.</p>
        </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="glass-strong p-4 sm:p-8 relative overflow-hidden group">
        {/* Background decoration - hidden on mobile */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-5 rounded-full -translate-y-16 translate-x-16 hidden sm:block"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
              <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Personal Information</h3>
              <p className="text-sm sm:text-base text-gray-600">Your personal details and contact information</p>
            </div>
          </div>
        
        {/* Contact Number */}
        <div className="mb-4 sm:mb-6 glass p-4 sm:p-6 rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base sm:text-lg font-semibold text-gray-900">Contact Information</h4>
            {!editingContact ? (
              <button
                onClick={() => { setEditingContact(true); setErrors({}) }}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Edit contact information"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button onClick={() => { setEditingContact(false); setEditForm(profile) }} className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50" disabled={saving}>Cancel</button>
                <button onClick={() => savePartial({ contactNumber: editForm.contactNumber?.trim() || undefined }, () => setEditingContact(false))} className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            )}
          </div>
          <div key={editingContact ? 'edit' : 'view'} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Phone Number</p>
              {editingContact ? (
                <FormInput
                  type="tel"
                  value={editForm.contactNumber || ''}
                  onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  error={errors.contactNumber}
                />
              ) : (
                <p className="text-gray-900 font-medium">{profile.contactNumber || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="mb-4 sm:mb-6 glass p-4 sm:p-6 rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base sm:text-lg font-semibold text-gray-900">Address</h4>
            {!editingAddress ? (
              <button
                onClick={() => { setEditingAddress(true) }}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Edit address"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button onClick={() => { setEditingAddress(false); setEditForm(profile) }} className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50" disabled={saving}>Cancel</button>
                <button onClick={() => savePartial({ address: editForm.address || undefined }, () => setEditingAddress(false))} className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            )}
          </div>
          <div key={editingAddress ? 'edit' : 'view'} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Street</p>
              {editingAddress ? (
                <input
                  type="text"
                  value={editForm.address?.street || ''}
                  onChange={(e) => handleInputChange('address', { ...editForm.address, street: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Street address"
                />
              ) : (
                <p className="text-gray-900 font-medium">{profile.address?.street || 'Not provided'}</p>
              )}
            </div>
            
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">City</p>
              {editingAddress ? (
                <input
                  type="text"
                  value={editForm.address?.city || ''}
                  onChange={(e) => handleInputChange('address', { ...editForm.address, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City"
                />
              ) : (
                <p className="text-gray-900 font-medium">{profile.address?.city || 'Not provided'}</p>
              )}
            </div>
            
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">State</p>
              {editingAddress ? (
                <input
                  type="text"
                  value={editForm.address?.state || ''}
                  onChange={(e) => handleInputChange('address', { ...editForm.address, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="State/Province"
                />
              ) : (
                <p className="text-gray-900 font-medium">{profile.address?.state || 'Not provided'}</p>
              )}
            </div>
            
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">ZIP Code</p>
              {editingAddress ? (
                <input
                  type="text"
                  value={editForm.address?.zipCode || ''}
                  onChange={(e) => handleInputChange('address', { ...editForm.address, zipCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ZIP/Postal code"
                />
              ) : (
                <p className="text-gray-900 font-medium">{profile.address?.zipCode || 'Not provided'}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Country</p>
              {editingAddress ? (
                <input
                  type="text"
                  value={editForm.address?.country || ''}
                  onChange={(e) => handleInputChange('address', { ...editForm.address, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Country"
                />
              ) : (
                <p className="text-gray-900 font-medium">{profile.address?.country || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="glass p-4 sm:p-6 rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base sm:text-lg font-semibold text-gray-900">Emergency Contact</h4>
            {!editingEmergency ? (
              <button
                onClick={() => setEditingEmergency(true)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Edit emergency contact"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button onClick={() => { setEditingEmergency(false); setEditForm(profile) }} className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50" disabled={saving}>Cancel</button>
                <button onClick={() => savePartial({ emergencyContact: editForm.emergencyContact || undefined }, () => setEditingEmergency(false))} className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            )}
          </div>
          <div key={editingEmergency ? 'edit' : 'view'} className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Name</p>
              {editingEmergency ? (
                <input
                  type="text"
                  value={editForm.emergencyContact?.name || ''}
                  onChange={(e) => handleInputChange('emergencyContact', { ...editForm.emergencyContact, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Emergency contact name"
                />
              ) : (
                <p className="text-gray-900 font-medium">{profile.emergencyContact?.name || 'Not provided'}</p>
              )}
            </div>
            
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Relationship</p>
              {editingEmergency ? (
                <input
                  type="text"
                  value={editForm.emergencyContact?.relationship || ''}
                  onChange={(e) => handleInputChange('emergencyContact', { ...editForm.emergencyContact, relationship: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Spouse, Parent, Sibling"
                />
              ) : (
                <p className="text-gray-900 font-medium">{profile.emergencyContact?.relationship || 'Not provided'}</p>
              )}
            </div>
            
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Phone</p>
              {editingEmergency ? (
                <input
                  type="tel"
                  value={editForm.emergencyContact?.phone || ''}
                  onChange={(e) => handleInputChange('emergencyContact', { ...editForm.emergencyContact, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              ) : (
                <p className="text-gray-900 font-medium">{profile.emergencyContact?.phone || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Per-card actions now; global footer removed */}
        </div>
      </div>

      {/* Education Section */}
      <div className="glass-strong p-4 sm:p-8 relative overflow-hidden group">
        {/* Background decoration - hidden on mobile */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-5 rounded-full -translate-y-16 translate-x-16 hidden sm:block"></div>
        
        <div className="relative z-10">
          <AddEducation 
            onEducationChange={handleEducationChange}
            showExisting={true}
            maxEducations={10}
          />
        </div>
      </div>

      {/* Work Experience Section */}
      <div className="glass-strong p-4 sm:p-8 relative overflow-hidden group">
        {/* Background decoration - hidden on mobile */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500 to-red-600 opacity-5 rounded-full -translate-y-16 translate-x-16 hidden sm:block"></div>
        
        <div className="relative z-10">
          <AddExperience showExisting={true} />
        </div>
      </div>
    </div>
  )
}

export default UserProfileManagement
