'use client';

import { useState } from 'react';
import AdminSubNav from '@/components/admin/AdminSubNav';
import AIPredictionsTab from '@/components/admin/AIPredictionsTab';
import LeaveRiskDashboard from '@/components/hr/LeaveRiskDashboard';
import SmartRiskCalendar from '@/components/hr/SmartRiskCalendar';
import {
  SparklesIcon, CalendarDaysIcon,
  CalendarIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';

export default function PredictiveAIPage() {
  const [activeTab, setActiveTab] = useState<'predictions'|'holidays'|'calendar'>('predictions');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="page-hero relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[120px] opacity-20 pointer-events-none" style={{background:'radial-gradient(circle,rgba(52,211,153,0.35),transparent)'}} />
        <div className="absolute bottom-0 left-0 w-52 h-52 rounded-full blur-[80px] opacity-15 pointer-events-none" style={{background:'radial-gradient(circle,rgba(167,139,250,0.3),transparent)'}} />
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-2">
            <div className="p-3 rounded-xl" style={{background:'var(--accent-muted)',border:'1px solid rgba(52,211,153,0.15)',boxShadow:'0 0 20px rgba(52,211,153,0.1)'}}>
              <SparklesIcon className="w-7 h-7 text-[var(--accent)]" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] tracking-tight">Predictive AI Studio</h1>
          </div>
          <p className="text-[var(--text-secondary)] max-w-2xl text-[14px] ml-16">
            ML-powered workforce analytics, holiday risk intelligence, and a full 1-year risk calendar to anticipate disruptions before they happen.
          </p>
        </div>
      </div>

      {/* Tab Nav */}
      <AdminSubNav
        title=""
        items={[
          { id:'predictions', label:'AI Predictions', href:'#', icon:<CpuChipIcon className="w-4 h-4" /> },
          { id:'holidays',    label:'Risk Dashboard', href:'#', icon:<CalendarDaysIcon className="w-4 h-4" /> },
          { id:'calendar',    label:'Smart Risk Calendar', href:'#', icon:<CalendarIcon className="w-4 h-4" /> },
        ]}
        variant="tabs"
        onItemClick={(id)=>setActiveTab(id as typeof activeTab)}
        activeItem={activeTab}
      />

      {/* ══ TAB 1: AI Predictions ══ */}
      {activeTab === 'predictions' && (
        <div className="animate-fade-in">
          <AIPredictionsTab />
        </div>
      )}

      {/* ══ TAB 2: Monthly Intelligence ══ */}
      {activeTab === 'holidays' && (
        <div className="animate-fade-in">
          <LeaveRiskDashboard />
        </div>
      )}

      {/* ══ TAB 3: Annual Risk Calendar ══ */}
      {activeTab === 'calendar' && (
        <div className="animate-fade-in">
          <SmartRiskCalendar />
        </div>
      )}
    </div>
  );
}
