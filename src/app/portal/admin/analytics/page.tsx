'use client';

import { useState, useEffect } from 'react';
import AdminSubNav, { adminSubNavConfigs } from '@/components/admin/AdminSubNav';
import BarChart, { BarChartData, BarChartLegend } from '@/components/admin/BarChart';
import HorizontalBarChart from '@/components/admin/HorizontalBarChart';
import ClusteredBarChart from '@/components/admin/ClusteredBarChart';
import { 
  ChartBarIcon, 
  ClockIcon, 
  UserGroupIcon, 
  ChartPieIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  ArrowUpIcon,
  LightBulbIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  DocumentCheckIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface ExitsData {
  chartData: Array<{ month: string; [key: string]: any }>;
  legend: Array<{ reason: string; color: string }>;
  totalExits: number;
}

interface HiresData {
  chartData: Array<{ month: string; [key: string]: any }>;
  legend: Array<{ key: string; label: string; color: string }>;
  totalHires: number;
}

interface SeniorityData {
  chartData: Array<{ level: string; count: number }>;
  totalEmployees: number;
  departments: string[];
  selectedDepartment: string;
}

interface AttendanceData {
  chartData: Array<{ month: string; [key: string]: any }>;
  legend: Array<{ key: string; label: string; color: string }>;
  overallAttendance: number;
  departments: string[];
  selectedDepartment: string;
}

interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  postedDate: string;
}

interface JobsData {
  chartData: Array<{ month: string; [key: string]: any }>;
  legend: Array<{ key: string; label: string; color: string }>;
  totalJobs: number;
}

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
    { key: 'predicted', label: 'Predicted Exits', color: '#E11D48' },
    { key: 'baseline', label: 'Historical Baseline', color: '#94A3B8' }
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
    { key: 'score', label: 'Forecasted Score', color: '#4F46E5' },
    { key: 'target', label: 'Target Score', color: '#CBD5E1' }
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
    { key: 'vacation', label: 'Vacation Surge', color: '#D97706' },
    { key: 'sick', label: 'Sick Leave Trend', color: '#059669' },
    { key: 'personal', label: 'Personal Time', color: '#3B82F6' }
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
    { key: 'utilized', label: 'Predicted Utilization (%)', color: '#059669' },
    { key: 'available', label: 'Predicted Buffer (%)', color: '#A7F3D0' }
  ]
};

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('projects');
  const [exitsData, setExitsData] = useState<ExitsData | null>(null);
  const [isLoadingExits, setIsLoadingExits] = useState(false);
  const [hiresData, setHiresData] = useState<HiresData | null>(null);
  const [isLoadingHires, setIsLoadingHires] = useState(false);
  const [seniorityData, setSeniorityData] = useState<SeniorityData | null>(null);
  const [isLoadingSeniority, setIsLoadingSeniority] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [jobsData, setJobsData] = useState<JobsData | null>(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const handleTabClick = (itemId: string) => {
    setActiveTab(itemId);
  };

  // Fetch data when tabs are active
  useEffect(() => {
    if (activeTab === 'org') {
      fetchExitsData(selectedDepartment);
      fetchHiresData(selectedDepartment);
      fetchSeniorityData(selectedDepartment);
      fetchJobs();
    } else if (activeTab === 'compliance') {
      fetchAttendanceData(selectedDepartment);
    }
  }, [activeTab, selectedDepartment]);

  // Handle department filter change
  const handleDepartmentChange = (department: string) => {
    setSelectedDepartment(department);
    if (activeTab === 'org') {
      fetchExitsData(department);
      fetchHiresData(department);
      fetchSeniorityData(department);
    } else if (activeTab === 'compliance') {
      fetchAttendanceData(department);
    }
  };

  const fetchExitsData = async (department: string = 'all') => {
    try {
      setIsLoadingExits(true);
      console.log('Fetching exits data for department:', department);
      const url = department === 'all' 
        ? '/api/admin/analytics/exits'
        : `/api/admin/analytics/exits?department=${encodeURIComponent(department)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Exits API response:', data);
      
      if (data.success) {
        setExitsData(data.data);
        console.log('Exits data set:', data.data);
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching exits data:', error);
    } finally {
      setIsLoadingExits(false);
    }
  };

  const fetchHiresData = async (department: string = 'all') => {
    try {
      setIsLoadingHires(true);
      console.log('Fetching hires data for department:', department);
      const url = department === 'all' 
        ? '/api/admin/analytics/hires'
        : `/api/admin/analytics/hires?department=${encodeURIComponent(department)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Hires API response:', data);
      
      if (data.success) {
        setHiresData(data.data);
        console.log('Hires data set:', data.data);
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching hires data:', error);
    } finally {
      setIsLoadingHires(false);
    }
  };

  const fetchSeniorityData = async (department: string = 'all') => {
    try {
      setIsLoadingSeniority(true);
      console.log('Fetching seniority data for department:', department);
      const url = department === 'all' 
        ? '/api/admin/analytics/seniority'
        : `/api/admin/analytics/seniority?department=${encodeURIComponent(department)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Seniority API response:', data);
      
      if (data.success) {
        setSeniorityData(data.data);
        console.log('Seniority data set:', data.data);
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching seniority data:', error);
    } finally {
      setIsLoadingSeniority(false);
    }
  };

  const fetchAttendanceData = async (department: string = 'all') => {
    try {
      setIsLoadingAttendance(true);
      console.log('Fetching attendance data for department:', department);
      const url = department === 'all' 
        ? '/api/admin/analytics/attendance'
        : `/api/admin/analytics/attendance?department=${encodeURIComponent(department)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Attendance API response:', data);
      
      if (data.success) {
        setAttendanceData(data.data);
        console.log('Attendance data set:', data.data);
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setIsLoadingJobs(true);
      const response = await fetch('/api/jobs');
      const data = await response.json();
      
      if (data.success && data.data) {
        // Group jobs by month and department
        const monthlyJobs: { [key: string]: { [department: string]: number } } = {};
        
        data.data.forEach((job: Job) => {
          if (job.postedDate) {
            const date = new Date(job.postedDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const department = job.department || 'unknown';
            
            if (!monthlyJobs[monthKey]) {
              monthlyJobs[monthKey] = {};
            }
            
            if (!monthlyJobs[monthKey][department]) {
              monthlyJobs[monthKey][department] = 0;
            }
            
            monthlyJobs[monthKey][department]++;
          }
        });

        // Get all unique departments
        const allDepartments = new Set<string>();
        Object.values(monthlyJobs).forEach(monthData => {
          Object.keys(monthData).forEach(department => allDepartments.add(department));
        });

        // Generate all 12 months of current year (matching hires/exits pattern)
        const targetYear = new Date().getFullYear();
        const months: string[] = [];
        
        for (let month = 0; month < 12; month++) {
          months.push(`${targetYear}-${String(month + 1).padStart(2, '0')}`);
        }
        
        const chartData = months.map(month => {
          const monthData: any = { month };
          allDepartments.forEach(department => {
            monthData[department] = monthlyJobs[month] ? (monthlyJobs[month][department] || 0) : 0;
          });
          return monthData;
        });

        // Get department colors for legend (same colors as hires chart)
        const departmentColors = [
          '#3B82F6', // blue
          '#EF4444', // red
          '#10B981', // green
          '#F59E0B', // yellow
          '#8B5CF6', // purple
          '#F97316', // orange
          '#06B6D4', // cyan
          '#84CC16', // lime
        ];

        const legend = Array.from(allDepartments).map((department, index) => ({
          key: department,
          label: department,
          color: departmentColors[index % departmentColors.length]
        }));

        // Calculate total jobs
        const totalJobs = chartData.reduce((sum, month) => {
          const monthTotal = Object.entries(month)
            .filter(([key]) => key !== 'month')
            .reduce((monthSum, [, val]) => monthSum + (val as number), 0);
          return sum + monthTotal;
        }, 0);

        setJobsData({
          chartData,
          legend,
          totalJobs
        });
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Convert exits data to BarChart format
  const convertExitsToBarChart = (data: ExitsData) => {
    const chartData: BarChartData[] = data.chartData.map(month => {
      const convertedMonth: { month: string; [key: string]: any } = { month: month.month };
      
      // Add each reason as a separate property
      data.legend.forEach(({ reason }) => {
        convertedMonth[reason] = month[reason] || 0;
      });
      
      return convertedMonth;
    });

    const legend: BarChartLegend[] = data.legend.map(({ reason, color }) => ({
      key: reason,
      label: reason,
      color
    }));

    return { chartData, legend };
  };

  // Convert hires data to BarChart format
  const convertHiresToBarChart = (data: HiresData) => {
    const chartData: BarChartData[] = data.chartData.map(month => {
      const convertedMonth: { month: string; [key: string]: any } = { month: month.month };
      
      // Add each department as a separate property
      data.legend.forEach(({ key }) => {
        convertedMonth[key] = month[key] || 0;
      });
      
      return convertedMonth;
    });

    const legend: BarChartLegend[] = data.legend.map(({ key, label, color }) => ({
      key,
      label,
      color
    }));

    return { chartData, legend };
  };

  // Convert jobs data to BarChart format
  const convertJobsToBarChart = (data: JobsData) => {
    const chartData: BarChartData[] = data.chartData.map(month => {
      const convertedMonth: { month: string; [key: string]: any } = { month: month.month };
      
      // Add each department as a separate property
      data.legend.forEach(({ key }) => {
        convertedMonth[key] = month[key] || 0;
      });
      
      return convertedMonth;
    });

    const legend: BarChartLegend[] = data.legend.map(({ key, label, color }) => ({
      key,
      label,
      color
    }));

    return { chartData, legend };
  };

  // Quadrant Card Component
  const QuadrantCard = ({ title, description, icon, color }: { 
    title: string; 
    description: string; 
    icon: React.ReactNode; 
    color: string;
  }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300 cursor-pointer">
      <div className="text-center">
        <div className={`w-16 h-16 ${color} rounded-full flex items-center justify-center mx-auto mb-4`}>
          {icon}
          </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4 text-sm">{description}</p>
        <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
          Coming Soon
          </div>
        </div>
      </div>
    );

  // Get current active tab configuration
  const config = adminSubNavConfigs.analytics;
  return (
    <div className="space-y-8">
      {/* Sub Navigation */}
      <AdminSubNav
        items={config.items}
        variant="tabs"
        onItemClick={handleTabClick}
        activeItem={activeTab}
        title=""
      />


      {/* Department Filter - Show for Org and Compliance tabs */}
      {((activeTab === 'org' && seniorityData) || (activeTab === 'compliance' && attendanceData)) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by Department:</label>
            <select
              value={selectedDepartment}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Departments</option>
              {(activeTab === 'org' ? seniorityData?.departments : attendanceData?.departments)?.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Content Area - Quadrant Layout */}
      {(() => {
        const activeTabConfig = config.items.find(item => item.id === activeTab);
        if (!activeTabConfig?.children) return null;
        
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeTabConfig.children.map((subItem, index) => {
            // Special case for Compliance Status (top left quadrant) - show attendance chart
            if (activeTab === 'compliance' && subItem.id === 'compliance-status') {
              return (
                <div key={subItem.id} className="md:col-span-2">
                  {isLoadingAttendance ? (
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
                  ) : attendanceData ? (
                 <ClusteredBarChart
                   title="Attendance Compliance"
                   subtitle={`Overall attendance: ${attendanceData.overallAttendance}%`}
                      data={attendanceData.chartData}
                      legend={attendanceData.legend}
                      dataKey="month"
                      valueKeys={attendanceData.legend.map(item => item.key)}
                      height={300}
                      showTotals={true}
                      showLegend={true}
                      showEmptyBars={true}
                      maxBars={12}
                      rotateLabels={true}
                      barSpacing={2}
                      clusterSpacing={4}
                      showYAxis={true}
                      showGridLines={true}
                    />
                  ) : (
                    <QuadrantCard
                      title={subItem.label}
                      description={`This ${subItem.label.toLowerCase()} feature is currently under development and will be available soon.`}
                      icon={<ShieldCheckIcon className="w-8 h-8 text-blue-600" />}
                      color="bg-blue-100"
                    />
                  )}
            </div>
              );
            }

            // Special case for Org Structure (top left quadrant) - show hires chart
            if (activeTab === 'org' && subItem.id === 'org-structure') {
              return (
                <div key={subItem.id}>
                  {isLoadingHires ? (
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex items-center justify-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
                  ) : hiresData ? (
                    (() => {
                      const { chartData, legend } = convertHiresToBarChart(hiresData);
                      const valueKeys = legend.map(item => item.key);
                      
                      return (
                        <BarChart
                          title="Hires by Month"
                          data={chartData}
                          legend={legend}
                          dataKey="month"
                          valueKeys={valueKeys}
                          height={160}
                          showTotals={true}
                          showLegend={true}
                          showEmptyBars={true}
                          maxBars={12}
                          rotateLabels={true}
                          barSpacing={12}
                        />
                      );
                    })()
                  ) : (
                    <QuadrantCard
                      title={subItem.label}
                      description={`This ${subItem.label.toLowerCase()} feature is currently under development and will be available soon.`}
                      icon={<BuildingOfficeIcon className="w-8 h-8 text-indigo-600" />}
                      color="bg-indigo-100"
                    />
                  )}
            </div>
              );
            }

            // Special case for Org Growth (bottom left quadrant) - show seniority pyramid
            if (activeTab === 'org' && subItem.id === 'org-growth') {
              return (
                <div key={subItem.id}>
                  {isLoadingSeniority ? (
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex items-center justify-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
                  ) : seniorityData ? (
                    <HorizontalBarChart
                      title="Seniority Pyramid"
                      subtitle={`${selectedDepartment === 'all' 
                        ? `${seniorityData.totalEmployees} total employees`
                        : `${seniorityData.chartData.reduce((sum, item) => sum + item.count, 0)} employees in ${selectedDepartment}`
                      }`}
                      data={seniorityData.chartData}
                      dataKey="level"
                      valueKey="count"
                      height={200}
                      showTotals={true}
                      showLegend={false}
                      barHeight={20}
                      barSpacing={4}
                      maxBars={15}
                      showEmptyBars={true}
                    />
                  ) : (
                    <QuadrantCard
                      title={subItem.label}
                      description={`This ${subItem.label.toLowerCase()} feature is currently under development and will be available soon.`}
                      icon={<ArrowUpIcon className="w-8 h-8 text-cyan-600" />}
                      color="bg-cyan-100"
                    />
                  )}
            </div>
              );
            }

            // Special case for Org Performance (top right quadrant) - show exits chart
            if (activeTab === 'org' && subItem.id === 'org-performance') {
              return (
                <div key={subItem.id}>
                  {isLoadingExits ? (
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex items-center justify-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
                  ) : exitsData ? (
                    (() => {
                      const { chartData, legend } = convertExitsToBarChart(exitsData);
                      const valueKeys = legend.map(item => item.key);
                      
                      return (
                        <BarChart
                          title="Exits by Month"
                          data={chartData}
                          legend={legend}
                          dataKey="month"
                          valueKeys={valueKeys}
                          height={160}
                          showTotals={true}
                          showLegend={true}
                          showEmptyBars={true}
                          maxBars={12}
                          rotateLabels={true}
                          barSpacing={12}
                        />
                      );
                    })()
                  ) : (
                    <QuadrantCard
                      title={subItem.label}
                      description={`This ${subItem.label.toLowerCase()} feature is currently under development and will be available soon.`}
                      icon={<ArrowTrendingUpIcon className="w-8 h-8 text-emerald-600" />}
                      color="bg-emerald-100"
                    />
                  )}
                </div>
              );
            }

            // Special case for Org Insights (bottom right quadrant) - show job openings chart
            if (activeTab === 'org' && subItem.id === 'org-insights') {
              return (
                <div key={subItem.id}>
                  {isLoadingJobs ? (
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex items-center justify-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                    </div>
                  ) : jobsData ? (
                    (() => {
                      const { chartData, legend } = convertJobsToBarChart(jobsData);
                      const valueKeys = legend.map(item => item.key);
                      
                      return (
                        <BarChart
                          title="Job Openings by Month"
                          subtitle={`${jobsData.totalJobs} total active openings`}
                          data={chartData}
                          legend={legend}
                          dataKey="month"
                          valueKeys={valueKeys}
                          height={160}
                          showTotals={true}
                          showLegend={true}
                          showEmptyBars={true}
                          maxBars={12}
                          rotateLabels={true}
                          barSpacing={12}
                        />
                      );
                    })()
                  ) : (
                    <QuadrantCard
                      title={subItem.label}
                      description={`This ${subItem.label.toLowerCase()} feature is currently under development and will be available soon.`}
                      icon={<LightBulbIcon className="w-8 h-8 text-pink-600" />}
                      color="bg-pink-100"
                    />
                  )}
                </div>
              );
            }
            // Predictive AI Charts
            if (activeTab === 'predictive-ai' && subItem.id === 'turnover-prediction') {
              return (
                <div key={subItem.id}>
                  <BarChart
                    title="Turnover Prediction"
                    subtitle="Historical baseline vs Model forecast (Next 6 Mo)"
                    data={mockTurnoverPredictionData.chartData}
                    legend={mockTurnoverPredictionData.legend}
                    dataKey="month"
                    valueKeys={mockTurnoverPredictionData.legend.map(l => l.key)}
                    height={160}
                    showTotals={true}
                    showLegend={true}
                    showEmptyBars={true}
                    maxBars={6}
                    rotateLabels={false}
                    barSpacing={16}
                  />
                </div>
              );
            }

            if (activeTab === 'predictive-ai' && subItem.id === 'performance-forecast') {
              return (
                <div key={subItem.id}>
                  <BarChart
                    title="Performance Forecast"
                    subtitle="Predicted performance scores"
                    data={mockPerformanceForecastData.chartData}
                    legend={mockPerformanceForecastData.legend}
                    dataKey="month"
                    valueKeys={mockPerformanceForecastData.legend.map(l => l.key)}
                    height={160}
                    showTotals={true}
                    showLegend={true}
                    showEmptyBars={true}
                    maxBars={4}
                    rotateLabels={false}
                    barSpacing={16}
                  />
                </div>
              );
            }

            if (activeTab === 'predictive-ai' && subItem.id === 'leave-prediction') {
              return (
                <div key={subItem.id}>
                  <BarChart
                    title="Leave Pattern Prediction"
                    subtitle="Anticipated volume of employee absences"
                    data={mockLeavePredictionData.chartData}
                    legend={mockLeavePredictionData.legend}
                    dataKey="month"
                    valueKeys={mockLeavePredictionData.legend.map(l => l.key)}
                    height={160}
                    showTotals={true}
                    showLegend={true}
                    showEmptyBars={true}
                    maxBars={6}
                    rotateLabels={false}
                    barSpacing={12}
                  />
                </div>
              );
            }

            if (activeTab === 'predictive-ai' && subItem.id === 'workforce-capacity') {
              return (
                <div key={subItem.id}>
                  <BarChart
                    title="Workforce Capacity"
                    subtitle="Predicted utilization against target thresholds"
                    data={mockWorkforceCapacityData.chartData}
                    legend={mockWorkforceCapacityData.legend}
                    dataKey="month"
                    valueKeys={mockWorkforceCapacityData.legend.map(l => l.key)}
                    height={160}
                    showTotals={true}
                    showLegend={true}
                    showEmptyBars={true}
                    maxBars={5}
                    rotateLabels={false}
                    barSpacing={12}
                  />
                </div>
              );
            }

            // Define icons and colors for each section
            const getIconAndColor = (sectionId: string) => {
              if (sectionId === 'projects') {
                const projectIcons = [
                  <ChartBarIcon key="chart-bar" className="w-8 h-8 text-blue-600" />,
                  <ClockIcon key="clock" className="w-8 h-8 text-green-600" />,
                  <UserGroupIcon key="user-group" className="w-8 h-8 text-purple-600" />,
                  <ChartPieIcon key="chart-pie" className="w-8 h-8 text-orange-600" />
                ];
                const projectColors = [
                  'bg-blue-100',
                  'bg-green-100', 
                  'bg-purple-100',
                  'bg-orange-100'
                ];
                return {
                  icon: projectIcons[index] || <ChartBarIcon className="w-8 h-8 text-blue-600" />,
                  color: projectColors[index] || 'bg-blue-100'
                };
              } else if (sectionId === 'org') {
                const orgIcons = [
                  <BuildingOfficeIcon key="building-office" className="w-8 h-8 text-indigo-600" />,
                  <ArrowTrendingUpIcon key="arrow-trending-up" className="w-8 h-8 text-emerald-600" />,
                  <ArrowUpIcon key="arrow-up" className="w-8 h-8 text-cyan-600" />,
                  <LightBulbIcon key="light-bulb" className="w-8 h-8 text-pink-600" />
                ];
                const orgColors = [
                  'bg-indigo-100',
                  'bg-emerald-100',
                  'bg-cyan-100', 
                  'bg-pink-100'
                ];
                return {
                  icon: orgIcons[index] || <BuildingOfficeIcon className="w-8 h-8 text-indigo-600" />,
                  color: orgColors[index] || 'bg-indigo-100'
                };
              } else if (sectionId === 'runway') {
                const runwayIcons = [
                  <CurrencyDollarIcon key="currency-dollar" className="w-8 h-8 text-green-600" />,
                  <CalendarIcon key="calendar" className="w-8 h-8 text-blue-600" />,
                  <CpuChipIcon key="cpu-chip" className="w-8 h-8 text-purple-600" />,
                  <ExclamationTriangleIcon key="exclamation-triangle" className="w-8 h-8 text-red-600" />
                ];
                const runwayColors = [
                  'bg-green-100',
                  'bg-blue-100',
                  'bg-purple-100',
                  'bg-red-100'
                ];
                return {
                  icon: runwayIcons[index] || <CurrencyDollarIcon className="w-8 h-8 text-green-600" />,
                  color: runwayColors[index] || 'bg-green-100'
                };
              } else if (sectionId === 'compliance') {
                const complianceIcons = [
                  <DocumentCheckIcon key="document-check" className="w-8 h-8 text-green-600" />,
                  <ClipboardDocumentListIcon key="clipboard-document-list" className="w-8 h-8 text-blue-600" />,
                  <ShieldCheckIcon key="shield-check" className="w-8 h-8 text-purple-600" />,
                  <EyeIcon key="eye" className="w-8 h-8 text-orange-600" />
                ];
                const complianceColors = [
                  'bg-green-100',
                  'bg-blue-100',
                  'bg-purple-100',
                  'bg-orange-100'
                ];
                return {
                  icon: complianceIcons[index] || <DocumentCheckIcon className="w-8 h-8 text-green-600" />,
                  color: complianceColors[index] || 'bg-green-100'
                };
              } else if (sectionId === 'predictive-ai') {
                const predictiveIcons = [
                  <ExclamationTriangleIcon key="turnover-prediction" className="w-8 h-8 text-rose-600" />,
                  <ArrowTrendingUpIcon key="performance-forecast" className="w-8 h-8 text-indigo-600" />,
                  <CalendarIcon key="leave-prediction" className="w-8 h-8 text-amber-600" />,
                  <ChartPieIcon key="workforce-capacity" className="w-8 h-8 text-emerald-600" />
                ];
                const predictiveColors = [
                  'bg-rose-100',
                  'bg-indigo-100',
                  'bg-amber-100',
                  'bg-emerald-100'
                ];
                return {
                  icon: predictiveIcons[index] || <ExclamationTriangleIcon className="w-8 h-8 text-rose-600" />,
                  color: predictiveColors[index] || 'bg-rose-100'
                };
              }
              return {
                icon: <ChartBarIcon className="w-8 h-8 text-blue-600" />,
                color: 'bg-blue-100'
              };
            };

            const { icon, color } = getIconAndColor(activeTab);

            return (
              <QuadrantCard
                key={subItem.id}
                title={subItem.label}
                description={`This ${subItem.label.toLowerCase()} feature is currently under development and will be available soon.`}
                icon={icon}
                color={color}
              />
            );
          })}
          </div>
        );
      })()}
    </div>
  );
}