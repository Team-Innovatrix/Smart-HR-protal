'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

export interface SubNavItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  children?: SubNavItem[];
}

export interface AdminSubNavProps {
  title: string;
  items: SubNavItem[];
  variant?: 'tabs' | 'sidebar' | 'breadcrumb';
  className?: string;
  onItemClick?: (itemId: string) => void;
  activeItem?: string;
}

export default function AdminSubNav({ 
  title, 
  items, 
  variant = 'tabs',
  className = '',
  onItemClick,
  activeItem
}: AdminSubNavProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActive = (href: string, itemId: string) => {
    // If using activeItem prop (for click-based tabs), check against activeItem
    if (activeItem !== undefined) {
      return activeItem === itemId;
    }
    // Otherwise, check against pathname (for link-based navigation)
    return pathname === href || pathname.startsWith(href + '/');
  };

  const hasActiveChild = (item: SubNavItem): boolean => {
    if (isActive(item.href, item.id)) return true;
    if (item.children) {
      return item.children.some(child => hasActiveChild(child));
    }
    return false;
  };

  const renderTabs = () => (
    <div>
      {/* Desktop Navigation */}
      <nav className="hidden sm:flex space-x-6 lg:space-x-8">
        {items.map((item) => {
          const isItemActive = isActive(item.href, item.id);
          const handleClick = () => {
            if (onItemClick) {
              onItemClick(item.id);
            }
          };

          return item.href === '#' ? (
            <button
              key={item.id}
              onClick={(e) => {
                e.preventDefault();
                handleClick();
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer ${
                isItemActive
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-neutral-500 hover:text-orange-600 hover:border-orange-300'
              }`}
              tabIndex={-1}
            >
              <div className="flex items-center space-x-2">
                {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          ) : (
            <Link
              key={item.id}
              href={item.href}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                isItemActive
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-neutral-500 hover:text-orange-600 hover:border-orange-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Mobile Navigation - Horizontal Scroll */}
      <nav className="sm:hidden overflow-x-auto scrollbar-hide">
        <div className="flex space-x-4 pb-2">
          {items.map((item) => {
            const isItemActive = isActive(item.href, item.id);
            const handleClick = () => {
              if (onItemClick) {
                onItemClick(item.id);
              }
            };

            return item.href === '#' ? (
              <button
                key={item.id}
                onClick={(e) => {
                  e.preventDefault();
                  handleClick();
                }}
                className={`py-2 px-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                  isItemActive
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-neutral-500 hover:text-orange-600 hover:border-orange-300'
                }`}
                tabIndex={-1}
              >
                <div className="flex items-center space-x-1">
                  {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
                  <span className="text-xs">{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            ) : (
              <Link
                key={item.id}
                href={item.href}
                className={`py-2 px-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                  isItemActive
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-neutral-500 hover:text-orange-600 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center space-x-1">
                  {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
                  <span className="text-xs">{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );

  const renderSidebar = () => (
    <div className="space-y-1">
      {items.map((item) => (
        <div key={item.id}>
          <div className="flex items-center">
            <Link
              href={item.href}
              className={`flex-1 flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive(item.href, item.id)
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.icon && <span className="mr-3 w-4 h-4">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
            {item.children && (
              <button
                onClick={() => toggleExpanded(item.id)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {expandedItems.includes(item.id) ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
          {item.children && expandedItems.includes(item.id) && (
            <div className="ml-6 mt-1 space-y-1">
              {item.children.map((child) => (
                <Link
                  key={child.id}
                  href={child.href}
                  className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                    isActive(child.href, child.id)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {child.icon && <span className="mr-3 w-4 h-4">{child.icon}</span>}
                  {child.label}
                  {child.badge && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      {child.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderBreadcrumb = () => {
    const findActiveItem = (items: SubNavItem[]): SubNavItem | null => {
      for (const item of items) {
        if (isActive(item.href, item.id)) return item;
        if (item.children) {
          const found = findActiveItem(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const activeItem = findActiveItem(items);
    if (!activeItem) return null;

    return (
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/admin" className="text-gray-400 hover:text-gray-500">
              Admin
            </Link>
          </li>
          <li>
            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
          </li>
          <li>
            <span className="text-gray-900 font-medium">{activeItem.label}</span>
          </li>
        </ol>
      </nav>
    );
  };

  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <div className="px-4 sm:px-6 py-4">
        {title && (
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        )}
        
        {variant === 'tabs' && renderTabs()}
        {variant === 'sidebar' && renderSidebar()}
        {variant === 'breadcrumb' && renderBreadcrumb()}
      </div>
    </div>
  );
}

// Predefined navigation configurations for common admin sections
export const adminSubNavConfigs = {
  attendance: {
    title: 'Attendance',
    items: [
      {
        id: 'overview',
        label: 'Overview',
        href: '/portal/admin/attendance',
        icon: null,
      },
      {
        id: 'reports',
        label: 'Reports',
        href: '/portal/admin/attendance/reports',
        icon: null,
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/portal/admin/attendance/settings',
        icon: null,
      },
    ],
  },
  users: {
    title: 'User Management',
    items: [
      {
        id: 'all-users',
        label: 'All Users',
        href: '/portal/admin/users',
        icon: null,
      },
      {
        id: 'employee-onboarding',
        label: 'Add / Detach Employee',
        href: '/portal/admin/users/onboarding',
        icon: null,
      },
      {
        id: 'roles',
        label: 'Roles & Permissions',
        href: '/portal/admin/users/roles',
        icon: null,
      },
      {
        id: 'departments',
        label: 'Departments',
        href: '#',
        icon: null,
      },
    ],
  },
  leaves: {
    title: 'Leave Management',
    items: [
      {
        id: 'requests',
        label: 'Leave Requests',
        href: '/portal/admin/leaves',
        icon: null,
        badge: 5,
      },
      {
        id: 'policies',
        label: 'Policies',
        href: '/portal/admin/leaves/policies',
        icon: null,
      },
      {
        id: 'calendar',
        label: 'Calendar',
        href: '/portal/admin/leaves/calendar',
        icon: null,
      },
    ],
  },
  analytics: {
    title: 'Analytics',
    items: [
      {
        id: 'projects',
        label: 'Projects',
        href: '#',
        icon: null,
        children: [
          {
            id: 'project-overview',
            label: 'Project Overview',
            href: '#',
            icon: null,
          },
          {
            id: 'project-timeline',
            label: 'Project Timeline',
            href: '#',
            icon: null,
          },
          {
            id: 'project-resources',
            label: 'Project Resources',
            href: '#',
            icon: null,
          },
          {
            id: 'project-metrics',
            label: 'Project Metrics',
            href: '#',
            icon: null,
          },
        ],
      },
      {
        id: 'org',
        label: 'Org',
        href: '#',
        icon: null,
        children: [
          {
            id: 'org-structure',
            label: 'Org Structure',
            href: '#',
            icon: null,
          },
          {
            id: 'org-performance',
            label: 'Org Performance',
            href: '#',
            icon: null,
          },
          {
            id: 'org-growth',
            label: 'Org Growth',
            href: '#',
            icon: null,
          },
          {
            id: 'org-insights',
            label: 'Org Insights',
            href: '#',
            icon: null,
          },
        ],
      },
      {
        id: 'runway',
        label: 'Runway',
        href: '#',
        icon: null,
        children: [
          {
            id: 'runway-overview',
            label: 'Runway Overview',
            href: '#',
            icon: null,
          },
          {
            id: 'runway-forecast',
            label: 'Runway Forecast',
            href: '#',
            icon: null,
          },
          {
            id: 'runway-scenarios',
            label: 'Runway Scenarios',
            href: '#',
            icon: null,
          },
          {
            id: 'runway-alerts',
            label: 'Runway Alerts',
            href: '#',
            icon: null,
          },
        ],
      },
      {
        id: 'compliance',
        label: 'Compliance',
        href: '#',
        icon: null,
        children: [
          {
            id: 'compliance-status',
            label: 'Compliance Status',
            href: '#',
            icon: null,
          },
          {
            id: 'compliance-reports',
            label: 'Compliance Reports',
            href: '#',
            icon: null,
          },
          {
            id: 'compliance-audits',
            label: 'Compliance Audits',
            href: '#',
            icon: null,
          },
          {
            id: 'compliance-tracking',
            label: 'Compliance Tracking',
            href: '#',
            icon: null,
          },
        ],
      },
    ],
  },
};
