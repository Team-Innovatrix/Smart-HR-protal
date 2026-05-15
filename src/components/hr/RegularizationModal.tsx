'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ClockIcon, ExclamationTriangleIcon, CheckCircleIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useTimezone } from '../../lib/hooks/useTimezone';
import { FormTextarea } from '../global/FormInput';
import { layoutSpacing } from '@/lib/utils/spacingUtils';
import { iconContextSizes } from '@/lib/utils/iconUtils';

interface RegularizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendanceDate: string;
  onSubmit: (reason: string) => Promise<void>;
}

export default function RegularizationModal({ 
  isOpen, 
  onClose, 
  attendanceDate, 
  onSubmit
}: RegularizationModalProps) {
  const { safeFormatDate } = useTimezone();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Validate and format the attendance date
  const getFormattedDate = () => {
    if (!attendanceDate || attendanceDate === 'Invalid Date' || attendanceDate === 'null' || attendanceDate === 'undefined') {
      console.error('RegularizationModal: Invalid attendanceDate received:', { attendanceDate, type: typeof attendanceDate });
      return 'Invalid Date';
    }
    
    // Try to format the date using safeFormatDate
    const formatted = safeFormatDate(attendanceDate, 'dddd, MMMM DD, YYYY');
    
    // If safeFormatDate returns 'Invalid Date', try a more robust approach
    if (formatted === 'Invalid Date') {
      try {
        // Check if it's a valid YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) {
          const [year, month, day] = attendanceDate.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
          }
        }
      } catch (error) {
        console.error('Error formatting date:', { attendanceDate, error });
      }
      return 'Invalid Date';
    }
    
    return formatted;
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Please provide a reason for regularization');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(reason.trim());
      setSuccess(true);
      
      // Show success message briefly before closing
      setTimeout(() => {
        setReason('');
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit regularization request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !success) {
      setReason('');
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Request Regularization
              </h3>
              <p className="text-sm text-gray-600">
                Submit a request to regularize your attendance
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting || success}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Date Information */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600">Requesting regularization for:</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {getFormattedDate()}
            </p>
            {getFormattedDate() === 'Invalid Date' && (
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Unable to display the date. Please contact support if this issue persists.
              </p>
            )}
          </div>

          {success ? (
            /* Success State */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Request Submitted Successfully!
              </h4>
              <p className="text-gray-600">
                Your regularization request has been submitted and will be reviewed by your manager.
              </p>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <FormTextarea
                  label="Reason for Regularization"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide a detailed reason for your regularization request. For example: 'I was working late on a critical project', 'Had an important client meeting', 'Technical issues with the system', etc."
                  rows={5}
                  maxLength={500}
                  disabled={isSubmitting}
                  required
                  info="Be specific and provide context for your request"
                  leftIcon={<ExclamationTriangleIcon className={`${iconContextSizes.form.label} text-amber-500`} />}
                />
                <div className="flex justify-end mt-2">
                  <span className={`text-xs ${reason.length > 450 ? 'text-amber-600' : 'text-gray-500'}`}>
                    {reason.length}/500 characters
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !reason.trim()}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <ClockIcon className="h-4 w-4" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}