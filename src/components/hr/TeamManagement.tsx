'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  UsersIcon, 
  UserIcon, 
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
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';


interface TeamMember {
  id: string;
  clerkUserId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  joinDate: string;
  status: 'active' | 'inactive';
  teamName?: string; // Add team name for All Members view
  // Derived/example fields below are optional; can be improved later with more APIs
  attendance?: {
    today: 'present' | 'absent' | 'half-day' | 'not-marked';
    thisMonth: number;
    totalDays: number;
  };
  leaves?: {
    pending: number;
    approved: number;
    rejected: number;
    balance: {
      sick: number;
      casual: number;
      annual: number;
    };
  };
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  teamLeaderId: {
    _id: string;
    clerkUserId: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
    position: string;
    department: string;
  };
  members: {
    _id: string;
    clerkUserId: string;
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
    position: string;
    department: string;
  }[];
  department?: string;
  isActive: boolean;
  createdAt: string;
}

interface TeamManagementProps {
  userId: string;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ userId }) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [activeView, setActiveView] = useState<'all' | 'teams'>('all');
  const [isTeamLeader, setIsTeamLeader] = useState(false);

  // Load teams and team members from MongoDB via API
  useEffect(() => {
    const load = async () => {
      let timeoutId: NodeJS.Timeout | null = null;
      
      try {
        // setLoading(true); // Removed to prevent mobile loading issues
        console.log('TeamManagement: Starting to load data for userId:', userId);
        
        // Simple timeout to prevent hanging
        timeoutId = setTimeout(() => {
          console.log('TeamManagement: Timeout reached, setting loading to false');
          // setLoading(false); // Removed to prevent mobile loading issues
        }, 10000); // 10 second timeout
        
        // Fetch teams where user is a member or team leader
        const teamsRes = await fetch(`/api/teams?userId=${userId}`);
        console.log('TeamManagement: API response status:', teamsRes.status);
        if (!teamsRes.ok) {
          throw new Error(`HTTP ${teamsRes.status}: ${teamsRes.statusText}`);
        }
        const teamsData = await teamsRes.json();
        console.log('TeamManagement: API response data:', teamsData);
        
        // Clear timeout if request succeeds
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        if (teamsData.success && Array.isArray(teamsData.data)) {
          setTeams(teamsData.data);
          
          // Check if current user is a team leader of any team
          const userIsTeamLeader = teamsData.data.some((team: Team) => 
            team.teamLeaderId && typeof team.teamLeaderId === 'object' && 
            (team.teamLeaderId as any).clerkUserId === userId
          );
          setIsTeamLeader(userIsTeamLeader);
          
          // Extract all team members from all teams the user is part of
          const allTeamMembers = new Map<string, TeamMember>();
          
          teamsData.data.forEach((team: Team) => {
            // Add team leader if they're not already added
            if (team.teamLeaderId && typeof team.teamLeaderId === 'object') {
              const leader = team.teamLeaderId as any;
              const leaderKey = leader.clerkUserId;
              
              if (!allTeamMembers.has(leaderKey)) {
                allTeamMembers.set(leaderKey, {
                  id: leader._id?.toString?.() || leader.clerkUserId,
                  clerkUserId: leader.clerkUserId,
                  employeeId: leader.employeeId,
                  firstName: leader.firstName,
                  lastName: leader.lastName,
                  email: leader.email,
                  department: leader.department || 'General',
                  position: leader.position || 'Employee',
                  joinDate: new Date().toISOString(), // Default date
                  status: 'active',
                  teamName: team.name,
                  attendance: { today: 'not-marked', thisMonth: 0, totalDays: 0 },
                  leaves: { pending: 0, approved: 0, rejected: 0, balance: { sick: 0, casual: 0, annual: 0 } }
                });
              } else {
                // If user is in multiple teams, append team name
                const existingMember = allTeamMembers.get(leaderKey)!;
                if (!existingMember.teamName?.includes(team.name)) {
                  existingMember.teamName = existingMember.teamName 
                    ? `${existingMember.teamName}, ${team.name}`
                    : team.name;
                }
              }
            }
            
            // Add team members
            if (Array.isArray(team.members)) {
              team.members.forEach((member: any) => {
                if (member && typeof member === 'object' && member.clerkUserId) {
                  const memberKey = member.clerkUserId;
                  
                  if (!allTeamMembers.has(memberKey)) {
                    allTeamMembers.set(memberKey, {
                      id: member._id?.toString?.() || member.clerkUserId,
                      clerkUserId: member.clerkUserId,
                      employeeId: member.employeeId,
                      firstName: member.firstName,
                      lastName: member.lastName,
                      email: member.email,
                      department: member.department || 'General',
                      position: member.position || 'Employee',
                      joinDate: new Date().toISOString(), // Default date
                      status: 'active',
                      teamName: team.name,
                      attendance: { today: 'not-marked', thisMonth: 0, totalDays: 0 },
                      leaves: { pending: 0, approved: 0, rejected: 0, balance: { sick: 0, casual: 0, annual: 0 } }
                    });
                  } else {
                    // If user is in multiple teams, append team name
                    const existingMember = allTeamMembers.get(memberKey)!;
                    if (!existingMember.teamName?.includes(team.name)) {
                      existingMember.teamName = existingMember.teamName 
                        ? `${existingMember.teamName}, ${team.name}`
                        : team.name;
                    }
                  }
                }
              });
            }
          });
          
          // Convert map to array
          const membersArray = Array.from(allTeamMembers.values());
          setTeamMembers(membersArray);
          
          // Fetch real attendance and leave data for team members
          await fetchTeamMemberStats(membersArray);
          
        } else {
          setTeams([]);
          setTeamMembers([]);
        }
      } catch (e) {
        console.error('Error loading data:', e);
        setTeams([]);
        setTeamMembers([]);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      } finally {
        // setLoading(false); // Removed to prevent mobile loading issues
      }
    };
    load();
  }, [userId]);

  // Fetch attendance and leave statistics for team members
  const fetchTeamMemberStats = async (members: TeamMember[]) => {
    try {
      const memberIds = members.map(member => member.clerkUserId);
      
      // Fetch attendance data for current month
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const startDateString = startOfMonth.toISOString().split('T')[0];
      const endDateString = endOfMonth.toISOString().split('T')[0];
      
      // Fetch attendance data
      const attendanceRes = await fetch(`/api/attendance/team?startDate=${startDateString}&endDate=${endDateString}`);
      const attendanceData = await attendanceRes.json();
      
      // Fetch leave data
      const leaveRes = await fetch(`/api/leaves/team?status=pending`);
      const leaveData = await leaveRes.json();
      
      // Process attendance data
      const attendanceMap = new Map();
      if (attendanceData.success && Array.isArray(attendanceData.data)) {
        attendanceData.data.forEach((record: any) => {
          const userId = record.userId;
          if (!attendanceMap.has(userId)) {
            attendanceMap.set(userId, {
              presentDays: 0,
              totalDays: 0,
              todayStatus: 'not-marked'
            });
          }
          
          const stats = attendanceMap.get(userId);
          stats.totalDays++;
          
          // Only count "present", "full-day", or "regularized" as actual present days
          if (['present', 'full-day', 'regularized'].includes(record.status)) {
            stats.presentDays++;
          }
          
          // Check if this is today's record
          const today = new Date().toISOString().split('T')[0];
          if (record.date === today) {
            stats.todayStatus = record.status;
          }
        });
      }
      
      // Process leave data
      const leaveMap = new Map();
      if (leaveData.success && Array.isArray(leaveData.data)) {
        leaveData.data.forEach((leave: any) => {
          const userId = leave.userId;
          if (!leaveMap.has(userId)) {
            leaveMap.set(userId, { pending: 0, approved: 0, rejected: 0 });
          }
          
          const stats = leaveMap.get(userId);
          if (leave.status === 'pending') stats.pending++;
          else if (leave.status === 'approved') stats.approved++;
          else if (leave.status === 'rejected') stats.rejected++;
        });
      }
      
      // Update team members with real data
      setTeamMembers(prevMembers => 
        prevMembers.map(member => {
          const attendanceStats = attendanceMap.get(member.clerkUserId) || { presentDays: 0, totalDays: 0, todayStatus: 'not-marked' };
          const leaveStats = leaveMap.get(member.clerkUserId) || { pending: 0, approved: 0, rejected: 0 };
          
          return {
            ...member,
            attendance: {
              today: attendanceStats.todayStatus,
              thisMonth: attendanceStats.presentDays,
              totalDays: attendanceStats.totalDays
            },
            leaves: {
              pending: leaveStats.pending,
              approved: leaveStats.approved,
              rejected: leaveStats.rejected,
              balance: { sick: 0, casual: 0, annual: 0 } // This would need separate API call
            }
          };
        })
      );
      
    } catch (error) {
      console.error('Error fetching team member stats:', error);
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && member.status === 'active') ||
      (filter === 'attendance' && member.attendance?.today === 'absent') ||
      (filter === 'leaves' && ((member.leaves?.pending ?? 0) > 0));
    
    const matchesSearch = member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.department.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (team.department && team.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      team.teamLeaderId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.teamLeaderId.lastName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <ShieldCheckIcon className="w-4 h-4 text-green-600" />;
      case 'absent':
        return <TrashIcon className="w-4 h-4 text-red-600" />;
      case 'half-day':
        return <FunnelIcon className="w-4 h-4 text-yellow-600" />;
      case 'holiday':
        return <CalendarIcon className="w-4 h-4 text-purple-600" />;
      case 'weekly-off':
        return <CalendarIcon className="w-4 h-4 text-indigo-600" />;
      case 'late':
        return <ExclamationTriangleIcon className="w-4 h-4 text-orange-600" />;
      case 'early-leave':
        return <ExclamationTriangleIcon className="w-4 h-4 text-blue-600" />;
      default:
        return <UserIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getAttendanceText = (status: string) => {
    switch (status) {
      case 'present':
        return 'Present';
      case 'absent':
        return 'Absent';
      case 'half-day':
        return 'Half Day';
      case 'holiday':
        return 'Holiday';
      case 'weekly-off':
        return 'Weekly Off';
      case 'late':
        return 'Late';
      case 'early-leave':
        return 'Early Leave';
      default:
        return 'Not Marked';
    }
  };

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'text-green-600 bg-green-50';
      case 'absent':
        return 'text-red-600 bg-red-50';
      case 'half-day':
        return 'text-yellow-600 bg-yellow-50';
      case 'holiday':
        return 'text-purple-600 bg-purple-50';
      case 'weekly-off':
        return 'text-indigo-600 bg-indigo-50';
      case 'late':
        return 'text-orange-600 bg-orange-50';
      case 'early-leave':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const calculateAttendancePercentage = (attended: number, total: number) => {
    return total > 0 ? Math.round((attended / total) * 100) : 0;
  };

  // Loading state removed to prevent mobile loading issues
  // if (loading) {
  //   console.log('TeamManagement: Rendering loading state');
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

  // Show message if no team members found
  if (teamMembers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
          </div>
        </div>
        
        <div className="text-center py-12">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No team members found</h3>
          <p className="mt-1 text-sm text-gray-500">
            You are not currently a member of any teams, or no teams have been created yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* View Toggle and Search */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            {/* Modern geometric decoration - hidden on mobile */}
            <div className="absolute top-0 right-0 w-40 h-40 opacity-5 hidden sm:block">
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg rotate-45"></div>
              <div className="absolute top-8 right-8 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full"></div>
              <div className="absolute top-12 right-12 w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full"></div>
            </div>

            <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setFilter('all');
                  setActiveView('all');
                }}
                    className={`px-3 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
                      activeView === 'all'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                        : 'bg-white/60 backdrop-blur-sm text-gray-700 hover:bg-white/80 border border-gray-200/50'
                }`}
              >
                Team Members
              </button>
              <button
                    onClick={() => setActiveView('teams')}
                    className={`px-3 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${
                      activeView === 'teams'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                        : 'bg-white/60 backdrop-blur-sm text-gray-700 hover:bg-white/80 border border-gray-200/50'
                    }`}
                  >
                    Team Overview
              </button>
            </div>
            <div className="flex-1 sm:max-w-xs">
              <input
                type="text"
                placeholder={activeView === 'teams' ? "Search teams..." : "Search members..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium border border-gray-200/50 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 placeholder:text-gray-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-500 bg-white/60 backdrop-blur-sm px-2 py-1 sm:px-3 rounded-full border border-gray-200/50">
                {activeView === 'teams' 
                  ? `${filteredTeams.length} of ${teams.length} teams`
                  : `${filteredMembers.length} of ${teamMembers.length} members`
                }
              </span>
            </div>
          </div>
            </div>
        </div>

      {/* Team Overview Tab */}
      {activeView === 'teams' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-8 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          {/* Modern diagonal pattern decoration - hidden on mobile */}
          <div className="absolute top-0 right-0 w-40 h-40 opacity-5 hidden sm:block">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 transform rotate-12 rounded-lg"></div>
            <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 transform -rotate-12 rounded-lg"></div>
            <div className="absolute top-8 right-8 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 transform rotate-45 rounded-lg"></div>
          </div>
          
          <div className="relative z-10">
            {filteredTeams.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <UsersIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No teams found</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  {searchTerm ? 'Try adjusting your search terms' : 'No teams are available'}
                </p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {filteredTeams.map((team) => (
                <div key={team._id} className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-gray-200/50 p-4 sm:p-6 hover:shadow-lg transition-all duration-200">
                  {/* Team Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 gap-3 sm:gap-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                        <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base sm:text-lg">{team.name}</h3>
                        {team.description && (
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">{team.description}</p>
                        )}
                      </div>
                    </div>
                    {team.department && (
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 bg-white/60 backdrop-blur-sm px-2 py-1 sm:px-3 rounded-full border border-gray-200/50">
                        <ChartBarIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{team.department}</span>
                      </div>
                    )}
                  </div>

                  {/* Team Leader */}
                  <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl border border-blue-200/50">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <UserIcon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-blue-900">Team Leader</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-xs sm:text-sm">
                          {team.teamLeaderId.firstName[0]}{team.teamLeaderId.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">
                          {team.teamLeaderId.firstName} {team.teamLeaderId.lastName}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">{team.teamLeaderId.position}</p>
                      </div>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                        <UsersIcon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-700">
                        Team Members ({team.members.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {team.members.slice(0, 3).map((member) => (
                        <div
                          key={member._id}
                          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl border border-gray-200/50 hover:bg-white/80 transition-all duration-200"
                        >
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm">
                            <span className="text-white font-bold text-xs">
                              {member.firstName[0]}{member.lastName[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-xs text-gray-600 truncate">
                              {member.position} • {member.department}
                            </p>
                          </div>
                        </div>
                      ))}
                      {team.members.length > 3 && (
                        <div className="text-center py-1 sm:py-2">
                          <span className="text-xs sm:text-sm text-gray-500">
                            +{team.members.length - 3} more members
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Team Stats */}
                  <div className="pt-3 sm:pt-4 border-t border-gray-200/50">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div className="text-center p-2 sm:p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg sm:rounded-xl border border-green-200/50">
                        <div className="font-bold text-gray-900 text-base sm:text-lg">{team.members.length}</div>
                        <div className="text-gray-600 font-medium">Members</div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl border border-blue-200/50">
                        <div className="font-bold text-gray-900 text-base sm:text-lg">
                          {format(new Date(team.createdAt), 'MMM yyyy')}
                        </div>
                        <div className="text-gray-600 font-medium">Created</div>
                      </div>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team Members Grid Tab */}
      {activeView === 'all' && (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => (
              <div
                 key={member.id}
                className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => {
                  setSelectedMember(member);
                  setShowMemberDetails(true);
                }}
              >
                {/* Modern wave pattern decoration - hidden on mobile */}
                <div className="absolute top-0 right-0 w-40 h-40 opacity-5 overflow-hidden hidden sm:block">
                  <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full"></div>
                  <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full"></div>
                  <div className="absolute top-6 right-6 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full"></div>
                </div>
                {/* Member Header */}
                <div className="relative z-10">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm sm:text-lg">
                        {member.firstName[0]}{member.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                        {member.firstName} {member.lastName}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">{member.employeeId}</p>
                      {member.teamName && (
                        <div className="mt-1">
                          <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full font-medium">
                            {member.teamName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {member.status === 'active' ? (
                      <ShieldCheckIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    ) : (
                      <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    )}
                    </div>
                  </div>
                </div>

                {/* Member Details */}
                <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                  <div className="text-xs sm:text-sm">
                    <span className="text-gray-500">Position:</span>
                    <span className="ml-2 text-gray-900">{member.position}</span>
                  </div>
                  <div className="text-xs sm:text-sm">
                    <span className="text-gray-500">Department:</span>
                    <span className="ml-2 text-gray-900">{member.department}</span>
                  </div>
                  <div className="text-xs sm:text-sm">
                    <span className="text-gray-500">Joined:</span>
                    <span className="ml-2 text-gray-900">
                      {format(new Date(member.joinDate), 'MMM yyyy')}
                    </span>
                  </div>
                </div>

                {/* Today's Status */}
                <div className="mb-3 sm:mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Today&apos;s Status</span>
                    {getAttendanceIcon(member.attendance?.today || 'not-marked')}
                  </div>
                  <div className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium ${getAttendanceColor(member.attendance?.today || 'not-marked')}`}>
                    {getAttendanceText(member.attendance?.today || 'not-marked')}
                  </div>
                </div>

                {/* Quick Stats - Only show for team leaders */}
                {isTeamLeader && (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="text-center">
                       <div className="font-semibold text-gray-900">{member.attendance?.thisMonth ?? 0}</div>
                      <div className="text-gray-500">Days Present</div>
                    </div>
                    <div className="text-center">
                       <div className="font-semibold text-gray-900">{member.leaves?.pending ?? 0}</div>
                      <div className="text-gray-500">Pending Leaves</div>
                    </div>
                  </div>
                )}

                {/* View Details Button */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                  <button className="w-full flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">
                    <UserIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    View Details
                  </button>
                </div>
              </div>
          ))}
        </div>
      )}


      {/* No Results - Only show for team members tab */}
      {activeView === 'all' && filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'Try changing your filters'}
          </p>
        </div>
      )}

      {/* Member Details Modal */}
      {showMemberDetails && selectedMember && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowMemberDetails(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedMember.firstName} {selectedMember.lastName}
                </h2>
                <button
                  onClick={() => setShowMemberDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Personal Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Employee ID:</span>
                      <span className="ml-2 text-gray-900">{selectedMember.employeeId}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 text-gray-900">{selectedMember.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Position:</span>
                      <span className="ml-2 text-gray-900">{selectedMember.position}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Department:</span>
                      <span className="ml-2 text-gray-900">{selectedMember.department}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Join Date:</span>
                      <span className="ml-2 text-gray-900">
                        {format(new Date(selectedMember.joinDate), 'MMMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Attendance Summary */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Attendance Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">This Month:</span>
                      <span className="font-semibold">
                        {(selectedMember.attendance?.thisMonth ?? 0)}/{(selectedMember.attendance?.totalDays ?? 0)} days
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Attendance Rate:</span>
                      <span className="font-semibold">
                        {calculateAttendancePercentage((selectedMember.attendance?.thisMonth ?? 0), (selectedMember.attendance?.totalDays ?? 0))}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Today&apos;s Status:</span>
                      <div className="flex items-center gap-2">
                        {getAttendanceIcon(selectedMember.attendance?.today || 'not-marked')}
                        <span className="font-medium">
                          {getAttendanceText(selectedMember.attendance?.today || 'not-marked')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Leave Requests - Only show for team leaders */}
                {isTeamLeader && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Leave Requests</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Pending:</span>
                        <span className="font-semibold text-yellow-600">{selectedMember.leaves?.pending ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Approved:</span>
                        <span className="font-semibold text-green-600">{selectedMember.leaves?.approved ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Rejected:</span>
                        <span className="font-semibold text-red-600">{selectedMember.leaves?.rejected ?? 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-100">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  View Full Profile
                </button>
                <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
