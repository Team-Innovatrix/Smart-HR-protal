'use client';

import { useState, useEffect } from 'react';
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
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useTimezone } from '../../lib/hooks/useTimezone';

interface TeamMember {
  _id: string;
  clerkUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  department: string;
  position: string;
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  teamLeaderId: TeamMember;
  members: TeamMember[];
  department?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TeamsProps {
  userId: string;
}

const Teams: React.FC<TeamsProps> = ({ userId }) => {
  const { formatDateString } = useTimezone();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/teams?userId=${userId}`);
        const data = await response.json();
        
        if (data.success) {
          setTeams(data.data);
        } else {
          setError(data.message || 'Failed to fetch teams');
        }
      } catch (err) {
        setError('Failed to fetch teams');
        console.error('Error fetching teams:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchTeams();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-12 text-center relative overflow-hidden">
        {/* Modern zigzag pattern decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 opacity-5">
          <div className="absolute top-0 right-0 w-20 h-4 bg-gradient-to-r from-red-500 to-rose-600 transform rotate-12"></div>
          <div className="absolute top-4 right-4 w-16 h-4 bg-gradient-to-r from-orange-500 to-red-600 transform -rotate-12"></div>
          <div className="absolute top-8 right-8 w-12 h-4 bg-gradient-to-r from-pink-500 to-rose-600 transform rotate-12"></div>
          <div className="absolute top-12 right-12 w-8 h-4 bg-gradient-to-r from-red-500 to-pink-600 transform -rotate-12"></div>
        </div>
        <div className="relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <UsersIcon className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Error Loading Teams</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-12 text-center relative overflow-hidden">
        {/* Modern triangular pattern decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 opacity-5">
          <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-b-[20px] border-b-blue-500"></div>
          <div className="absolute top-4 right-4 w-0 h-0 border-l-[16px] border-l-transparent border-b-[16px] border-b-indigo-500"></div>
          <div className="absolute top-8 right-8 w-0 h-0 border-l-[12px] border-l-transparent border-b-[12px] border-b-purple-500"></div>
        </div>
        <div className="relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <UsersIcon className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">No Teams Found</h3>
          <p className="text-gray-600">You are not part of any teams yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        {/* Modern diagonal pattern decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 opacity-5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 transform rotate-12 rounded-lg"></div>
          <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 transform -rotate-12 rounded-lg"></div>
          <div className="absolute top-8 right-8 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 transform rotate-45 rounded-lg"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <UsersIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Teams</h2>
                <p className="text-gray-600">View your team members and team information</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200/50">
                {teams.length} team{teams.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid gap-8 md:grid-cols-2">
        {teams.map((team) => (
          <div
            key={team._id}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 relative overflow-hidden group hover:shadow-xl transition-all duration-300"
          >
            {/* Modern hexagonal pattern decoration */}
            <div className="absolute top-0 right-0 w-40 h-40 opacity-5">
              <div className="absolute top-2 right-2 w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 transform rotate-45 rounded-lg"></div>
              <div className="absolute top-6 right-6 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 transform -rotate-45 rounded-lg"></div>
              <div className="absolute top-10 right-10 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 transform rotate-12 rounded-lg"></div>
            </div>
            {/* Team Header */}
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <UsersIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-xl">{team.name}</h3>
                    {team.description && (
                      <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                    )}
                  </div>
                </div>
                {team.department && (
                  <div className="flex items-center gap-1 text-sm text-gray-500 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200/50">
                    <ChartBarIcon className="w-4 h-4" />
                    <span>{team.department}</span>
                  </div>
                )}
              </div>

              {/* Team Leader */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <UserIcon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-blue-900">Team Leader</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-sm">
                      {team.teamLeaderId.firstName[0]}{team.teamLeaderId.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {team.teamLeaderId.firstName} {team.teamLeaderId.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{team.teamLeaderId.position}</p>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                    <UsersIcon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    Team Members ({team.members.length})
                  </span>
                </div>
                <div className="space-y-3">
                  {team.members.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:bg-white/80 transition-all duration-200"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-xs">
                          {member.firstName[0]}{member.lastName[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {member.position} • {member.department}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={`mailto:${member.email}`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Send email"
                        >
                          <UserPlusIcon className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Stats */}
              <div className="pt-6 border-t border-gray-200/50">
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
                    <div className="font-bold text-gray-900 text-lg">{team.members.length}</div>
                    <div className="text-gray-600 font-medium">Members</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                    <div className="font-bold text-gray-900 text-lg">
                      {safeFormatDate(team.createdAt, 'MMM yyyy')}
                    </div>
                    <div className="text-gray-600 font-medium">Created</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Teams;
