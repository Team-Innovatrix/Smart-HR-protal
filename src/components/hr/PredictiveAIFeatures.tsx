'use client';

import { 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  CalendarDaysIcon, 
  ArrowTrendingUpIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface PredictiveAIFeaturesProps {
  userId: string;
}

export default function PredictiveAIFeatures({ userId }: PredictiveAIFeaturesProps) {
  // In a real app, these values would come from an AI/ML backend model (e.g. LangGraph / OpenAI)
  const predictions = [
    {
      id: 'turnover',
      title: 'Turnover Risk Prediction',
      value: 'Low (4.2%)',
      description: 'Based on recent engagement metrics and attendance patterns, team retention looks stable.',
      icon: ExclamationTriangleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      gradient: 'from-green-50 to-emerald-50'
    },
    {
      id: 'performance',
      title: 'Performance Forecast',
      value: '+12% Expected',
      description: 'Current productivity trends suggest a strong upward trajectory for the upcoming quarter.',
      icon: ArrowTrendingUpIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      gradient: 'from-blue-50 to-indigo-50'
    },
    {
      id: 'leave',
      title: 'Leave Pattern Analysis',
      value: 'High Volatility Expected',
      description: 'Historical data predicts a 45% surge in leave requests over the next 6 weeks. Advance planning recommended.',
      icon: CalendarDaysIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      gradient: 'from-orange-50 to-red-50'
    },
    {
      id: 'capacity',
      title: 'Workforce Capacity',
      value: 'Optimized',
      description: 'Current workload distribution matches team capacity with 92% efficiency.',
      icon: ChartBarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      gradient: 'from-purple-50 to-fuchsia-50'
    }
  ];

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-indigo-100 relative overflow-hidden mb-8 mt-8">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-5 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
      
      <div className="relative z-10 p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <SparklesIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              AI Predictive Insights
            </h2>
            <p className="text-sm text-gray-500">Machine learning forecasts based on your workspace data</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {predictions.map((pred) => (
            <div key={pred.id} className={`p-5 rounded-xl bg-gradient-to-br ${pred.gradient} border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 group`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${pred.bgColor}`}>
                  <pred.icon className={`h-5 w-5 ${pred.color}`} />
                </div>
                <span className={`text-sm font-bold ${pred.color}`}>{pred.value}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 truncate">{pred.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed group-hover:text-gray-900 transition-colors">
                {pred.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
