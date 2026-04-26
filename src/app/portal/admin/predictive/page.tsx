'use client';

import BarChart from '@/components/admin/BarChart';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { 
  ArrowTrendingUpIcon, 
  LightBulbIcon, 
  CpuChipIcon,
  ShieldCheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

// AI Analytics empty state for Day 1
const EmptyAIState = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex items-center justify-center h-64 flex-col text-center hover:shadow-xl transition-shadow duration-300">
    <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
      <CpuChipIcon className="w-8 h-8 text-indigo-500 animate-pulse" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
    <p className="text-sm text-gray-500 max-w-sm mx-auto">{subtitle}</p>
    <p className="mt-6 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-2 border border-indigo-100">
      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
      Processing Real-time Data
    </p>
  </div>
);

export default function PredictiveAIPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-2">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <SparklesIcon className="w-8 h-8 text-indigo-200" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Predictive AI Studio</h1>
          </div>
          <p className="text-indigo-200 max-w-2xl text-lg ml-16">
            Leverage enterprise machine learning models to forecast organization trends and prevent disruption before it happens.
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-delay-1">
        <EmptyAIState title="Turnover Prediction" subtitle="AI models are analyzing the new dataset to predict historical turnover baselines vs forecasts." />
        <EmptyAIState title="Performance Forecast" subtitle="Generating predicted performance score models for upcoming quarters." />
        <EmptyAIState title="Leave Pattern Prediction" subtitle="Anticipating employee sick and vacation leaves based on initial trends." />
        <EmptyAIState title="Workforce Capacity AI" subtitle="Processing recent staffing data to predict departmental utilization gaps." />
      </div>
    </div>
  );
}
