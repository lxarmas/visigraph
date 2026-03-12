import { useState, useEffect, useRef } from 'react';

const API = import.meta.env.VITE_API_URL || '/api';

const SENTIMENT_COLORS = {
  positive: '#16a34a',
  neutral: '#92400e',
  negative: '#dc2626',
};

const SENTIMENT_LIGHT = {
  positive: '#f0fdf4',
  neutral: '#fffbeb',
  negative: '#fef2f2',
};

export default function App() {
  const [view, setView] = useState('analyze');
  const [question, setQuestion] = useState('');
  const [brandInput, setBrandInput] = useState('');
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState([]);
  const [dashLoading, setDashLoading] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(false);
  const [hoveredAdd, setHoveredAdd] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const brandInputRef = useRef(null);

  useEffect(() => {
    if (view === 'dashboard') fetchDashboard();
  }, [view]);

  useEffect(() => {
    if (result) {
      setAnimateIn(false);
      setTimeout(() => setAnimateIn(true), 30);
    }
  }, [result]);

  async function fetchDashboard() {
    setDashLoading(true);
    try {
      const r = await fetch(`${API}/dashboard`);
      const data = await r.json();
      setDashboard(data);
    } catch (e) { console.error(e); }
    finally { setDashLoading(false); }
  }

  function addBrand() {
    const trimmed = brandInput.trim();
    if (trimmed && !brands.includes(trimmed) && brands.length < 6) {
      setBrands([...brands, trimmed]);
      setBrandInput('');
      brandInputRef.current?.focus();
    }
  }

  function removeBrand(b) {
    setBrands(brands.filter(x => x !== b));
  }

  async function handleAnalyze() {
    if (!question.trim() || brands.length === 0) {
      setError('Enter a question and at least one brand to continue.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch(`${API}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), brands }),
      });
      if (!r.ok) throw new Error((await r.json()).error || 'Request failed');
      setResult(await r.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const sorted = result ? [...result.brandResults].sort((a, b) => b.score - a.score) : [];

  return (
    <div style={s.root}>

      {/* Top bar */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logoGroup}>
            <div style={s.logoMark}>V</div>
            <span style={s.logoName}>visigraph</span>
          </div>
          <nav style={s.nav}>
            {['analyze', 'dashboard'].map(v => (
              <button
                key={v}
                style={{ ...s.navBtn, ...(view === v ? s.navBtnActive : {}) }}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Thin accent line */}
      <div style={s.accentLine} />

      <main style={s.main}>
        {view === 'analyze' && (
          <>
            {/* Page title */}
            <div style={s.pageTitle}>
              <h1 style={s.h1}>Brand Visibility Analysis</h1>
              <p style={s.subtitle}>
                Ask any market question. Track up to six brands. See who the AI recommends — and who gets overlooked.
              </p>
            </div>

            <div style={s.twoCol}>

              {/* ── LEFT COLUMN ── */}
              <div style={s.leftCol}>

                {/* Question */}
                <div style={s.fieldGroup}>
                  <label style={s.label}>YOUR QUESTION</label>
                  <textarea
                    style={s.textarea}
                    placeholder="e.g. What are the best CRM tools for B2B sales teams?"
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    rows={4}
                  />
                  <p style={s.hint}>Ask a specific category question where brand names will appear naturally.</p>
                </div>

                {/* Examples */}
                <div style={s.fieldGroup}>
                  <label style={s.label}>EXAMPLES</label>
                  <div style={s.examples}>
                    {[
                      'What are the best running shoe brands?',
                      'Which CRM is best for B2B sales teams?',
                      'Top cloud storage solutions for enterprises?',
                      'Best project management tools for remote teams?',
                    ].map((ex, i) => (
                      <div
                        key={i}
                        style={s.exampleRow}
                        onClick={() => setQuestion(ex)}
                      >
                        <span style={s.exampleArrow}>→</span>
                        <span style={s.exampleText}>{ex}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scoring guide */}
                <div style={s.scoringGuide}>
                  <label style={s.label}>HOW SCORING WORKS</label>
                  <div style={s.scoringRows}>
                    {[
                      { score: '10', desc: 'Mentioned with positive sentiment', color: '#16a34a' },
                      { score: '7',  desc: 'Mentioned with neutral sentiment',  color: '#92400e' },
                      { score: '1',  desc: 'Mentioned with negative sentiment', color: '#dc2626' },
                      { score: '0',  desc: 'Not mentioned at all',              color: '#d1d5db' },
                    ].map(({ score, desc, color }) => (
                      <div key={score} style={s.scoringRow}>
                        <span style={{ ...s.scoreChip, color, borderColor: color + '44', background: color + '0a' }}>{score}</span>
                        <span style={s.scoringDesc}>{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* ── RIGHT COLUMN ── */}
              <div style={s.rightCol}>

                {/* Brand input */}
                <div style={s.fieldGroup}>
                  <label style={s.label}>
                    BRANDS TO COMPARE
                    <span style={s.counter}>{brands.length} / 6</span>
                  </label>

                  <div style={s.brandInputWrap}>
                    <input
                      ref={brandInputRef}
                      style={s.brandInput}
                      placeholder="Type a brand name and press Enter"
                      value={brandInput}
                      onChange={e => setBrandInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addBrand()}
                      disabled={brands.length >= 6}
                    />
                    <button
                      style={{
                        ...s.addBtn,
                        background: hoveredAdd ? '#111' : '#1a1a1a',
                        opacity: brands.length >= 6 ? 0.3 : 1,
                      }}
                      onMouseEnter={() => setHoveredAdd(true)}
                      onMouseLeave={() => setHoveredAdd(false)}
                      onClick={addBrand}
                      disabled={brands.length >= 6}
                    >
                      +
                    </button>
                  </div>

                  {/* Brand chips */}
                  <div style={s.chips}>
                    {brands.length === 0 && (
                      <span style={s.noChips}>No brands added yet</span>
                    )}
                    {brands.map((b, i) => (
                      <div key={b} style={s.chip}>
                        <span style={s.chipNum}>{i + 1}</span>
                        <span style={s.chipName}>{b}</span>
                        <button style={s.chipDel} onClick={() => removeBrand(b)}>×</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div style={s.divider} />

                {error && <p style={s.error}>{error}</p>}

                {/* Run button */}
                <button
                  style={{
                    ...s.runBtn,
                    background: loading ? '#f3f4f6' : hoveredBtn ? '#111' : '#1a1a1a',
                    color: loading ? '#9ca3af' : '#fff',
                    transform: hoveredBtn && !loading ? 'translateY(-2px)' : 'translateY(0)',
                    boxShadow: hoveredBtn && !loading ? '0 8px 24px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                  onMouseEnter={() => setHoveredBtn(true)}
                  onMouseLeave={() => setHoveredBtn(false)}
                  onClick={handleAnalyze}
                  disabled={loading}
                >
                  {loading ? (
                    <span style={s.loadingRow}>
                      <span style={s.spinner} />
                      Analyzing...
                    </span>
                  ) : 'Run Analysis →'}
                </button>

                {/* Empty state */}
                {!result && !loading && (
                  <div style={s.empty}>
                    <div style={s.emptyCircle} />
                    <p style={s.emptyLabel}>Results will appear here</p>
                  </div>
                )}

                {/* Results */}
                {result && (
                  <div style={s.results}>
                    <div style={s.resultsTitle}>
                      <span style={s.label}>RESULTS</span>
                      <p style={s.resultsQ}>"{result.question}"</p>
                    </div>

                    {sorted.map((br, i) => (
                      <div
                        key={br.brand}
                        style={{
                          ...s.resultRow,
                          animation: animateIn ? `fadeSlide 0.35s ease ${i * 0.07}s both` : 'none',
                          background: br.mentioned ? SENTIMENT_LIGHT[br.sentiment] : '#fafafa',
                          borderColor: br.mentioned ? SENTIMENT_COLORS[br.sentiment] + '22' : '#e5e7eb',
                        }}
                      >
                        <div style={s.resultLeft}>
                          <span style={s.resultRank}>#{i + 1}</span>
                          <div>
                            <div style={s.resultBrand}>{br.brand}</div>
                            {br.context && <div style={s.resultCtx}>"{br.context}"</div>}
                          </div>
                        </div>
                        <div style={s.resultRight}>
                          <div style={{
                            ...s.scorePill,
                            color: br.mentioned ? SENTIMENT_COLORS[br.sentiment] : '#9ca3af',
                            background: br.mentioned ? SENTIMENT_COLORS[br.sentiment] + '12' : '#f3f4f6',
                            border: `1px solid ${br.mentioned ? SENTIMENT_COLORS[br.sentiment] + '33' : '#e5e7eb'}`,
                          }}>
                            {br.score}<span style={s.scoreDenom}>/10</span>
                          </div>
                          <span style={{
                            ...s.badge,
                            color: br.mentioned ? SENTIMENT_COLORS[br.sentiment] : '#9ca3af',
                          }}>
                            {br.mentioned ? br.sentiment : 'absent'}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Full answer */}
                    <details style={s.answerDetails}>
                      <summary style={s.answerSummary}>Full AI answer</summary>
                      <div style={s.answerBody}>
                        {result.answerText.split('\n').filter(Boolean).map((p, i) => (
                          <p key={i} style={{ marginBottom: 14, lineHeight: 1.8 }}>{p}</p>
                        ))}
                      </div>
                    </details>
                  </div>
                )}

              </div>
            </div>
          </>
        )}

        {/* Dashboard */}
        {view === 'dashboard' && (
          <div style={s.dashWrap}>
            <div style={s.dashTop}>
              <div>
                <h1 style={s.h1}>History</h1>
                <p style={s.subtitle}>{dashboard.length} analyses stored in Neo4j</p>
              </div>
              <button style={s.refreshBtn} onClick={fetchDashboard}>
                {dashLoading ? 'Loading...' : '↺ Refresh'}
              </button>
            </div>

            {!dashLoading && dashboard.length === 0 && (
              <div style={s.empty}>
                <div style={s.emptyCircle} />
                <p style={s.emptyLabel}>No analyses yet — run your first query</p>
              </div>
            )}

            <div style={s.dashList}>
              {dashboard.map(entry => (
                <div key={entry.answerId} style={s.dashCard}>
                  <div style={s.dashCardTop}>
                    <p style={s.dashQ}>{entry.questionText}</p>
                    <span style={s.dashDate}>
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                  <div style={s.dashChips}>
                    {entry.brands.sort((a, b) => (b.mentioned ? 1 : 0) - (a.mentioned ? 1 : 0)).map(b => (
                      <div key={b.name} style={{
                        ...s.dashChip,
                        background: b.mentioned ? SENTIMENT_LIGHT[b.sentiment] : '#f9fafb',
                        borderColor: b.mentioned ? SENTIMENT_COLORS[b.sentiment] + '33' : '#e5e7eb',
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                          background: b.mentioned ? SENTIMENT_COLORS[b.sentiment] : '#d1d5db',
                        }} />
                        <span style={{ color: b.mentioned ? '#111' : '#9ca3af', fontSize: 12 }}>{b.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { font-size: 16px; }
        body { background: #fff; -webkit-font-smoothing: antialiased; }
        textarea, input { font-family: inherit; }
        textarea:focus, input:focus { outline: none; border-color: #111 !important; }
        textarea::placeholder, input::placeholder { color: #c4c4c4; }
        details > summary { list-style: none; cursor: pointer; }
        details > summary::-webkit-details-marker { display: none; }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .example-row:hover span:last-child { color: #111 !important; }
        .example-row:hover span:first-child { color: #111 !important; }
      `}</style>
    </div>
  );
}

const s = {
  root: {
    minHeight: '100vh',
    background: '#ffffff',
    color: '#111',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },

  header: {
    borderBottom: '1px solid #f0f0f0',
    background: '#fff',
    position: 'sticky', top: 0, zIndex: 100,
  },
  headerInner: {
    maxWidth: 1200, margin: '0 auto',
    padding: '0 48px',
    height: 64,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  logoGroup: { display: 'flex', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 32, height: 32, borderRadius: 8,
    background: '#111', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em',
  },
  logoName: {
    fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em', color: '#111',
  },

  nav: { display: 'flex', gap: 2 },
  navBtn: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 13, fontWeight: 500,
    background: 'transparent', border: 'none',
    color: '#9ca3af', padding: '6px 14px', borderRadius: 6,
    cursor: 'pointer', letterSpacing: '-0.01em',
    transition: 'all 0.15s ease',
  },
  navBtnActive: {
    color: '#111', background: '#f3f4f6',
  },

  accentLine: {
    height: 2,
    background: 'linear-gradient(90deg, #111 0%, #6b7280 50%, transparent 100%)',
    opacity: 0.06,
  },

  main: {
    maxWidth: 1200, margin: '0 auto',
    padding: '64px 48px 120px',
  },

  pageTitle: { marginBottom: 56 },
  h1: {
    fontFamily: "'Instrument Serif', Georgia, serif",
    fontSize: 42, fontWeight: 400, color: '#111',
    letterSpacing: '-0.02em', lineHeight: 1.1,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 15, color: '#6b7280', lineHeight: 1.6,
    fontWeight: 400, maxWidth: 520,
  },

  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 80,
    alignItems: 'start',
  },

  leftCol: { display: 'flex', flexDirection: 'column', gap: 40 },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 28 },

  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: {
    fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
    color: '#9ca3af', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center',
  },
  counter: { fontWeight: 400, color: '#d1d5db' },

  textarea: {
    width: '100%',
    background: '#fafafa',
    border: '1px solid #e5e7eb',
    borderRadius: 10, color: '#111',
    fontSize: 15, lineHeight: 1.6,
    padding: '16px 18px', resize: 'none',
    transition: 'border-color 0.15s ease',
    fontFamily: "'Inter', sans-serif",
  },
  hint: {
    fontSize: 12, color: '#9ca3af', lineHeight: 1.5,
  },

  examples: {
    display: 'flex', flexDirection: 'column', gap: 2,
  },
  exampleRow: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
    transition: 'background 0.15s ease',
    background: 'transparent',
  },
  exampleArrow: {
    fontSize: 12, color: '#d1d5db', flexShrink: 0, marginTop: 1,
    transition: 'color 0.15s ease',
  },
  exampleText: {
    fontSize: 13, color: '#6b7280', lineHeight: 1.5,
    transition: 'color 0.15s ease',
  },

  scoringGuide: { display: 'flex', flexDirection: 'column', gap: 10 },
  scoringRows: { display: 'flex', flexDirection: 'column', gap: 8 },
  scoringRow: { display: 'flex', alignItems: 'center', gap: 12 },
  scoreChip: {
    fontSize: 12, fontWeight: 600, fontFamily: "'Inter', monospace",
    padding: '3px 8px', borderRadius: 6, border: '1px solid',
    minWidth: 32, textAlign: 'center', flexShrink: 0,
  },
  scoringDesc: { fontSize: 13, color: '#6b7280' },

  brandInputWrap: { display: 'flex', gap: 8 },
  brandInput: {
    flex: 1, background: '#fafafa',
    border: '1px solid #e5e7eb', borderRadius: 10,
    color: '#111', fontSize: 14,
    padding: '12px 16px',
    fontFamily: "'Inter', sans-serif",
    transition: 'border-color 0.15s ease',
  },
  addBtn: {
    width: 44, height: 44, borderRadius: 10,
    border: 'none', color: '#fff',
    fontSize: 20, fontWeight: 300, cursor: 'pointer',
    flexShrink: 0, transition: 'all 0.2s ease',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  chips: {
    display: 'flex', flexWrap: 'wrap', gap: 8, minHeight: 36,
    alignItems: 'center',
  },
  noChips: { fontSize: 13, color: '#d1d5db' },
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: '#f9fafb', border: '1px solid #e5e7eb',
    borderRadius: 100, padding: '5px 10px 5px 6px',
    fontSize: 13, color: '#374151',
    transition: 'all 0.15s ease',
  },
  chipNum: {
    width: 20, height: 20, borderRadius: '50%',
    background: '#111', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 9, fontWeight: 700, flexShrink: 0,
  },
  chipName: { fontWeight: 500 },
  chipDel: {
    background: 'none', border: 'none', color: '#d1d5db',
    cursor: 'pointer', fontSize: 16, lineHeight: 1,
    padding: '0 0 0 2px', transition: 'color 0.15s',
  },

  divider: { height: 1, background: '#f3f4f6' },

  error: {
    fontSize: 13, color: '#dc2626',
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 8, padding: '10px 14px',
  },

  runBtn: {
    width: '100%', padding: '15px 24px',
    border: 'none', borderRadius: 10,
    fontSize: 14, fontWeight: 600,
    letterSpacing: '-0.01em',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    fontFamily: "'Inter', sans-serif",
  },
  loadingRow: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 10,
  },
  spinner: {
    width: 14, height: 14,
    border: '2px solid #e5e7eb',
    borderTopColor: '#9ca3af',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.6s linear infinite',
  },

  empty: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '60px 0', gap: 16,
  },
  emptyCircle: {
    width: 48, height: 48, borderRadius: '50%',
    border: '1px solid #e5e7eb',
  },
  emptyLabel: { fontSize: 13, color: '#d1d5db', letterSpacing: '0.02em' },

  results: { display: 'flex', flexDirection: 'column', gap: 10 },
  resultsTitle: { marginBottom: 6 },
  resultsQ: {
    fontFamily: "'Instrument Serif', Georgia, serif",
    fontSize: 16, color: '#6b7280',
    fontStyle: 'italic', marginTop: 4, lineHeight: 1.4,
  },

  resultRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid',
    borderRadius: 10, padding: '14px 18px',
    gap: 16, transition: 'all 0.2s ease',
  },
  resultLeft: { display: 'flex', alignItems: 'center', gap: 14, flex: 1 },
  resultRank: {
    fontSize: 11, color: '#d1d5db',
    fontWeight: 600, minWidth: 24,
    fontFamily: "'Inter', monospace",
  },
  resultBrand: { fontSize: 15, fontWeight: 600, color: '#111', letterSpacing: '-0.01em' },
  resultCtx: {
    fontSize: 12, color: '#6b7280', marginTop: 3,
    fontStyle: 'italic', lineHeight: 1.4,
  },
  resultRight: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'flex-end', gap: 4, flexShrink: 0,
  },
  scorePill: {
    fontSize: 18, fontWeight: 700,
    padding: '4px 12px', borderRadius: 8,
    letterSpacing: '-0.02em',
    fontFamily: "'Instrument Serif', Georgia, serif",
  },
  scoreDenom: { fontSize: 11, fontWeight: 400, opacity: 0.6 },
  badge: {
    fontSize: 10, fontWeight: 600,
    letterSpacing: '0.08em', textTransform: 'uppercase',
  },

  answerDetails: {
    border: '1px solid #f3f4f6', borderRadius: 10,
    overflow: 'hidden', marginTop: 8,
  },
  answerSummary: {
    padding: '12px 18px',
    fontSize: 12, fontWeight: 500, color: '#9ca3af',
    letterSpacing: '0.02em',
    background: '#fafafa',
    transition: 'background 0.15s ease',
  },
  answerBody: {
    padding: '18px',
    fontSize: 14, color: '#4b5563', lineHeight: 1.8,
    borderTop: '1px solid #f3f4f6',
  },

  // Dashboard
  dashWrap: { maxWidth: 760, margin: '0 auto' },
  dashTop: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 48,
  },
  refreshBtn: {
    fontSize: 13, fontWeight: 500,
    background: '#f9fafb', border: '1px solid #e5e7eb',
    color: '#6b7280', padding: '9px 16px', borderRadius: 8,
    cursor: 'pointer', transition: 'all 0.15s ease',
    fontFamily: "'Inter', sans-serif",
  },
  dashList: { display: 'flex', flexDirection: 'column', gap: 12 },
  dashCard: {
    border: '1px solid #f0f0f0', borderRadius: 12,
    padding: '20px 24px', background: '#fff',
    transition: 'border-color 0.15s ease',
  },
  dashCardTop: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', gap: 16, marginBottom: 14,
  },
  dashQ: {
    fontSize: 15, color: '#111', lineHeight: 1.4,
    fontWeight: 500, flex: 1,
    fontFamily: "'Instrument Serif', Georgia, serif",
  },
  dashDate: { fontSize: 12, color: '#9ca3af', flexShrink: 0, fontWeight: 400 },
  dashChips: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  dashChip: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    border: '1px solid', borderRadius: 100,
    padding: '4px 10px', fontSize: 12,
    fontWeight: 500,
  },
};
