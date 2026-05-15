'use client';

import { useState } from 'react';

export default function PriorityMsgPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/priority-msg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send priority message');

      setSuccess('Priority message sent successfully! It will remain active for 24 hours.');
      setMessage('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Priority Message</h1>
        <p className="text-[var(--text-muted)] mt-2">
          Broadcast an urgent, high-priority message to all employees. The message will appear as an un-dismissible box on everyone's dashboard for 24 hours and trigger an urgent notification.
        </p>
      </div>

      <div className="glass p-8 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--color-danger)] rounded-full blur-[80px] opacity-20 pointer-events-none" />

        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)] text-[var(--color-danger)] text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.2)] text-[var(--color-success)] text-sm">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Message Content</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--glass-border)] rounded-xl p-4 text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-danger)] transition-colors placeholder-[var(--text-muted)]"
              placeholder="Enter your urgent message here..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all duration-300 disabled:opacity-50"
              style={{ background: 'var(--color-danger)', color: '#fff', boxShadow: '0 4px 20px rgba(248,113,113,0.3)' }}
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                'Broadcast Now 🚨'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
