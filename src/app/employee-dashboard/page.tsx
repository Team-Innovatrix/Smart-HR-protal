'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  BellAlertIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  ClockIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function EmployeeDashboard() {
  const [greeting, setGreeting] = useState('Welcome');
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      const hour = now.getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-200">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] rounded-full bg-teal-500/10 blur-[100px]" />
        <div className="absolute top-[40%] left-[60%] w-80 h-80 rounded-full bg-orange-500/10 blur-[100px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 border border-slate-200 shadow-sm backdrop-blur-md mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-600 tracking-wide uppercase">Employee Portal</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
              {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Sarah</span> 👋
            </h1>
            <p className="mt-2 text-slate-500 font-medium">Ready to conquer the day? Here is what is happening.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
              <p className="text-3xl font-black text-slate-800 tabular-nums">{time}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border-2 border-white relative group cursor-pointer">
              <img src="https://i.pravatar.cc/150?img=47" alt="Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl"></div>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Stats & Actions (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Stat Card 1 */}
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-xl shadow-indigo-100/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                  <ClockIcon className="w-6 h-6" />
                </div>
                <p className="text-slate-500 font-semibold text-sm">Hours Tracked</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-black text-slate-900">38.5</h3>
                  <span className="text-sm font-medium text-emerald-500">+2.5h</span>
                </div>
              </div>

              {/* Stat Card 2 */}
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-xl shadow-teal-100/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-500/20 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mb-4">
                  <CalendarDaysIcon className="w-6 h-6" />
                </div>
                <p className="text-slate-500 font-semibold text-sm">Leave Balance</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-black text-slate-900">12</h3>
                  <span className="text-sm font-medium text-slate-400">days left</span>
                </div>
              </div>

              {/* Stat Card 3 */}
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-xl shadow-orange-100/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/20 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                  <CheckBadgeIcon className="w-6 h-6" />
                </div>
                <p className="text-slate-500 font-semibold text-sm">Tasks Completed</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-black text-slate-900">24</h3>
                  <span className="text-sm font-medium text-emerald-500">↑ 12%</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-gradient-to-br from-indigo-900 to-violet-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-teal-400/20 rounded-full blur-2xl"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Need to request time off?</h2>
                  <p className="text-indigo-200 max-w-md">Apply for leave, check holiday calendars, or view your past leave history all in one place.</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  <button className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-white text-indigo-900 font-bold hover:bg-indigo-50 hover:scale-105 transition-all duration-300 shadow-lg shadow-white/10">
                    Apply Leave
                  </button>
                  <button className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-indigo-800 text-white font-bold border border-indigo-700 hover:bg-indigo-700 hover:scale-105 transition-all duration-300">
                    View Policy
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity / Projects */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-xl shadow-slate-200/50">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Current Projects</h2>
                <button className="text-indigo-600 font-semibold text-sm hover:text-indigo-800 transition-colors">View All</button>
              </div>
              
              <div className="space-y-4">
                {[
                  { name: 'Website Redesign', progress: 75, color: 'bg-indigo-500', icon: SparklesIcon },
                  { name: 'Q3 Marketing Campaign', progress: 40, color: 'bg-teal-500', icon: ChartBarIcon },
                  { name: 'Client Presentation', progress: 90, color: 'bg-orange-500', icon: BriefcaseIcon }
                ].map((project, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${project.color} bg-opacity-10 text-${project.color.split('-')[1]}-600`}>
                      <project.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <h4 className="font-semibold text-slate-900">{project.name}</h4>
                        <span className="text-sm font-bold text-slate-600">{project.progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full ${project.color} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${project.progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Notifications & Profile Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Announcements */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-xl shadow-slate-200/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <BellAlertIcon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Announcements</h2>
              </div>
              
              <div className="space-y-5">
                <div className="relative pl-6 border-l-2 border-indigo-200">
                  <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7px] top-1 ring-4 ring-white"></div>
                  <h4 className="font-bold text-slate-800 text-sm">Townhall Meeting</h4>
                  <p className="text-sm text-slate-500 mt-1">Join us this Friday at 3 PM for the Q2 updates.</p>
                  <span className="text-xs font-semibold text-indigo-500 mt-2 inline-block">2 hours ago</span>
                </div>
                <div className="relative pl-6 border-l-2 border-teal-200">
                  <div className="absolute w-3 h-3 bg-teal-500 rounded-full -left-[7px] top-1 ring-4 ring-white"></div>
                  <h4 className="font-bold text-slate-800 text-sm">New Health Benefits</h4>
                  <p className="text-sm text-slate-500 mt-1">Check out the updated health insurance policy.</p>
                  <span className="text-xs font-semibold text-teal-500 mt-2 inline-block">Yesterday</span>
                </div>
              </div>
            </div>

            {/* Quick Links Menu */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-xl shadow-slate-200/50">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Links</h2>
              <div className="grid grid-cols-2 gap-3">
                <Link href="#" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors group">
                  <DocumentTextIcon className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-sm">Payslips</span>
                </Link>
                <Link href="#" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-700 transition-colors group">
                  <BanknotesIcon className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-sm">Expenses</span>
                </Link>
                <Link href="#" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors group">
                  <UserIcon className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-sm">Directory</span>
                </Link>
                <Link href="#" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors group">
                  <BriefcaseIcon className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-sm">Careers</span>
                </Link>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
