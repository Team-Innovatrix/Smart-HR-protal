'use client'

import React from 'react';
import { useForm, ValidationError } from '@formspree/react';

interface ApplicationFormProps {
  jobTitle?: string;
  onClose?: () => void;
}

export default function ApplicationForm({ jobTitle, onClose }: ApplicationFormProps) {
  const [state, handleSubmit] = useForm('xqenvpza');
  
  if (state.succeeded) {
    return (
      <div className="text-center p-8 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm animate-fade-in">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-emerald-900 mb-2">Application Submitted!</h3>
        <p className="text-emerald-700 mb-6">Thanks for applying{jobTitle ? ` for the ${jobTitle} position` : ''}! We'll review your application and be in touch soon.</p>
        {onClose && (
          <button onClick={onClose} className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 animate-fade-in text-left">
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
        <h3 className="text-2xl font-bold text-gray-900">Apply for {jobTitle || 'this position'}</h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {jobTitle && <input type="hidden" name="job_title" value={jobTitle} />}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-1.5">First Name *</label>
            <input id="firstName" type="text" name="firstName" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-900" />
            <ValidationError prefix="First Name" field="firstName" errors={state.errors} className="text-red-500 text-xs mt-1" />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name *</label>
            <input id="lastName" type="text" name="lastName" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-900" />
            <ValidationError prefix="Last Name" field="lastName" errors={state.errors} className="text-red-500 text-xs mt-1" />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address *</label>
          <input id="email" type="email" name="email" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-900" />
          <ValidationError prefix="Email" field="email" errors={state.errors} className="text-red-500 text-xs mt-1" />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
          <input id="phone" type="tel" name="phone" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-900" />
          <ValidationError prefix="Phone" field="phone" errors={state.errors} className="text-red-500 text-xs mt-1" />
        </div>

        <div>
          <label htmlFor="portfolio" className="block text-sm font-semibold text-gray-700 mb-1.5">Portfolio / LinkedIn / Resume Link *</label>
          <input id="portfolio" type="url" name="portfolio" required placeholder="https://" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-900" />
          <ValidationError prefix="Portfolio" field="portfolio" errors={state.errors} className="text-red-500 text-xs mt-1" />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-1.5">Cover Letter / Message *</label>
          <textarea id="message" name="message" rows={4} required placeholder="Tell us why you're a great fit..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-y text-gray-900"></textarea>
          <ValidationError prefix="Message" field="message" errors={state.errors} className="text-red-500 text-xs mt-1" />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          {onClose && (
            <button type="button" onClick={onClose} className="px-5 py-2.5 font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
              Cancel
            </button>
          )}
          <button type="submit" disabled={state.submitting} className="px-6 py-2.5 bg-emerald-600 font-medium text-white rounded-lg hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center transition-all">
            {state.submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
}
