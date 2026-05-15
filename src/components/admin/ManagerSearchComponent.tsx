'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MagnifyingGlassIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Employee {
  _id: string;
  clerkUserId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
}

interface ManagerSearchComponentProps {
  value: string;
  onChange: (managerId: string, managerName: string) => void;
  placeholder?: string;
  excludeId?: string;
  disabled?: boolean;
}

export default function ManagerSearchComponent({
  value,
  onChange,
  placeholder = "Search for a manager...",
  excludeId,
  disabled = false
}: ManagerSearchComponentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Employee[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const searchEmployees = useCallback(async () => {
    try {
      setIsSearching(true);
      setError(null);

      const params = new URLSearchParams({
        search: searchTerm,
        limit: '10',
        ...(excludeId && { excludeId })
      });

      const response = await fetch(`/api/admin/users/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data || []);
        setShowDropdown(true);
      } else {
        throw new Error(data.error || 'Failed to search employees');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : 'Failed to search employees');
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, excludeId]);

  const loadSelectedManager = useCallback(async (managerId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/admin/users/${managerId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load manager: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success && data.data) {
        setSelectedManager(data.data);
        setSearchTerm(`${data.data.firstName} ${data.data.lastName} (${data.data.employeeId})`);
      } else {
        throw new Error(data.error || 'Manager not found');
      }
    } catch (error) {
      console.error('Error loading selected manager:', error);
      setError(error instanceof Error ? error.message : 'Failed to load manager');
      // Clear the value if manager can't be loaded
      onChange('', '');
    }
  }, [onChange]);

  // Load selected manager when value changes
  useEffect(() => {
    if (value && !selectedManager) {
      loadSelectedManager(value);
    } else if (!value && selectedManager) {
      // Clear selection if value is cleared
      setSelectedManager(null);
      setSearchTerm('');
    }
  }, [value, selectedManager, loadSelectedManager]);

  // Debounced search function
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Only search if we have a search term and no selected manager (to avoid searching when loading existing manager)
    if (searchTerm.length >= 2 && !selectedManager) {
      searchTimeoutRef.current = setTimeout(() => {
        searchEmployees();
      }, 300);
    } else if (searchTerm.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, selectedManager, searchEmployees]);

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedManager(employee);
    setSearchTerm(`${employee.firstName} ${employee.lastName} (${employee.employeeId})`);
    setShowDropdown(false);
    // Pass Clerk user ID as managerId to be stored in MongoDB
    onChange(employee.clerkUserId || employee._id, `${employee.firstName} ${employee.lastName}`);
  };

  const handleClear = () => {
    setSelectedManager(null);
    setSearchTerm('');
    setSearchResults([]);
    setShowDropdown(false);
    onChange('', '');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    
    // If user starts typing, clear the selected manager to allow new search
    if (selectedManager && newValue !== `${selectedManager.firstName} ${selectedManager.lastName} (${selectedManager.employeeId})`) {
      setSelectedManager(null);
    }
    
    // If user clears the input, clear the selection
    if (!newValue) {
      setSelectedManager(null);
      onChange('', '');
    }
  };

  const handleInputFocus = () => {
    if (searchResults.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          } ${error ? 'border-red-500' : 'border-gray-300'}`}
        />
        {selectedManager && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Search Results Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isSearching ? (
            <div className="px-4 py-3 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2">Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-1">
              {searchResults.map((employee) => (
                <button
                  key={employee._id}
                  type="button"
                  onClick={() => handleEmployeeSelect(employee)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {employee.employeeId} • {employee.department} • {employee.position}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm.length >= 2 ? (
            <div className="px-4 py-3 text-center text-gray-500">
              <p>No employees found</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
