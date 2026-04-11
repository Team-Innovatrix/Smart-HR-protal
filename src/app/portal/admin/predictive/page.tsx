'use client';

import BarChart from '@/components/admin/BarChart';
import { SparklesIcon } from '@heroicons/react/24/outline';

const mockTurnoverPredictionData = {
  chartData: [
    { month: 'May 26', predicted: 2, baseline: 3 },
    { month: 'Jun 26', predicted: 3, baseline: 3 },
    { month: 'Jul 26', predicted: 5, baseline: 3 },
    { month: 'Aug 26', predicted: 2, baseline: 4 },
    { month: 'Sep 26', predicted: 1, baseline: 3 },
    { month: 'Oct 26', predicted: 3, baseline: 4 },
  ],
  legend: [
    { key: 'predicted', label: 'Predicted Exits', color: '#E11D48' }, // rose-600
    { key: 'baseline', label: 'Historical Baseline', color: '#94A3B8' } // slate-400
  ]
};

const mockPerformanceForecastData = {
  chartData: [
    { month: 'Q2 2026', score: 85, target: 80 },
    { month: 'Q3 2026', score: 88, target: 82 },
    { month: 'Q4 2026', score: 92, target: 85 },
    { month: 'Q1 2027', score: 95, target: 88 }
  ],
  legend: [
    { key: 'score', label: 'Forecasted Score', color: '#4F46E5' }, // indigo-600
    { key: 'target', label: 'Target Score', color: '#CBD5E1' } // slate-300
  ]
};

const mockLeavePredictionData = {
  chartData: [
    { month: 'May', sick: 12, vacation: 25, personal: 5 },
    { month: 'Jun', sick: 10, vacation: 45, personal: 8 },
    { month: 'Jul', sick: 8, vacation: 85, personal: 10 },
    { month: 'Aug', sick: 15, vacation: 65, personal: 12 },
    { month: 'Sep', sick: 25, vacation: 20, personal: 5 },
    { month: 'Oct', sick: 35, vacation: 15, personal: 8 }
  ],
  legend: [
    { key: 'vacation', label: 'Vacation Surge', color: '#D97706' }, // amber-600
    { key: 'sick', label: 'Sick Leave Trend', color: '#059669' }, // emerald-600
    { key: 'personal', label: 'Personal Time', color: '#3B82F6' } // blue-500
  ]
};

const mockWorkforceCapacityData = {
  chartData: [
    { month: 'Eng', utilized: 85, available: 15 },
    { month: 'Sales', utilized: 95, available: 5 },
    { month: 'Mktg', utilized: 70, available: 30 },
    { month: 'Support', utilized: 90, available: 10 },
    { month: 'HR', utilized: 60, available: 40 }
  ],
  legend: [
    { key: 'utilized', label: 'Predicted Utilization (%)', color: '#059669' }, // emerald-600
    { key: 'available', label: 'Predicted Buffer (%)', color: '#A7F3D0' } // emerald-200
  ]
};

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

      {/* Grid of Predictive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Turnover Prediction widget */}
        <div className="hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden">
          <BarChart
            title="Turnover Prediction"
            subtitle="Historical baseline vs Model forecast (Next 6 Mo)"
            data={mockTurnoverPredictionData.chartData}
            legend={mockTurnoverPredictionData.legend}
            dataKey="month"
            valueKeys={mockTurnoverPredictionData.legend.map(l => l.key)}
            height={260}
            showTotals={true}
            showLegend={true}
            showEmptyBars={true}
            rotateLabels={false}
            barSpacing={16}
          />
        </div>

        {/* Performance Forecast widget */}
        <div className="hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden">
          <BarChart
            title="Performance Forecast"
            subtitle="Predicted organizational performance scores"
            data={mockPerformanceForecastData.chartData}
            legend={mockPerformanceForecastData.legend}
            dataKey="month"
            valueKeys={mockPerformanceForecastData.legend.map(l => l.key)}
            height={260}
            showTotals={true}
            showLegend={true}
            showEmptyBars={true}
            rotateLabels={false}
            barSpacing={16}
          />
        </div>

        {/* Leave Pattern Prediction widget */}
        <div className="hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden">
          <BarChart
            title="Leave Pattern Prediction"
            subtitle="Anticipated volume of employee absences"
            data={mockLeavePredictionData.chartData}
            legend={mockLeavePredictionData.legend}
            dataKey="month"
            valueKeys={mockLeavePredictionData.legend.map(l => l.key)}
            height={260}
            showTotals={true}
            showLegend={true}
            showEmptyBars={true}
            rotateLabels={false}
            barSpacing={16}
          />
        </div>

        {/* Workforce Capacity widget */}
        <div className="hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden">
          <BarChart
            title="Workforce Capacity Optimization"
            subtitle="Predicted team utilization vs buffer capacity"
            data={mockWorkforceCapacityData.chartData}
            legend={mockWorkforceCapacityData.legend}
            dataKey="month"
            valueKeys={mockWorkforceCapacityData.legend.map(l => l.key)}
            height={260}
            showTotals={true}
            showLegend={true}
            showEmptyBars={true}
            rotateLabels={false}
            barSpacing={16}
          />
        </div>

      </div>
    </div>
  );
}
