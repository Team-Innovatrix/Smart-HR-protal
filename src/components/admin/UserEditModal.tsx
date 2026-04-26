'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, UserIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, CalendarIcon, BuildingOfficeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import TimezoneSelector from '../global/TimezoneSelector';
import ManagerSearchComponent from './ManagerSearchComponent';
import { useTimezone } from '@/lib/hooks/useTimezone';

interface User {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  joinDate: string;
  managerId?: string;
  organization?: string;
  timezone: string;
  workLocation?: string;
  contactNumber?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  leaveBalance: {
    sick: number;
    casual: number;
    annual: number;
    maternity: number;
    paternity: number;
  };
  isActive: boolean;
  isHRManager?: boolean;
  permissions?: string[];
  roleId?: string;
}

interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  employeeCount: number;
}

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onUserUpdated: () => void;
}

export default function UserEditModal({ isOpen, onClose, userId, onUserUpdated }: UserEditModalProps) {
  const { timezone, getTodayDateString } = useTimezone();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle focus management when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Return focus to document when modal closes
      document.body.focus();
    }
  }, [isOpen]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [managerName, setManagerName] = useState<string>('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // Timezone selector will fetch timezones from API

  // Dynamic departments and positions from grouped positions data
  const [departments, setDepartments] = useState<string[]>([]);
  const [departmentPositions, setDepartmentPositions] = useState<Record<string, Record<string, string[]>>>({});
  const [filteredPositions, setFilteredPositions] = useState<string[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUser();
      fetchRoles();
      fetchDepartmentsAndPositions();
    }
  }, [isOpen, userId]);


  // Set default role to Employee if no role is assigned
  useEffect(() => {
    if (user && roles.length > 0 && !user.roleId) {
      const employeeRole = roles.find(r => r.name === 'Employee');
      if (employeeRole) {
        setFormData(prev => ({
          ...prev,
          roleId: employeeRole._id
        }));
      }
    }
  }, [user, roles]);

  const fetchUser = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setUser(data.data);
        setFormData(data.data);
        // Set manager name if managerId exists
        if (data.data.managerId) {
          setManagerName(data.data.managerName || '');
        }
      } else {
        setError(data.error || 'Failed to fetch user');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Failed to fetch user details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      setRolesLoading(true);
      const response = await fetch('/api/admin/roles');
      const data = await response.json();
      
      if (data.success) {
        setRoles(data.data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setRolesLoading(false);
    }
  };

  const fetchDepartmentsAndPositions = async () => {
    try {
      setDepartmentsLoading(true);
      const response = await fetch('/api/admin/orgstructure');
      const data = await response.json();
      
      if (data.success) {
        // Convert org structure to the expected format
        const departmentNames = data.data.departments.map((dept: any) => dept.name);
        const departmentPositions: Record<string, Record<string, string[]>> = {};
        
        data.data.departments.forEach((dept: any) => {
          departmentPositions[dept.name] = {};
          // Group positions by their actual seniority level
          dept.positions.forEach((pos: any) => {
            const seniorityLevel = pos.seniorityLevel || 'Mid';
            if (!departmentPositions[dept.name][seniorityLevel]) {
              departmentPositions[dept.name][seniorityLevel] = [];
            }
            departmentPositions[dept.name][seniorityLevel].push(pos.name);
          });
        });
        
        setDepartments(departmentNames);
        setDepartmentPositions(departmentPositions);
      } else {
        console.error('Departments and positions fetch failed:', data.error);
        // No fallback data - rely on MongoDB
        setDepartments([]);
        setDepartmentPositions({});
      }
    } catch (error) {
      console.error('Departments and positions fetch error:', error);
      // No fallback data - rely on MongoDB
      setDepartments([]);
      setDepartmentPositions({});
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName?.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName?.trim()) errors.lastName = 'Last name is required';

    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.employeeId?.trim()) errors.employeeId = 'Employee ID is required';
    if (!formData.department?.trim()) errors.department = 'Department is required';
    if (!formData.position?.trim()) errors.position = 'Position is required';
    if (!formData.joinDate) errors.joinDate = 'Join date is required';

    if (formData.contactNumber && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.contactNumber.replace(/[\s\-\(\)]/g, ''))) {
      errors.contactNumber = 'Please enter a valid phone number';
    }
    if (formData.emergencyContact?.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.emergencyContact.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.emergencyContact = 'Please enter a valid emergency contact phone number';
    }

    // Only require roleId if roles have loaded — if they haven't, skip this check
    if (roles.length > 0 && !formData.roleId?.trim()) {
      errors.roleId = 'User role is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    if (!userId) return;

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        onUserUpdated();
        onClose();
      } else {
        setError(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Build datalist suggestions when department changes
  useEffect(() => {
    if (formData.department && departmentPositions[formData.department]) {
      const allPositions: string[] = [];
      Object.values(departmentPositions[formData.department]).forEach(positions => {
        allPositions.push(...positions);
      });
      setFilteredPositions(allPositions);
    } else {
      setFilteredPositions([]);
    }
    // NOTE: intentionally NOT resetting position here — position is a free-text field
    // NOTE: do NOT add formData.position to deps — it would clear the field every keystroke
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.department, departmentPositions]);

  const handleNestedInputChange = (parentField: string, childField: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField as keyof User] as Record<string, any> || {}),
        [childField]: value
      }
    }));
  };

  const handleManagerSelect = (managerId: string, managerName: string) => {
    setFormData(prev => ({
      ...prev,
      managerId: managerId
    }));
    setManagerName(managerName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-xl bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <UserIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">
              {isLoading ? 'Loading...' : `Edit User: ${user?.firstName} ${user?.lastName}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId || ''}
                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.employeeId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.employeeId && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.employeeId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <input
                    type="text"
                    list="department-suggestions"
                    value={formData.department || ''}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="e.g. Engineering, Marketing, Sales…"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.department ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <datalist id="department-suggestions">
                    {departments.map(dept => (
                      <option key={dept} value={dept} />
                    ))}
                  </datalist>
                  {validationErrors.department && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.department}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position *
                  </label>
                  <input
                    type="text"
                    list="position-suggestions"
                    value={formData.position || ''}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    placeholder="e.g. Software Engineer, Product Manager…"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.position ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <datalist id="position-suggestions">
                    {filteredPositions.map(pos => (
                      <option key={pos} value={pos} />
                    ))}
                  </datalist>
                  {validationErrors.position && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.position}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Join Date *
                  </label>
                  <input
                    type="date"
                    value={formData.joinDate
                      ? (formData.joinDate.includes('T')
                          ? formData.joinDate.split('T')[0]
                          : formData.joinDate)
                      : ''}
                    onChange={(e) => handleInputChange('joinDate', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.joinDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.joinDate && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.joinDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manager
                  </label>
                  <ManagerSearchComponent
                    value={formData.managerId || ''}
                    onChange={handleManagerSelect}
                    placeholder="Search for a manager..."
                    excludeId={userId || undefined}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={formData.organization || ''}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <TimezoneSelector
                    value={formData.timezone || 'UTC'}
                    onChange={(timezone) => handleInputChange('timezone', timezone)}
                    placeholder="Select user timezone"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Location
                  </label>
                  <input
                    type="text"
                    value={formData.workLocation || ''}
                    onChange={(e) => handleInputChange('workLocation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., New York Office, Remote"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <PhoneIcon className="h-5 w-5 mr-2" />
                Contact Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contactNumber || ''}
                    onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.contactNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+1 (555) 123-4567"
                  />
                  {validationErrors.contactNumber && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.contactNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact?.name || ''}
                    onChange={(e) => handleNestedInputChange('emergencyContact', 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Relationship
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact?.relationship || ''}
                    onChange={(e) => handleNestedInputChange('emergencyContact', 'relationship', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Spouse, Parent, Sibling"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContact?.phone || ''}
                    onChange={(e) => handleNestedInputChange('emergencyContact', 'phone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.emergencyContact ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+1 (555) 123-4567"
                  />
                  {validationErrors.emergencyContact && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.emergencyContact}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2" />
                Address
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.address?.street || ''}
                    onChange={(e) => handleNestedInputChange('address', 'street', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.address?.city || ''}
                    onChange={(e) => handleNestedInputChange('address', 'city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province
                  </label>
                  <input
                    type="text"
                    value={formData.address?.state || ''}
                    onChange={(e) => handleNestedInputChange('address', 'state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP/Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.address?.zipCode || ''}
                    onChange={(e) => handleNestedInputChange('address', 'zipCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.address?.country || ''}
                    onChange={(e) => handleNestedInputChange('address', 'country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Leave Balance */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Leave Balance
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sick Leave
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.leaveBalance?.sick || 0}
                    onChange={(e) => handleNestedInputChange('leaveBalance', 'sick', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Casual Leave
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.leaveBalance?.casual || 0}
                    onChange={(e) => handleNestedInputChange('leaveBalance', 'casual', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Leave
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.leaveBalance?.annual || 0}
                    onChange={(e) => handleNestedInputChange('leaveBalance', 'annual', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maternity Leave
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.leaveBalance?.maternity || 0}
                    onChange={(e) => handleNestedInputChange('leaveBalance', 'maternity', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paternity Leave
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.leaveBalance?.paternity || 0}
                    onChange={(e) => handleNestedInputChange('leaveBalance', 'paternity', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Role Assignment */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2" />
                Role Assignment
              </h4>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.roleId || ''}
                    onChange={(e) => handleInputChange('roleId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.roleId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={rolesLoading}
                    required
                  >
                    <option value="">Select a role</option>
                    {roles.map(role => (
                      <option key={role._id} value={role._id}>
                        {role.name} {role.isSystem && '(System)'}
                        {role.name === 'Employee' && ' (Default)'}
                      </option>
                    ))}
                  </select>
                  {rolesLoading && (
                    <p className="mt-1 text-sm text-gray-500">Loading roles...</p>
                  )}
                  {validationErrors.roleId && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.roleId}</p>
                  )}
                  {formData.roleId && !validationErrors.roleId && (
                    <p className="mt-1 text-sm text-gray-600">
                      Selected role will override individual permissions below
                    </p>
                  )}
                  {!formData.roleId && !rolesLoading && !validationErrors.roleId && (
                    <p className="mt-1 text-sm text-amber-600">
                      Employee role will be assigned by default
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Status and Permissions */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                Status and Permissions
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive || false}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active User
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isHRManager"
                    checked={formData.isHRManager || false}
                    onChange={(e) => handleInputChange('isHRManager', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isHRManager" className="ml-2 block text-sm text-gray-900">
                    HR Manager
                  </label>
                </div>
              </div>
            </div>

            {/* Validation error summary + API error — visible right at the Save button */}
            {(Object.keys(validationErrors).some(k => validationErrors[k]) || error) && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                {error && <p className="text-red-700 text-sm font-semibold mb-1">⚠️ {error}</p>}
                {Object.entries(validationErrors).filter(([, v]) => v).map(([field, msg]) => (
                  <p key={field} className="text-red-600 text-xs">• {msg}</p>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 mt-4">
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 text-white font-bold rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                style={{ background: isSaving ? '#ea580c99' : 'linear-gradient(135deg,#c2410c,#ea580c,#f97316)' }}
              >
                {isSaving
                  ? <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Saving…
                    </span>
                  : 'Save Changes'
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
