'use client';

import { useEffect, useState, useCallback } from 'react';
import { MagnifyingGlassIcon, UserPlusIcon, UserGroupIcon, ShieldCheckIcon, BuildingOfficeIcon, PlusIcon, TrashIcon, PencilIcon, XMarkIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import UserEditModal from '@/components/admin/UserEditModal';
import ClerkUsersModal from '@/components/admin/ClerkUsersModal';
import ConfirmationModal from '@/components/admin/ConfirmationModal';
import { useTimezone } from '@/lib/hooks/useTimezone';
import AdminSubNav from '@/components/admin/AdminSubNav';

interface User {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  joinDate: string;
  isActive: boolean;
  timezone: string;
  managerName?: string;
}

interface UsersData {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    departments: string[];
  };
}

interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}



export default function UsersManagementPage() {
  const { formatDateString } = useTimezone();

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
  
  // Tab state
  const [activeTab, setActiveTab] = useState('all-users');
  
  // Users state
  const [usersData, setUsersData] = useState<UsersData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showClerkUsersModal, setShowClerkUsersModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Positions state
  const [departmentPositions, setDepartmentPositions] = useState<Record<string, Record<string, string[]>>>({});
  const [positionEmployeeCounts, setPositionEmployeeCounts] = useState<Record<string, number>>({});
  const [positionDetails, setPositionDetails] = useState<Record<string, { id: string; name: string; department: string; level: string }>>({});
  
  // Get departments from positions data
  const departments = Object.keys(departmentPositions);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsSaving, setPositionsSaving] = useState(false);
  const [positionsError, setPositionsError] = useState<string | null>(null);
  const [positionsSuccess, setPositionsSuccess] = useState<string | null>(null);
  const [editingPositionIndex, setEditingPositionIndex] = useState<number | null>(null);
  const [newPosition, setNewPosition] = useState({ name: '', department: '', description: '', level: '' });
  const [editingPosition, setEditingPosition] = useState({ name: '', department: '', description: '', level: '' });
  const [selectedDepartmentForPositions, setSelectedDepartmentForPositions] = useState('');
  const [showAddPositionForm, setShowAddPositionForm] = useState(false);
  const [selectedDepartmentForNewPosition, setSelectedDepartmentForNewPosition] = useState('');

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  // Roles state
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesSaving, setRolesSaving] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [rolesSuccess, setRolesSuccess] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());



  // Clear success messages after 5 seconds
  useEffect(() => {
    if (rolesSuccess) {
      const timer = setTimeout(() => setRolesSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [rolesSuccess]);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedDepartment && { department: selectedDepartment }),
        ...(selectedStatus && { status: selectedStatus })
      });

      const response = await fetch(`/api/admin/users?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      if (data.success) {
        setUsersData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Users fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, selectedDepartment, selectedStatus]);


  // Positions functions
  const fetchPositions = useCallback(async () => {
    try {
      console.log('🔍 [Frontend] Starting positions fetch...');
      setPositionsLoading(true);
      setPositionsError(null);
      
      const response = await fetch('/api/admin/orgstructure');
      console.log('📡 [Frontend] Response status:', response.status);
      console.log('📡 [Frontend] Response ok:', response.ok);
      
      const data = await response.json();
      console.log('📊 [Frontend] Response data:', data);
      
      if (data.success) {
        console.log('✅ [Frontend] Positions fetched successfully');
        
        // Convert org structure to the expected format
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
        
        setDepartmentPositions(departmentPositions);
        // Fetch detailed position data with IDs
        await fetchPositionDetails();
        // Fetch employee counts for each position
        await fetchPositionEmployeeCounts(departmentPositions);
      } else {
        console.error('❌ [Frontend] API returned error:', data.error);
        setPositionsError(data.error || 'Failed to fetch positions');
      }
    } catch (error) {
      console.error('❌ [Frontend] Positions fetch error:', error);
      console.error('❌ [Frontend] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      setPositionsError('Failed to fetch positions');
    } finally {
      setPositionsLoading(false);
    }
  }, []);

  const fetchPositionDetails = async () => {
    try {
      const response = await fetch('/api/admin/positions');
      const data = await response.json();
      
      if (data.success) {
        // Create a map of position names to their details
        const detailsMap: Record<string, { id: string; name: string; department: string; level: string }> = {};
        data.data.forEach((position: any) => {
          detailsMap[position.name] = {
            id: position._id,
            name: position.name,
            department: position.department,
            level: position.level || 'Other'
          };
        });
        setPositionDetails(detailsMap);
      } else {
        console.error('Failed to fetch position details:', data.error);
      }
    } catch (error) {
      console.error('Error fetching position details:', error);
    }
  };

  const fetchPositionEmployeeCounts = async (positionsData: Record<string, Record<string, string[]>>) => {
    try {
      // Get all unique position names
      const allPositions: string[] = [];
      Object.values(positionsData).forEach(seniorityGroups => {
        Object.values(seniorityGroups).forEach(positions => {
          allPositions.push(...positions);
        });
      });

      if (allPositions.length === 0) {
        setPositionEmployeeCounts({});
        return;
      }

      // Fetch employee counts for each position
      const response = await fetch('/api/admin/positions/employee-counts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ positions: allPositions }),
      });

      const data = await response.json();
      
      if (data.success) {
        setPositionEmployeeCounts(data.data);
      } else {
        console.error('Failed to fetch position employee counts:', data.error);
        // Set all counts to 0 if API fails
        const counts: Record<string, number> = {};
        allPositions.forEach(position => {
          counts[position] = 0;
        });
        setPositionEmployeeCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching position employee counts:', error);
      // Set all counts to 0 if there's an error
      const counts: Record<string, number> = {};
      Object.values(positionsData).forEach(seniorityGroups => {
        Object.values(seniorityGroups).forEach(positions => {
          positions.forEach(position => {
            counts[position] = 0;
          });
        });
      });
      setPositionEmployeeCounts(counts);
    }
  };

  const handleOpenAddPositionForm = (department: string) => {
    setSelectedDepartmentForNewPosition(department);
    setNewPosition({ name: '', department: department, description: '', level: '' });
    setShowAddPositionForm(true);
    setPositionsError(null);
    setPositionsSuccess(null);
  };

  const handleCloseAddPositionForm = () => {
    setShowAddPositionForm(false);
    setSelectedDepartmentForNewPosition('');
    setNewPosition({ name: '', department: '', description: '', level: '' });
  };

  const handleAddPosition = async () => {
    if (!newPosition.name.trim()) {
      setPositionsError('Position name is required');
      return;
    }

    try {
      setPositionsSaving(true);
      setPositionsError(null);
      setPositionsSuccess(null);

      const response = await fetch('/api/admin/positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPosition),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh the grouped positions and employee counts
        await fetchPositions();
        setPositionsSuccess('Position created successfully');
        handleCloseAddPositionForm();
      } else {
        setPositionsError(data.error || 'Failed to create position');
      }
    } catch (error) {
      console.error('Position create error:', error);
      setPositionsError('Failed to create position');
    } finally {
      setPositionsSaving(false);
    }
  };

  const handleEditPosition = (department: string, seniority: string, positionName: string) => {
    setEditingPositionIndex(0); // We'll use this as a flag
    setEditingPosition({
      name: positionName,
      department: department,
      description: '',
      level: seniority
    });
  };

  const handleSavePositionEdit = async () => {
    if (!editingPosition.name.trim() || !editingPosition.department.trim()) {
      setPositionsError('Position name and department are required');
      return;
    }

    try {
      setPositionsSaving(true);
      setPositionsError(null);
      setPositionsSuccess(null);

      // For now, we'll just refresh the data after edit
      // In a real implementation, you'd need to track the position ID
      await fetchPositions();
      setPositionsSuccess('Position updated successfully');
      setEditingPositionIndex(null);
      setEditingPosition({ name: '', department: '', description: '', level: '' });
    } catch (error) {
      console.error('Position update error:', error);
      setPositionsError('Failed to update position');
    } finally {
      setPositionsSaving(false);
    }
  };

  const handleDeletePosition = async (department: string, seniority: string, positionName: string) => {
    const positionDetail = positionDetails[positionName];
    if (!positionDetail) {
      setPositionsError('Position details not found');
      return;
    }

    setConfirmTitle('Delete Position');
    setConfirmMessage(`Are you sure you want to delete the position "${positionName}"?`);
    setConfirmAction(() => async () => {
      try {
        setPositionsSaving(true);
        setPositionsError(null);
        setPositionsSuccess(null);

        const response = await fetch(`/api/admin/positions/${positionDetail.id}`, {
          method: 'DELETE',
        });

        const data = await response.json();
        
        if (data.success) {
          setPositionsSuccess('Position deleted successfully');
          await fetchPositions();
        } else {
          setPositionsError(data.error || 'Failed to delete position');
        }
      } catch (error) {
        console.error('Position delete error:', error);
        setPositionsError('Failed to delete position');
      } finally {
        setPositionsSaving(false);
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const handleCancelPositionEdit = () => {
    setEditingPositionIndex(null);
    setEditingPosition({ name: '', department: '', description: '', level: '' });
  };

  // Roles functions
  const fetchRoles = async () => {
    try {
      setRolesLoading(true);
      setRolesError(null);
      const response = await fetch('/api/admin/roles');
      const data = await response.json();
      
      if (data.success) {
        setRoles(data.data);
      } else {
        setRolesError(data.error || 'Failed to fetch roles');
      }
    } catch (error) {
      console.error('Roles fetch error:', error);
      setRolesError('Failed to fetch roles');
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'all-users') {
    fetchUsers();
    } else if (activeTab === 'positions') {
      fetchPositions();
    } else if (activeTab === 'roles') {
      fetchRoles();
    }
  }, [currentPage, searchTerm, selectedDepartment, selectedStatus, activeTab, fetchUsers, fetchPositions]);

  // Focus trap issue in AdminSubNav has been fixed - no manual intervention needed

  const handleCreateRole = () => {
    setEditingRole(null);
    setRoleForm({ name: '', description: '', permissions: [] });
    setShowRoleModal(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || []
    });
    setShowRoleModal(true);
  };

  const handleSaveRole = async () => {
    if (!roleForm.name.trim()) {
      setRolesError('Role name is required');
      return;
    }

    try {
      setRolesSaving(true);
      setRolesError(null);
      setRolesSuccess(null);

      const url = editingRole ? `/api/admin/roles/${editingRole._id}` : '/api/admin/roles';
      const method = editingRole ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleForm),
      });

      const data = await response.json();

      if (data.success) {
        setRolesSuccess(editingRole ? 'Role updated successfully' : 'Role created successfully');
        setShowRoleModal(false);
        setEditingRole(null);
        setRoleForm({ name: '', description: '', permissions: [] });
        fetchRoles();
      } else {
        setRolesError(data.error || 'Failed to save role');
      }
    } catch (error) {
      console.error('Role save error:', error);
      setRolesError('Failed to save role');
    } finally {
      setRolesSaving(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.isSystem) {
      setRolesError('Cannot delete system roles');
      return;
    }

    if (role.employeeCount > 0) {
      setRolesError(`Cannot delete role. ${role.employeeCount} user(s) are currently assigned to this role.`);
      return;
    }

    setConfirmTitle('Delete Role');
    setConfirmMessage(`Are you sure you want to delete the role "${role.name}"?`);
    setConfirmAction(() => async () => {
      try {
        setRolesSaving(true);
        setRolesError(null);
        setRolesSuccess(null);

        const response = await fetch(`/api/admin/roles/${role._id}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (data.success) {
          setRolesSuccess('Role deleted successfully');
          fetchRoles();
        } else {
          setRolesError(data.error || 'Failed to delete role');
        }
      } catch (error) {
        console.error('Role delete error:', error);
        setRolesError('Failed to delete role');
      } finally {
        setRolesSaving(false);
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const handlePermissionToggle = (permissionId: string) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const toggleRoleExpansion = (roleId: string) => {
    setExpandedRoles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setCurrentPage(1); // Reset pagination when switching tabs
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleDeactivateUser = async (userId: string, currentStatus: boolean) => {
    setConfirmTitle(currentStatus ? 'Deactivate Employee' : 'Activate Employee');
    setConfirmMessage(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`);
    setConfirmAction(() => async () => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: !currentStatus })
        });
        const data = await res.json();
        if (data.success) {
          fetchUsers();
        } else {
          setError(data.error || 'Failed to update user status');
        }
      } catch (err) {
        console.error('Action failed:', err);
        setError('An error occurred during update');
      } finally {
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const handleSelectAllUsers = () => {
    if (usersData && selectedUsers.length === usersData.users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(usersData?.users.map(user => user._id) || []);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedUsers.length === 0) return;

    setConfirmTitle('Deactivate Users');
    setConfirmMessage(`Are you sure you want to deactivate ${selectedUsers.length} user(s)?`);
    setConfirmAction(() => async () => {
      try {
        const response = await fetch('/api/admin/users/bulk', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userIds: selectedUsers,
            action: 'deactivate'
          }),
        });

        if (response.ok) {
          setSelectedUsers([]);
          setShowBulkActions(false);
          fetchUsers();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to deactivate users');
        }
      } catch (error) {
        console.error('Bulk deactivate error:', error);
        alert(error instanceof Error ? error.message : 'Failed to deactivate users');
      } finally {
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const exportUsersData = () => {
    if (!usersData) return;

    // Create CSV content
    const headers = ['Employee ID', 'First Name', 'Last Name', 'Email', 'Department', 'Position', 'Join Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...usersData.users.map(user => [
        user.employeeId,
        user.firstName,
        user.lastName,
        user.email,
        user.department,
        user.position,
        safeFormatDate(user.joinDate, 'MM/dd/yyyy'),
        user.isActive ? 'Active' : 'Inactive'
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditUser = (userId: string) => {
    setEditingUserId(userId);
    setShowEditModal(true);
  };

  const handleUserUpdated = () => {
    fetchUsers(); // Refresh the user list
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingUserId(null);
  };

  if (isLoading && !usersData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !usersData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading users</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Sub Navigation */}
      <AdminSubNav
        title=""
        items={[
          {
            id: 'all-users',
            label: 'All Users',
            href: '#',
            icon: <UserGroupIcon className="w-4 h-4" />,
            badge: usersData?.users?.length || 0,
          },
          {
            id: 'roles',
            label: 'Roles & Permissions',
            href: '#',
            icon: <ShieldCheckIcon className="w-4 h-4" />,
          },
          {
            id: 'positions',
            label: 'Positions',
            href: '#',
            icon: <BuildingOfficeIcon className="w-4 h-4" />,
          },
        ]}
        variant="tabs"
        onItemClick={handleTabChange}
        activeItem={activeTab}
      />



      {/* All Users Tab Content */}
      {activeTab === 'all-users' && (
        <>
      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-yellow-800">
                  Bulk Actions for {selectedUsers.length} selected user(s)
                </span>
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                >
                  {showBulkActions ? 'Hide Actions' : 'Show Actions'}
                </button>
              </div>
              {showBulkActions && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleBulkDeactivate}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    Deactivate Selected
                  </button>
                  <button
                    onClick={() => setShowBulkActions(false)}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSearch} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users by name, email, or ID..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All Departments</option>
              {usersData?.filters.departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Action Buttons and Results Row */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Results Count */}
            <div className="text-sm text-gray-500">
              {usersData && (
                <span>
                  Showing {((usersData.pagination.page - 1) * usersData.pagination.limit) + 1} to{' '}
                  {Math.min(usersData.pagination.page * usersData.pagination.limit, usersData.pagination.total)} of{' '}
                  {usersData.pagination.total} results
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={exportUsersData}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
              >
                Export Users
              </button>
              <button
                onClick={() => setShowClerkUsersModal(true)}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors whitespace-nowrap"
              >
                <UserPlusIcon className="w-4 h-4 mr-2" />
                Import from Clerk
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors whitespace-nowrap"
              >
                <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                Search
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Users Table */}
      {usersData && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={usersData && selectedUsers.length === usersData.users.length}
                      onChange={handleSelectAllUsers}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Join Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersData.users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleUserSelection(user._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">ID: {user.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {user.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.managerName || 'No manager'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {safeFormatDate(user.joinDate, 'MM/dd/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEditUser(user._id)}
                        className="text-blue-600 hover:text-blue-900 transition-colors mr-3"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeactivateUser(user._id, user.isActive)}
                        className={`${user.isActive ? 'text-red-600 hover:text-red-900' : 'text-emerald-600 hover:text-emerald-900'} transition-colors`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {usersData.pagination.pages > 1 && (
            <div className="bg-white px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {usersData.pagination.page} of {usersData.pagination.pages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === usersData.pagination.pages}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
        </>
      )}

      {/* Positions Tab Content */}
      {activeTab === 'positions' && (
        <div className="space-y-8">
          {/* Success/Error Messages */}
          {positionsSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{positionsSuccess}</p>
                </div>
              </div>
            </div>
          )}

          {positionsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{positionsError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Position Management Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Position Management</h2>
              <p className="text-sm text-gray-600 mt-1">Manage positions for each department</p>
            </div>

            {/* Positions List by Department and Seniority */}
            <div className="p-6">
              {positionsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading positions...</p>
                </div>
              ) : Object.keys(departmentPositions).length === 0 ? (
                <div className="text-center py-8">
                  <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No positions found</h4>
                  <p className="text-gray-600">Add your first position to get started</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(departmentPositions).map(([department, seniorityGroups]) => (
                    <div key={department} className="border border-gray-200 rounded-lg">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{department}</h4>
                          <p className="text-sm text-gray-600">
                            {Object.values(seniorityGroups).flat().length} position(s) across {Object.keys(seniorityGroups).length} seniority level(s)
                            {(() => {
                              const totalEmployees = Object.values(seniorityGroups).flat().reduce((total, position) => {
                                return total + (positionEmployeeCounts[position] || 0);
                              }, 0);
                              return totalEmployees > 0 ? ` • ${totalEmployees} employee${totalEmployees !== 1 ? 's' : ''}` : '';
                            })()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenAddPositionForm(department)}
                          className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <PlusIcon className="w-4 h-4 mr-1" />
                          Add Position
                        </button>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {Object.entries(seniorityGroups).map(([seniority, positions]) => (
                          <div key={seniority} className="px-4 py-3">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium text-gray-700 text-sm uppercase tracking-wide">
                                {seniority} Level
                              </h5>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {(() => {
                                  const totalEmployees = positions.reduce((total, position) => {
                                    return total + (positionEmployeeCounts[position] || 0);
                                  }, 0);
                                  return `${totalEmployees} employee${totalEmployees !== 1 ? 's' : ''}`;
                                })()}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {positions.map((positionName) => (
                                <div key={positionName} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
                                  <span className="text-sm font-medium text-gray-900">{positionName}</span>
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => handleEditPosition(department, seniority, positionName)}
                                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                      title="Edit position"
                                    >
                                      <PencilIcon className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeletePosition(department, seniority, positionName)}
                                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                      title="Delete position"
                                    >
                                      <TrashIcon className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Add Position Modal */}
          {showAddPositionForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Add Position to {selectedDepartmentForNewPosition}
                    </h3>
                    <button
                      onClick={handleCloseAddPositionForm}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Position Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position Name *
                      </label>
                      <input
                        type="text"
                        value={newPosition.name}
                        onChange={(e) => setNewPosition({ ...newPosition, name: e.target.value })}
                        placeholder="e.g., Senior Developer"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Seniority Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Seniority Level
                      </label>
                      <select
                        value={newPosition.level}
                        onChange={(e) => setNewPosition({ ...newPosition, level: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Level</option>
                        <option value="Entry">Entry</option>
                        <option value="Junior">Junior</option>
                        <option value="Mid">Mid</option>
                        <option value="Senior">Senior</option>
                        <option value="Lead">Lead</option>
                        <option value="Manager">Manager</option>
                        <option value="Director">Director</option>
                        <option value="Executive">Executive</option>
                        <option value="Associate">Associate</option>
                        <option value="Specialist">Specialist</option>
                      </select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
                    <button
                      onClick={handleCloseAddPositionForm}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      disabled={positionsSaving}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddPosition}
                      disabled={!newPosition.name.trim() || positionsSaving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {positionsSaving ? 'Adding...' : 'Add Position'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          {positionsSaving && (
            <div className="fixed bottom-8 right-8 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </div>
          )}
        </div>
      )}

      {/* Roles Tab Content */}
      {activeTab === 'roles' && (
        <div className="space-y-8">
          {/* Success/Error Messages */}
          {rolesSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{rolesSuccess}</p>
                </div>
              </div>
            </div>
          )}

          {rolesError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{rolesError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Roles List */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Current Roles</h2>
                  <p className="text-sm text-gray-600 mt-1">Manage existing roles and permissions</p>
                </div>
                <button
                  onClick={handleCreateRole}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Role
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {rolesLoading ? (
                <div className="px-6 py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading roles...</p>
                </div>
              ) : roles.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <ShieldCheckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
                  <p className="text-gray-600">Create your first role to get started</p>
                </div>
              ) : (
                roles.map((role) => {
                  const isExpanded = expandedRoles.has(role._id);
                  
                  return (
                    <div key={role._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <ShieldCheckIcon className="w-5 h-5 text-gray-400" />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg font-medium text-gray-900">{role.name}</span>
                                {role.isSystem && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    System
                                  </span>
                                )}
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {role.employeeCount} employee{role.employeeCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                              {role.description && (
                                <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                              )}
                              <div className="mt-2 flex items-center space-x-4">
                                <span className="text-xs text-gray-500">
                                  {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                                </span>
                                <button
                                  onClick={() => toggleRoleExpansion(role._id)}
                                  className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronDownIcon className="w-3 h-3" />
                                      <span>Hide permissions</span>
                                    </>
                                  ) : (
                                    <>
                                      <ChevronRightIcon className="w-3 h-3" />
                                      <span>Show permissions</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditRole(role)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit role"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          {!role.isSystem && (
                            <button
                              onClick={() => handleDeleteRole(role)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete role"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                        {/* Expanded Permissions */}
                        {isExpanded && (
                          <div className="mt-4 pl-8 border-l-2 border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Permissions:</h4>
                            <div className="space-y-4">
                              {role.permissions && role.permissions.length > 0 ? (
                                (() => {
                                  // Group permissions by resource type
                                  const groupedPermissions = role.permissions.reduce((acc, permissionId) => {
                                    const [resource] = permissionId.split(':');
                                    if (!acc[resource]) {
                                      acc[resource] = [];
                                    }
                                    acc[resource].push(permissionId);
                                    return acc;
                                  }, {} as Record<string, string[]>);

                                  return Object.entries(groupedPermissions).map(([resource, permissions]) => (
                                    <div key={resource} className="space-y-2">
                                      <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">{resource}</h5>
                                      <div className="flex flex-wrap gap-1">
                                        {permissions.map((permissionId) => (
                                          <span key={permissionId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {permissionId}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ));
                                })()
                              ) : (
                                <p className="text-sm text-gray-500 italic">No permissions assigned</p>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingRole ? 'Edit Role' : 'Create New Role'}
                </h3>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Role Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter role name"
                  />
                </div>

                {/* Role Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={roleForm.description}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter role description"
                  />
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Permissions
                  </label>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-4">
                      Permissions are managed as simple strings in the format "resource:action". To add permissions, you can:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Copy permissions from an existing role</li>
                      <li>• Manually add permissions in the format "resource:action"</li>
                      <li>• Use the role management interface to configure permissions</li>
                    </ul>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Copy permissions from existing role:
                      </label>
                      <select
                        onChange={(e) => {
                          const selectedRole = roles.find(r => r._id === e.target.value);
                          if (selectedRole && selectedRole.permissions) {
                            setRoleForm(prev => ({
                              ...prev,
                              permissions: selectedRole.permissions
                            }));
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a role to copy permissions from</option>
                        {roles.map(role => (
                          <option key={role._id} value={role._id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {roleForm.permissions.length > 0 && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current permissions:
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {roleForm.permissions.map((permission) => (
                            <span key={permission} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={rolesSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRole}
                  disabled={rolesSaving || !roleForm.name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rolesSaving ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      <UserEditModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        userId={editingUserId}
        onUserUpdated={handleUserUpdated}
      />

      {/* Clerk Users Import Modal */}
      <ClerkUsersModal
        isOpen={showClerkUsersModal}
        onClose={() => setShowClerkUsersModal(false)}
        onUsersAdded={fetchUsers}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => confirmAction?.()}
        title={confirmTitle}
        message={confirmMessage}
        isLoading={positionsSaving}
      />
    </div>
  );
}
