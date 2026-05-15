'use client';

import { useEffect, useState } from 'react';
import { PlusIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDevSafeAuth as useAuth } from '@/lib/hooks/useDevSafeClerk';;
import { useTimezone } from '@/lib/hooks/useTimezone';
import ConfirmationModal from '@/components/admin/ConfirmationModal';

interface User {
  clerkUserId: string;
  displayName: string;
  employeeId: string;
  department: string;
  position: string;
  email: string;
}

interface Team {
  _id: string;
  name: string;
  description: string;
  department: string;
  teamLeaderId: string; // Clerk user ID
  members: string[]; // Array of Clerk user IDs
  createdAt: string;
  isActive: boolean;
}

interface TeamsData {
  teams: Team[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  overview: {
    totalTeams: number;
    totalMembers: number;
    averageTeamSize: number;
    departments: string[];
  };
}

interface CreateTeamForm {
  name: string;
  description: string;
  department: string;
  teamLeaderId: string;
  members: string[];
}

export default function TeamManagementPage() {
  const { userId, isLoaded } = useAuth();
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
  const [teamsData, setTeamsData] = useState<TeamsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [departments, setDepartments] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<CreateTeamForm>({
    name: '',
    description: '',
    department: '',
    teamLeaderId: '',
    members: []
  });
  const [users, setUsers] = useState<User[]>([]);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [editUserSearch, setEditUserSearch] = useState('');
  const [editMemberSearch, setEditMemberSearch] = useState('');
  const [createForm, setCreateForm] = useState<CreateTeamForm>({
    name: '',
    description: '',
    department: '',
    teamLeaderId: '',
    members: []
  });
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isTeamLeader, setIsTeamLeader] = useState(false);


  const fetchUsers = async (searchTerm = '', department = '') => {
    try {
      setIsLoadingUsers(true);
      const params = new URLSearchParams({
        limit: '100',
        ...(searchTerm && { search: searchTerm }),
        ...(department && { department: department })
      });
      
      const response = await fetch(`/api/admin/users/list?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users for team creation');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch all users for team display (not just for search)
  const fetchAllUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/list?limit=500');
      
      if (!response.ok) {
        throw new Error('Failed to fetch all users');
      }

      const data = await response.json();
      if (data.success) {
        setAllUsers(data.data.users);
        setUsers(data.data.users); // Keep users state for backward compatibility
      }
    } catch (error) {
      console.error('Error fetching all users:', error);
    }
  };

  // const getUserDisplayName = (clerkUserId: string) => {
  //   const user = users.find(u => u.clerkUserId === clerkUserId);
  //   if (user) {
  //     return user.displayName;
  //   }
  //   // If user not found, return a formatted version of the ID
  //   return `${clerkUserId.substring(0, 8)}...`;
  // };

  // const getUserData = (clerkUserId: string) => {
  //   return allUsers.find(u => u.clerkUserId === clerkUserId);
  // };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/admin/orgstructure/departments');
      const data = await response.json();
      if (data.success) {
        setDepartments(data.data.map((dept: any) => dept.name));
      } else {
        console.error('Failed to fetch departments:', data.error);
      }
    } catch (error) {
      console.error('Departments fetch error:', error);
    }
  };

  const fetchTeams = async () => {
    if (!userId || !isLoaded) return
    
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(selectedDepartment && { department: selectedDepartment })
      });

      const response = await fetch(`/api/admin/teams?${params}`);
      
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Frontend: Response not ok:', response.status, errorText);
        
        let errorMessage = 'Failed to fetch teams';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If error response is not JSON, use the text
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (data.success) {
        setTeamsData(data.data);
        
        // Check if current user is a team leader of any team
        if (currentUserId && data.data.teams) {
          const userIsTeamLeader = data.data.teams.some((team: Team) => 
            team.teamLeaderId === currentUserId
          );
          setIsTeamLeader(userIsTeamLeader);
        }
        
        // Ensure we have user data for team display
        if (users.length === 0) {
          fetchAllUsers();
        }
      } else {
        throw new Error(data.error || 'Failed to fetch teams');
      }
    } catch (error) {
      console.error('❌ Frontend: Teams fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch teams');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    if (userId && isLoaded) {
      setCurrentUserId(userId);
      fetchTeams();
      fetchUsers();
      fetchAllUsers(); // Fetch all users for team display
      fetchDepartments();
    }
  }, [currentPage, selectedDepartment, userId, isLoaded]);

  // Filter changes are now handled automatically by useEffect when selectedDepartment changes

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    setShowTeamDetails(true);
    
    // Fetch all users to ensure we have data for team members
    fetchAllUsers();
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setEditForm({
      name: team.name,
      description: team.description || '',
      department: team.department || '',
      teamLeaderId: team.teamLeaderId,
      members: team.members
    });
    setShowEditModal(true);
    
    // Fetch all users to ensure we have data for existing members
    fetchAllUsers();
  };

  const handleUpdateTeam = async () => {
    if (!selectedTeam) return;

    if (!editForm.name || !editForm.department || !editForm.teamLeaderId) {
      alert('Please fill in all required fields');
      return;
    }

    if (editForm.members.length === 0) {
      alert('Please select at least one team member');
      return;
    }

    const teamData = {
      name: editForm.name,
      description: editForm.description,
      department: editForm.department,
      managerId: editForm.teamLeaderId,
      members: editForm.members.includes(editForm.teamLeaderId) 
        ? editForm.members 
        : [...editForm.members, editForm.teamLeaderId]
    };

    try {
      setIsEditing(true);
      
      const response = await fetch(`/api/admin/teams/${selectedTeam._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchTeams();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update team');
      }
    } catch (error) {
      console.error('Update team error:', error);
      alert(error instanceof Error ? error.message : 'Failed to update team');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    setConfirmTitle('Delete Team');
    setConfirmMessage(`Are you sure you want to delete the team "${team.name}"? This action cannot be undone.`);
    setConfirmAction(() => async () => {
      try {
        const response = await fetch(`/api/admin/teams/${team._id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchTeams();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete team');
        }
      } catch (error) {
        console.error('Delete team error:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete team');
      } finally {
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const handleCreateTeam = async () => {
    
    if (!createForm.name || !createForm.department || !createForm.teamLeaderId) {
      console.error('❌ Validation failed:', {
        name: createForm.name,
        department: createForm.department,
        teamLeaderId: createForm.teamLeaderId
      });
      alert('Please fill in all required fields');
      return;
    }

    if (createForm.members.length === 0) {
      alert('Please select at least one team member');
      return;
    }

    // Ensure team leader is included in members list
    const teamData = {
      name: createForm.name,
      description: createForm.description,
      department: createForm.department,
      managerId: createForm.teamLeaderId, // API expects managerId
      members: createForm.members.includes(createForm.teamLeaderId) 
        ? createForm.members 
        : [...createForm.members, createForm.teamLeaderId]
    };

    try {
      setIsCreating(true);
      
      
      const response = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });

      if (response.ok) {
        setShowCreateModal(false);
        resetCreateForm();
        fetchTeams();
      } else {
        const errorData = await response.json();
        console.error('❌ Team creation failed:', errorData);
        throw new Error(errorData.error || 'Failed to create team');
      }
    } catch (error) {
      console.error('Create team error:', error);
      alert(error instanceof Error ? error.message : 'Failed to create team');
    } finally {
      setIsCreating(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      description: '',
      department: '',
      teamLeaderId: '',
      members: []
    });
    setUserSearch('');
    setMemberSearch('');
    fetchUsers('', ''); // Reset user search and department filter
  };

  if (isLoading && !teamsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !teamsData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading teams</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button
              onClick={fetchTeams}
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
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Management</h1>
          </div>
          <div className="flex items-center space-x-4">
          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setCurrentPage(1); // Reset to first page when filter changes
            }}
              className="block px-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
          >
            <option value="">All Departments</option>
            {teamsData?.overview.departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
            <button
              onClick={() => {
                setShowCreateModal(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Team
          </button>
              </div>
        </div>
      </div>



      {/* Teams Grid */}
      {isLoadingUsers ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading team information...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamsData?.teams.map((team) => (
            <div key={team._id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {team.department}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{team.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <UserGroupIcon className="w-4 h-4 mr-2" />
                    {team.members.length} member(s)
                  </div>
                  <span className="text-xs text-gray-400">
                    Created {safeFormatDate(team.createdAt, 'MM/dd/yyyy')}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Team Leader:</span> 
                    <span className="ml-1 text-gray-900">
                      {(() => {
                        const leader = allUsers.find(u => u.clerkUserId === team.teamLeaderId);
                        if (leader) {
                          return (
                            <span className="inline-flex items-center space-x-2">
                              <span>{leader.displayName}</span>
                              <span className="text-xs text-gray-500">({leader.position})</span>
                            </span>
                          );
                        }
                        return (
                          <span className="text-gray-500 italic">
                            {team.teamLeaderId.substring(0, 8)}... (Loading...)
                          </span>
                        );
                      })()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Members: {team.members.length} (
                      {(() => {
                        const memberNames = team.members.slice(0, 2).map(id => {
                          const member = allUsers.find(u => u.clerkUserId === id);
                          return member ? member.displayName : `${id.substring(0, 8)}...`;
                        });
                        return memberNames.join(', ');
                      })()}
                      {team.members.length > 2 && '...'}
                    )
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleTeamSelect(team)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => handleEditTeam(team)}
                    className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                    title="Edit Team"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDeleteTeam(team)}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete Team"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {teamsData && teamsData.pagination.pages > 1 && (
        <div className="bg-white px-6 py-4 border-t border-gray-200 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {teamsData.pagination.page} of {teamsData.pagination.pages}
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
                disabled={currentPage === teamsData.pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-0 border w-full max-w-4xl shadow-2xl rounded-2xl bg-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <UserGroupIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Create New Team</h3>
                  <p className="text-sm text-gray-600">Set up a new team with members and structure</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              {/* Progress Indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center space-x-2 ${createForm.name && createForm.department ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        createForm.name && createForm.department ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {createForm.name && createForm.department ? (
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="text-sm font-semibold text-gray-600">1</span>
                        )}
                      </div>
                      <span className="text-sm font-medium">Basic Info</span>
                    </div>
                    
                    <div className="w-8 h-1 bg-gray-200 rounded-full"></div>
                    
                    <div className={`flex items-center space-x-2 ${createForm.teamLeaderId ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        createForm.teamLeaderId ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {createForm.teamLeaderId ? (
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="text-sm font-semibold text-gray-600">2</span>
                        )}
                      </div>
                      <span className="text-sm font-medium">Leadership</span>
                    </div>
                    
                    <div className="w-8 h-1 bg-gray-200 rounded-full"></div>
                    
                    <div className={`flex items-center space-x-2 ${createForm.members.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        createForm.members.length > 0 ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {createForm.members.length > 0 ? (
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="text-sm font-semibold text-gray-600">3</span>
                        )}
                      </div>
                      <span className="text-sm font-medium">Members</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-600">Completion</div>
                    <div className="text-lg font-bold text-blue-600">
                      {(() => {
                        let completed = 0;
                        if (createForm.name && createForm.department) completed++;
                        if (createForm.teamLeaderId) completed++;
                        if (createForm.members.length > 0) completed++;
                        return `${Math.round((completed / 3) * 100)}%`;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              
              <form onSubmit={(e) => { 
                e.preventDefault(); 
                handleCreateTeam(); 
              }} className="space-y-8">
                
                {/* Step 1: Basic Information */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 pb-2 border-b border-gray-200">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">1</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Team Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Team Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
                        placeholder="e.g., Product Development Team"
                        required
                      />
                      <p className="text-xs text-gray-500">Choose a clear, descriptive name for your team</p>
                    </div>

                    {/* Department */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={createForm.department}
                        onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white"
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500">Select the department this team belongs to</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Team Description
                    </label>
                    <textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400 resize-none"
                      placeholder="Describe the team's purpose, goals, and responsibilities..."
                    />
                    <p className="text-xs text-gray-500">Optional: Provide context about what this team does</p>
                  </div>
                </div>

                {/* Step 2: Team Leadership */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 pb-2 border-b border-gray-200">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-green-600">2</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Team Leadership</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Team Leader <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Team Leader Search */}
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search for team leader by name, position, or department..."
                          className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400 ${
                            createForm.teamLeaderId ? 'border-green-300 bg-green-50' : 'border-gray-300'
                          }`}
                          value={userSearch}
                          onChange={(e) => {
                            const searchTerm = e.target.value;
                            setUserSearch(searchTerm);
                            
                            // If user is typing, clear the selection to allow new search
                            if (searchTerm !== users.find(u => u.clerkUserId === createForm.teamLeaderId)?.displayName) {
                              setCreateForm({ ...createForm, teamLeaderId: '' });
                            }
                            
                            // Debounced search
                            const timeoutId = setTimeout(() => {
                              fetchUsers(searchTerm);
                            }, 300);
                            
                            return () => clearTimeout(timeoutId);
                          }}
                          onFocus={() => {
                            if (users.length === 0) {
                              fetchUsers('');
                            }
                            // Show current selection in search box
                            if (createForm.teamLeaderId) {
                              const selectedUser = users.find(u => u.clerkUserId === createForm.teamLeaderId);
                              if (selectedUser) {
                                setUserSearch(selectedUser.displayName);
                              }
                            }
                          }}
                          onBlur={() => {
                            // Close dropdown after a short delay to allow click events
                            setTimeout(() => {
                              setUserSearch(createForm.teamLeaderId ? 
                                users.find(u => u.clerkUserId === createForm.teamLeaderId)?.displayName || '' : 
                                ''
                              );
                            }, 200);
                          }}
                        />
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        {isLoadingUsers && (
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                        {userSearch && !isLoadingUsers && (
                          <button
                            type="button"
                            onClick={() => {
                              setUserSearch('');
                              setCreateForm({ ...createForm, teamLeaderId: '' });
                            }}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      {/* Search Results */}
                      {userSearch && searchResults.length > 0 && !createForm.teamLeaderId && (
                        <div className="absolute z-10 w-full mt-2 max-h-64 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-xl">
                          {searchResults.map((user) => (
                            <div
                              key={user.clerkUserId}
                              className="px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                setCreateForm({ 
                                  ...createForm, 
                                  teamLeaderId: user.clerkUserId,
                                  members: createForm.members.includes(user.clerkUserId) ? 
                                    createForm.members : 
                                    [...createForm.members, user.clerkUserId]
                                });
                                setUserSearch(user.displayName);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-semibold text-gray-700">
                                      {user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">{user.displayName}</div>
                                    <div className="text-sm text-gray-600">{user.position} • {user.department}</div>
                                    <div className="text-xs text-gray-500">ID: {user.employeeId}</div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="px-4 py-2 text-xs font-medium bg-blue-600 text-gray-700 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  Select
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Quick Selection Hint */}
                      {!createForm.teamLeaderId && searchResults.length > 0 && (
                        <div className="text-xs text-gray-500">
                          💡 Start typing to search for team leaders. You can search by name, position, or department.
                        </div>
                      )}
                    </div>
                    
                    {/* Selected Team Leader Display */}
                    {createForm.teamLeaderId && (
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-green-800">Team Leader Selected:</span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Leader
                                </span>
                              </div>
                              <div className="text-lg font-bold text-green-900">
                                {allUsers.find(u => u.clerkUserId === createForm.teamLeaderId)?.displayName || 'Unknown User'}
                              </div>
                              <div className="text-sm text-green-700">
                                {allUsers.find(u => u.clerkUserId === createForm.teamLeaderId)?.position} • {allUsers.find(u => u.clerkUserId === createForm.teamLeaderId)?.department}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCreateForm({ ...createForm, teamLeaderId: '' });
                              setUserSearch('');
                            }}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3: Team Members */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 pb-2 border-b border-gray-200">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-purple-600">3</span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Team Members</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Add Team Members
                    </label>
                    
                    {/* Member Search */}
                    <div className="relative">
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={memberSearch}
                            placeholder="Search users to add to the team..."
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
                            onChange={(e) => {
                              const searchTerm = e.target.value;
                              setMemberSearch(searchTerm);
                              if (searchTerm.length > 0) {
                                fetchUsers(searchTerm);
                              } else {
                                fetchUsers('');
                              }
                            }}
                            onFocus={() => {
                              if (users.length === 0) {
                                fetchUsers('');
                              }
                            }}
                          />
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                        </div>
                        {memberSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setMemberSearch('');
                              fetchUsers('');
                            }}
                            className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      
                      {/* Member Search Results */}
                      {isLoadingUsers ? (
                        <div className="mt-3 p-4 text-center text-gray-500 bg-gray-50 rounded-xl">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <span className="text-sm">Loading users...</span>
                        </div>
                      ) : searchResults.length > 0 && memberSearch ? (
                        <div className="mt-3 max-h-64 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-lg">
                          {searchResults
                            .filter(user => !createForm.members.includes(user.clerkUserId))
                            .map((user) => (
                              <div
                                key={user.clerkUserId}
                                className="px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                                onClick={() => {
                                  setCreateForm({
                                    ...createForm,
                                    members: [...createForm.members, user.clerkUserId]
                                  });
                                  setMemberSearch('');
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                                      <span className="text-sm font-semibold text-gray-700">
                                        {user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900">{user.displayName}</div>
                                      <div className="text-sm text-gray-600">{user.position} • {user.department}</div>
                                      <div className="text-xs text-gray-500">ID: {user.employeeId}</div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="px-4 py-2 text-xs font-medium bg-blue-600 text-gray-700 rounded-lg hover:bg-blue-700 transition-colors"
                                  >
                                    Add to Team
                                  </button>
                                </div>
                              </div>
                            ))}
                          {searchResults.filter(user => !createForm.members.includes(user.clerkUserId)).length === 0 && (
                            <div className="p-4 text-center text-gray-500 bg-gray-50">
                              <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <p className="text-sm">All available users are already in the team</p>
                            </div>
                          )}
                        </div>
                      ) : memberSearch && (
                        <div className="mt-3 p-4 text-center text-gray-500 bg-gray-50 rounded-xl">
                          <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <p className="text-sm">No users found matching &quot;{memberSearch}&quot;</p>
                        </div>
                      )}
                      
                      {/* Quick Selection Hint */}
                      {!memberSearch && createForm.members.length === 0 && (
                        <div className="text-xs text-gray-500">
                          💡 Start typing to search for team members. You can search by name, position, or department.
                        </div>
                      )}
                    </div>
                    
                    {/* Selected Members Display */}
                    {createForm.members.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">
                            Team Members ({createForm.members.length})
                          </span>
                          <span className="text-xs text-gray-500">
                            {createForm.members.length === 1 ? '1 member' : `${createForm.members.length} members`}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {createForm.members.map((memberId) => {
                            const user = allUsers.find(u => u.clerkUserId === memberId);
                            const isLeader = memberId === createForm.teamLeaderId;
                            
                            return (
                              <div
                                key={memberId}
                                className={`p-3 rounded-xl border transition-all duration-200 ${
                                  isLeader 
                                    ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' 
                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                      isLeader 
                                        ? 'bg-blue-100' 
                                        : 'bg-gray-200'
                                    }`}>
                                      {isLeader ? (
                                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      ) : (
                                        <span className="text-sm font-semibold text-gray-700">
                                          {user ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2">
                                        <p className={`font-medium truncate ${
                                          isLeader ? 'text-blue-900' : 'text-gray-900'
                                        }`}>
                                          {user ? user.displayName : `${memberId.substring(0, 8)}...`}
                                        </p>
                                        {isLeader && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            Leader
                                          </span>
                                        )}
                                      </div>
                                      {user && (
                                        <p className={`text-sm truncate ${
                                          isLeader ? 'text-blue-700' : 'text-gray-600'
                                        }`}>
                                          {user.position} • {user.department}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  {!isLeader && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCreateForm({
                                          ...createForm,
                                          members: createForm.members.filter(id => id !== memberId)
                                        });
                                      }}
                                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetCreateForm();
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={resetCreateForm}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                    >
                      Reset Form
                    </button>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isCreating || !createForm.name || !createForm.department || !createForm.teamLeaderId}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {isCreating ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating Team...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <UserGroupIcon className="w-5 h-5" />
                        <span>Create Team</span>
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-0 border w-full max-w-4xl shadow-2xl rounded-2xl bg-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Edit Team: {selectedTeam.name}</h3>
                  <p className="text-sm text-gray-600">Update team details and manage members</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedTeam(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Body - Reuse the create form structure but with edit data */}
            <div className="p-6">
              <form onSubmit={(e) => { 
                e.preventDefault(); 
                handleUpdateTeam(); 
              }} className="space-y-8">
                
                {/* Basic Information */}
                <div className="space-y-6">
                  <div className="pb-2 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Team Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Team Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
                        placeholder="e.g., Product Development Team"
                        required
                      />
                    </div>

                    {/* Department */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editForm.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white"
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Team Description
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400 resize-none"
                      placeholder="Describe the team's purpose, goals, and responsibilities..."
                    />
                  </div>
                </div>

                {/* Team Leadership */}
                <div className="space-y-6">
                  <div className="pb-2 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">Team Leadership</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Team Leader <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Team Leader Search */}
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search for new team leader by name, position, or department..."
                          className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400 ${
                            editForm.teamLeaderId ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                          }`}
                          value={editUserSearch}
                          onChange={(e) => {
                            const searchTerm = e.target.value;
                            setEditUserSearch(searchTerm);
                            
                            // If user is typing, clear the selection to allow new search
                            if (searchTerm !== users.find(u => u.clerkUserId === editForm.teamLeaderId)?.displayName) {
                              setEditForm({ ...editForm, teamLeaderId: '' });
                            }
                            
                            // Debounced search
                            const timeoutId = setTimeout(() => {
                              fetchUsers(searchTerm);
                            }, 300);
                            
                            return () => clearTimeout(timeoutId);
                          }}
                          onFocus={() => {
                            if (users.length === 0) {
                              fetchUsers('');
                            }
                            // Show current selection in search box
                            if (editForm.teamLeaderId) {
                              const selectedUser = users.find(u => u.clerkUserId === editForm.teamLeaderId);
                              if (selectedUser) {
                                setEditUserSearch(selectedUser.displayName);
                              }
                            }
                          }}
                          onBlur={() => {
                            // Close dropdown after a short delay to allow click events
                            setTimeout(() => {
                              setEditUserSearch(editForm.teamLeaderId ? 
                                users.find(u => u.clerkUserId === editForm.teamLeaderId)?.displayName || '' : 
                                ''
                              );
                            }, 200);
                          }}
                        />
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        {isLoadingUsers && (
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                          </div>
                        )}
                        {editUserSearch && !isLoadingUsers && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditUserSearch('');
                              setEditForm({ ...editForm, teamLeaderId: '' });
                            }}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      {/* Search Results */}
                      {editUserSearch && searchResults.length > 0 && !editForm.teamLeaderId && (
                        <div className="absolute z-10 w-full mt-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg">
                          {searchResults.map((user) => (
                            <div
                              key={user.clerkUserId}
                              className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                setEditForm({ 
                                  ...editForm, 
                                  teamLeaderId: user.clerkUserId,
                                  members: editForm.members.includes(user.clerkUserId) ? 
                                    editForm.members : 
                                    [...editForm.members, user.clerkUserId]
                                });
                                setEditUserSearch(user.displayName);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-semibold text-gray-700">
                                      {user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">{user.displayName}</div>
                                    <div className="text-sm text-gray-600">{user.position} • {user.department}</div>
                                    <div className="text-xs text-gray-500">ID: {user.employeeId}</div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="px-4 py-2 text-xs font-medium bg-blue-600 text-gray-700 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  Select as Leader
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Quick Selection Hint */}
                      {!editForm.teamLeaderId && searchResults.length > 0 && (
                        <div className="text-xs text-gray-500">
                          Start typing to search for a new team leader. You can search by name, position, or department.
                        </div>
                      )}
                    </div>
                    
                    {/* Current Team Leader Display */}
                    {editForm.teamLeaderId && (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-gray-700">Current Team Leader:</span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Leader
                                </span>
                              </div>
                              <div className="text-lg font-bold text-gray-900">
                                {allUsers.find(u => u.clerkUserId === editForm.teamLeaderId)?.displayName || (
                                  <span className="flex items-center space-x-2">
                                    <span>{editForm.teamLeaderId.substring(0, 8)}...</span>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                {allUsers.find(u => u.clerkUserId === editForm.teamLeaderId) ? (
                                  `${allUsers.find(u => u.clerkUserId === editForm.teamLeaderId)?.position} • ${allUsers.find(u => u.clerkUserId === editForm.teamLeaderId)?.department}`
                                ) : (
                                  <span className="italic">Loading user data...</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditForm({ ...editForm, teamLeaderId: '' });
                              setEditUserSearch('');
                            }}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Members */}
                <div className="space-y-6">
                  <div className="pb-2 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">Team Members</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Add Team Members
                    </label>
                    
                    {/* Member Search */}
                    <div className="relative">
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={editMemberSearch}
                            placeholder="Search users to add to the team..."
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
                            onChange={(e) => {
                              const searchTerm = e.target.value;
                              setEditMemberSearch(searchTerm);
                              if (searchTerm.length > 0) {
                                fetchUsers(searchTerm);
                              } else {
                                fetchUsers('');
                              }
                            }}
                            onFocus={() => {
                              if (users.length === 0) {
                                fetchUsers('');
                              }
                            }}
                          />
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                        </div>
                        {editMemberSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditMemberSearch('');
                              fetchUsers('');
                            }}
                            className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      
                      {/* Member Search Results */}
                      {isLoadingUsers ? (
                        <div className="mt-3 p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <span className="text-sm">Loading users...</span>
                        </div>
                      ) : searchResults.length > 0 && editMemberSearch ? (
                        <div className="mt-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg">
                          {searchResults
                            .filter(user => !editForm.members.includes(user.clerkUserId))
                            .map((user) => (
                              <div
                                key={user.clerkUserId}
                                className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                                onClick={() => {
                                  setEditForm({
                                    ...editForm,
                                    members: [...editForm.members, user.clerkUserId]
                                  });
                                  setEditMemberSearch('');
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                      <span className="text-sm font-semibold text-gray-700">
                                        {user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900">{user.displayName}</div>
                                      <div className="text-sm text-gray-600">{user.position} • {user.department}</div>
                                      <div className="text-xs text-gray-500">ID: {user.employeeId}</div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="px-4 py-2 text-xs font-medium bg-blue-600 text-gray-700 rounded-lg hover:bg-blue-700 transition-colors"
                                  >
                                    Add to Team
                                  </button>
                                </div>
                              </div>
                            ))}
                          {searchResults.filter(user => !editForm.members.includes(user.clerkUserId)).length === 0 && (
                            <div className="p-4 text-center text-gray-500 bg-gray-50">
                              <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <p className="text-sm">All available users are already in the team</p>
                            </div>
                          )}
                        </div>
                      ) : editMemberSearch && (
                        <div className="mt-3 p-4 text-center text-gray-500 bg-gray-50 rounded-xl">
                          <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <p className="text-sm">No users found matching &quot;{editMemberSearch}&quot;</p>
                        </div>
                      )}
                      
                      {/* Quick Selection Hint */}
                      {!editMemberSearch && editForm.members.length === 0 && (
                        <div className="text-xs text-gray-500">
                          Start typing to search for team members. You can search by name, position, or department.
                        </div>
                      )}
                    </div>
                    
                    {/* Current Members Display */}
                    {editForm.members.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">
                            Current Team Members ({editForm.members.length})
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {editForm.members.map((memberId) => {
                            const user = allUsers.find(u => u.clerkUserId === memberId);
                            const isLeader = memberId === editForm.teamLeaderId;
                            
                            return (
                              <div
                                key={memberId}
                                className={`p-3 rounded-lg border transition-all duration-200 ${
                                  isLeader 
                                    ? 'bg-blue-50 border-blue-200' 
                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                      isLeader 
                                        ? 'bg-blue-100' 
                                        : 'bg-gray-200'
                                    }`}>
                                      {isLeader ? (
                                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      ) : (
                                        <span className="text-sm font-semibold text-gray-700">
                                          {user ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2">
                                        <div className={`font-medium truncate ${
                                          isLeader ? 'text-blue-900' : 'text-gray-900'
                                        }`}>
                                          {user ? user.displayName : (
                                            <span className="flex items-center space-x-2">
                                              <span>{memberId.substring(0, 8)}...</span>
                                              {!user && (
                                                <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
                                              )}
                                            </span>
                                          )}
                                        </div>
                                        {isLeader && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            Leader
                                          </span>
                                        )}
                                      </div>
                                      {user ? (
                                        <div className={`text-sm truncate ${
                                          isLeader ? 'text-blue-700' : 'text-gray-600'
                                        }`}>
                                          {user.position} • {user.department}
                                        </div>
                                      ) : (
                                        <div className="text-sm text-gray-400 italic">
                                          Loading user data...
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {!isLeader && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditForm({
                                          ...editForm,
                                          members: editForm.members.filter(id => id !== memberId)
                                        });
                                      }}
                                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedTeam(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isEditing || !editForm.name || !editForm.department || !editForm.teamLeaderId}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Updating Team...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Update Team</span>
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Team Details Modal */}
      {showTeamDetails && selectedTeam && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-0 border w-full max-w-6xl shadow-2xl rounded-2xl bg-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <UserGroupIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedTeam.name}</h3>
                  <p className="text-sm text-gray-600">{selectedTeam.department} • {selectedTeam.members.length} members</p>
                </div>
              </div>
                <button
                  onClick={() => setShowTeamDetails(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Team Information */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Team Information</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                        <p className="text-gray-900 font-medium">{selectedTeam.name}</p>
            </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {selectedTeam.department}
                        </span>
          </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <p className="text-gray-900">{selectedTeam.description || 'No description provided'}</p>
        </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                        <p className="text-gray-900">{safeFormatDate(selectedTeam.createdAt, 'MM/dd/yyyy')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Team Members ({selectedTeam.members.length})</h4>
                      <button
                        onClick={() => {
                          setShowTeamDetails(false);
                          handleEditTeam(selectedTeam);
                        }}
                        className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        Edit Members
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {selectedTeam.members.map((memberId) => {
                        const user = allUsers.find(u => u.clerkUserId === memberId);
                        const isLeader = memberId === selectedTeam.teamLeaderId;
                        
                        return (
                          <div
                            key={memberId}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              isLeader 
                                ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' 
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isLeader 
                                  ? 'bg-blue-100' 
                                  : 'bg-gray-200'
                              }`}>
                                {isLeader ? (
                                  <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                ) : (
                                  <span className="text-sm font-semibold text-gray-700">
                                    {user ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <div className={`font-medium ${
                                    isLeader ? 'text-blue-900' : 'text-gray-900'
                                  }`}>
                                    {user ? user.displayName : (
                                      <span className="flex items-center space-x-2">
                                        <span>{memberId.substring(0, 8)}...</span>
                                        {!user && (
                                          <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                  {isLeader && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      👑 Team Leader
                                    </span>
                                  )}
                                </div>
                                {user ? (
                                  <div className={`text-sm ${
                                    isLeader ? 'text-blue-700' : 'text-gray-600'
                                  }`}>
                                    {user.position} • {user.department}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-400 italic">
                                    Loading user data...
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {user && (
                                <>
                                  <p className="text-xs text-gray-500">ID: {user.employeeId}</p>
                                  {/* Show attendance and leave info only for team leaders */}
                                  {isTeamLeader && (
                                    <div className="mt-2 space-y-1">
                                      <div className="text-xs text-gray-600">
                                        <span className="font-medium">Days Present:</span> 0
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        <span className="font-medium">Pending Leaves:</span> 0
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Team Statistics */}
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Team Statistics</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Members</span>
                        <span className="text-lg font-semibold text-gray-900">{selectedTeam.members.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Team Leader</span>
                        <div className="text-sm font-medium text-gray-900">
                          {allUsers.find(u => u.clerkUserId === selectedTeam.teamLeaderId)?.displayName || (
                            <span className="flex items-center space-x-2">
                              <span>{selectedTeam.teamLeaderId.substring(0, 8)}...</span>
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          selectedTeam.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedTeam.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h4>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setShowTeamDetails(false);
                          handleEditTeam(selectedTeam);
                        }}
                        className="w-full px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        Edit Team Details
                      </button>
                      <button
                        onClick={() => {
                          setShowTeamDetails(false);
                          handleDeleteTeam(selectedTeam);
                        }}
                        className="w-full px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Delete Team
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowTeamDetails(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => confirmAction?.()}
        title={confirmTitle}
        message={confirmMessage}
      />
    </div>
  );
}
