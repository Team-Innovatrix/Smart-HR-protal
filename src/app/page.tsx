import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';

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

import connectDB from '@/lib/mongodb';
import JobVacancy from '@/models/JobVacancy';

export const dynamic = 'force-dynamic';

async function getVacancies(): Promise<Vacancy[]> {
  try {
    await connectDB();
    const docs = await JobVacancy.find({ isActive: true })
      .select('title department location jobType description requirements salaryMin salaryMax salaryCurrency deadline createdAt')
      .sort({ createdAt: -1 })
      .lean();
      
    return docs.map((doc: any) => ({
      _id: String(doc._id),
      title: doc.title,
      department: doc.department,
      location: doc.location,
      jobType: doc.jobType,
      description: doc.description,
      requirements: doc.requirements,
      salaryMin: doc.salaryMin,
      salaryMax: doc.salaryMax,
      salaryCurrency: doc.salaryCurrency,
      deadline: doc.deadline ? new Date(doc.deadline).toISOString() : undefined,
      createdAt: new Date(doc.createdAt).toISOString(),
    })) as Vacancy[];
  } catch (error) {
    console.error('getVacancies error:', error);
    return [];
  }
}

const jobTypeColors: Record<string, string> = {
  'full-time': '#34d399',
  'part-time': '#60a5fa',
  'contract': '#fbbf24',
  'internship': '#a78bfa',
};

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect('/portal/dashboard');

  const vacancies = await getVacancies();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Inter', sans-serif; background: #0a0a1a; color: #e2e8f0; min-height: 100vh; }
        .grad-text { background: linear-gradient(135deg, #34d399, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .glass-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; backdrop-filter: blur(24px); }
        .glass-card:hover { background: rgba(255,255,255,0.055); border-color: rgba(52,211,153,0.2); transform: translateY(-2px); transition: all 0.3s ease; }
        .btn-signin { background: linear-gradient(135deg, #34d399, #10b981); color: #0a1a12; font-weight: 700; padding: 12px 28px; border-radius: 12px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; font-size: 14px; transition: all 0.3s ease; box-shadow: 0 0 24px rgba(52,211,153,0.25); }
        .btn-signin:hover { transform: translateY(-1px); box-shadow: 0 0 36px rgba(52,211,153,0.4); }
        .btn-apply { background: rgba(52,211,153,0.1); color: #34d399; border: 1px solid rgba(52,211,153,0.25); padding: 8px 18px; border-radius: 10px; font-size: 12px; font-weight: 600; text-decoration: none; transition: all 0.2s ease; display: inline-block; }
        .btn-apply:hover { background: rgba(52,211,153,0.18); border-color: rgba(52,211,153,0.4); }
        .btn-outline { padding: 12px 28px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); color: #cbd5e1; font-size: 14px; font-weight: 600; text-decoration: none; transition: all 0.2s ease; background: rgba(255,255,255,0.04); display: inline-block; }
        .btn-outline:hover { border-color: rgba(52,211,153,0.3); color: #34d399; background: rgba(52,211,153,0.06); }
        .tag { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 2px 8px; font-size: 11px; color: #94a3b8; }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        .blob { position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0a0a1a', overflowX: 'hidden' }}>

        {/* ── NAV ─────────────────────────────────────────────────── */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,26,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #34d399, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 0 16px rgba(52,211,153,0.3)' }}>⚡</div>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#f8fafc' }}>Smart HR Portal</span>
            </div>
            <Link href="/portal/auth" className="btn-signin" style={{ padding: '8px 20px', fontSize: 13 }}>
              Sign In →
            </Link>
          </div>
        </nav>

        {/* ── HERO ────────────────────────────────────────────────── */}
        <section style={{ position: 'relative', padding: '80px 24px 100px', textAlign: 'center', overflow: 'hidden' }}>
          <div className="blob" style={{ width: 500, height: 500, background: 'rgba(52,211,153,0.12)', top: -100, left: '50%', transform: 'translateX(-50%)' }} />
          <div className="blob" style={{ width: 300, height: 300, background: 'rgba(96,165,250,0.08)', top: 50, right: '10%' }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto' }} className="fade-up">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 100, padding: '6px 16px', marginBottom: 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399', display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600, letterSpacing: '0.05em' }}>NOW HIRING</span>
            </div>

            <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 900, lineHeight: 1.1, color: '#f8fafc', marginBottom: 20 }}>
              Build Your Career <br />
              <span className="grad-text">With Innovatrix</span>
            </h1>

            <p style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.7, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
              Join a team of passionate professionals. Explore open positions and help shape the future of HR technology.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/portal/auth" className="btn-signin">
                🚀 Get Started
              </Link>
              <a href="#openings" className="btn-outline">View Openings ↓</a>
            </div>
          </div>

          {/* Stats */}
          <div style={{ maxWidth: 600, margin: '60px auto 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { n: vacancies.length, label: 'Open Positions' },
              { n: [...new Set(vacancies.map(v => v.department))].length || 0, label: 'Departments' },
              { n: '100%', label: 'Remote Friendly' },
            ].map((s, i) => (
              <div key={i} className="glass-card" style={{ padding: '20px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#34d399' }}>{s.n}</div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── OPEN POSITIONS ──────────────────────────────────────── */}
        <section id="openings" style={{ padding: '60px 24px 100px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, color: '#f8fafc', marginBottom: 12 }}>
              Open <span className="grad-text">Positions</span>
            </h2>
            <p style={{ color: '#64748b', fontSize: 15 }}>
              {vacancies.length > 0
                ? `${vacancies.length} opening${vacancies.length > 1 ? 's' : ''} available right now`
                : 'Check back soon — new positions coming!'}
            </p>
          </div>

          {vacancies.length === 0 ? (
            <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
              <p style={{ color: '#94a3b8', fontSize: 16, fontWeight: 600 }}>No open positions right now</p>
              <p style={{ color: '#475569', fontSize: 13, marginTop: 8 }}>We're always looking for great talent. Check back soon!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
              {vacancies.map((v, i) => {
                const color = jobTypeColors[v.jobType] || '#94a3b8';
                const deadlinePassed = v.deadline && new Date(v.deadline) < new Date();
                return (
                  <div
                    key={v._id}
                    className="glass-card"
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
                      <Link href="/portal/auth" className="btn-apply">
                        Login to Apply →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px', textAlign: 'center' }}>
          <p style={{ color: '#334155', fontSize: 13 }}>
            © {new Date().getFullYear()} Smart HR Portal · Built by Innovatrix
            <span style={{ margin: '0 12px', color: '#1e293b' }}>·</span>
            <Link href="/portal/auth" style={{ color: '#34d399', textDecoration: 'none' }}>Employee Login</Link>
          </p>
        </footer>
      </div>
    </>
  );
}
