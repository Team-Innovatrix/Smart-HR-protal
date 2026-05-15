'use client';

import React, { useState } from 'react';
import ApplicationForm from './ApplicationForm';

interface Vacancy {
  _id: string;
  title: string;
  department: string;
  location: string;
  jobType: string;
  description: string;
  requirements: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  deadline?: string;
  createdAt: string;
}

const jobTypeColors: Record<string, string> = {
  'full-time': '#34d399',
  'part-time': '#60a5fa',
  'contract': '#fbbf24',
  'internship': '#a78bfa',
};

export default function HomeJobList({ vacancies }: { vacancies: Vacancy[] }) {
  const [applyingFor, setApplyingFor] = useState<string | null>(null);

  if (vacancies.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
        <p style={{ color: '#94a3b8', fontSize: 16, fontWeight: 600 }}>No open positions right now</p>
        <p style={{ color: '#475569', fontSize: 13, marginTop: 8 }}>We're always looking for great talent. Check back soon!</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {vacancies.map((v, i) => {
          const color = jobTypeColors[v.jobType] || '#94a3b8';
          const deadlinePassed = v.deadline && new Date(v.deadline) < new Date();
          return (
            <div
              key={v._id}
              className="glass-card relative"
              style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 14, animationDelay: `${i * 0.08}s` }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 4, lineHeight: 1.3 }}>{v.title}</h3>
                  <p style={{ fontSize: 12, color: '#64748b' }}>{v.department} · {v.location}</p>
                </div>
                <span style={{ background: `${color}18`, color, border: `1px solid ${color}40`, borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0, textTransform: 'capitalize' }}>
                  {v.jobType.replace('-', ' ')}
                </span>
              </div>

              {/* Description */}
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {v.description}
              </p>

              {/* Requirements */}
              {v.requirements.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {v.requirements.slice(0, 3).map((r, ri) => (
                    <span key={ri} className="tag">{r}</span>
                  ))}
                  {v.requirements.length > 3 && (
                    <span className="tag">+{v.requirements.length - 3} more</span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, color: '#475569' }}>
                  {v.salaryMin || v.salaryMax ? (
                    <span>💰 {v.salaryCurrency} {v.salaryMin?.toLocaleString()}{v.salaryMax ? ` – ${v.salaryMax.toLocaleString()}` : '+'}</span>
                  ) : (
                    <span>📅 {deadlinePassed ? '❌ Closed' : v.deadline ? `Closes ${new Date(v.deadline).toLocaleDateString('en-IN')}` : 'Open'}</span>
                  )}
                </div>
                <button 
                  onClick={() => setApplyingFor(v._id)} 
                  className="btn-apply"
                  style={{ cursor: 'pointer', border: 'none', background: 'rgba(52,211,153,0.1)' }}
                >
                  Apply Now →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {applyingFor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ padding: '24px' }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl">
            <ApplicationForm 
              jobTitle={vacancies.find(v => v._id === applyingFor)?.title} 
              onClose={() => setApplyingFor(null)} 
            />
          </div>
        </div>
      )}
    </>
  );
}
