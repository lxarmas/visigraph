import { useState, useEffect, useRef } from 'react';

const API = '/api';

const SENTIMENT_COLORS = {
  positive: '#4ade80',
  neutral: '#facc15',
  negative: '#f87171',
};

const SENTIMENT_BG = {
  positive: 'rgba(74,222,128,0.12)',
  neutral: 'rgba(250,204,21,0.12)',
  negative: 'rgba(248,113,113,0.12)',
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
  const brandInputRef = useRef(null);

  useEffect(() => {
    if (view === 'dashboard') fetchDashboard();
  }, [view]);

  async function fetchDashboard() {
    setDashLoading(true);
    try {
      const r = await fetch(`${API}/dashboard`);
      const data = await r.json();
      setDashboard(data);
    } catch (e) {
      console.error(e);
    } finally {
      setDashLoading(false);
    }
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
      setError('Please enter a question and at least one brand.');
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
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || 'Request failed');
      }
      const data = await r.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function scoreBar(score) {
    const pct = (score / 10) * 100;
    const color = score >= 7 ? '#4ade80' : score >= 4 ? '#facc15' : score >= 1 ? '#fb923c' : '#333';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#1a1a1a', overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: 3,
            background: color, transition: 'width 0.8s cubic-bezier(.4,0,.2,1)'
          }} />
        </div>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#666', minWidth: 28 }}>
          {score}/10
        </span>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <div style={styles.gridBg} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logoArea}>
          <div style={styles.logoDot} />
          <span style={styles.logoText}>Visigraph</span>
          <span style={styles.logoBadge}>BETA</span>
        </div>
        <nav style={styles.nav}>
          <button style={{ ...styles.navBtn, ...(view === 'analyze' ? styles.navActive : {}) }} onClick={() => setView('analyze')}>
            Analyze
          </button>
          <button style={{ ...styles.navBtn, ...(view === 'dashboard' ? styles.navActive : {}) }} onClick={() => setView('dashboard')}>
            Dashboard
          </button>
        </nav>
      </header>

      <main style={styles.main}>
        {view === 'analyze' && (
          <div style={styles.analyzeLayout}>

            {/* Left Panel */}
            <div style={styles.inputPanel}>

              {/* How it works */}
              <div style={styles.howItWorks}>
                <div style={styles.howTitle}>HOW IT WORKS</div>
                <div style={styles.howStep}>
                  <span style={styles.howNum}>1</span>
                  <span>Ask any market or category question</span>
                </div>
                <div style={styles.howStep}>
                  <span style={styles.howNum}>2</span>
                  <span>Add up to 6 brands you want to track</span>
                </div>
                <div style={styles.howStep}>
                  <span style={styles.howNum}>3</span>
                  <span>We score each brand 0–10 based on how the AI mentions them</span>
                </div>
                <div style={styles.tipBox}>
                  <div style={styles.tipTitle}>✓ GOOD QUESTIONS</div>
                  <div style={styles.tipText}>
                    "What are the best running shoe brands?"<br />
                    "Which CRM do you recommend for sales teams?"<br />
                    "What project management tools do you suggest?"<br />
                    "Which cloud provider is best for startups?"
                  </div>
                  <div style={{ ...styles.tipTitle, color: '#f87171', marginTop: 10 }}>✗ AVOID</div>
                  <div style={styles.tipText}>
                    Vague questions where brand names won't appear naturally
                  </div>
                </div>
              </div>

              {/* Question */}
              <div style={styles.sectionLabel}>YOUR QUESTION</div>
              <textarea
                style={styles.textarea}
                placeholder="e.g. What are the best CRM tools for B2B sales teams?"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                rows={3}
              />

              {/* Brands */}
              <div style={{ ...styles.sectionLabel, marginTop: 20 }}>BRANDS TO COMPARE <span style={{ color: '#333' }}>({brands.length}/6)</span></div>
              <div style={styles.brandRow}>
                <input
                  ref={brandInputRef}
                  style={styles.brandInput}
                  placeholder="Type a brand and press Enter or +"
                  value={brandInput}
                  onChange={e => setBrandInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addBrand()}
                />
                <button style={styles.addBtn} onClick={addBrand} disabled={brands.length >= 6}>+</button>
              </div>

              <div style={styles.chipRow}>
                {brands.map((b, i) => (
                  <span key={b} style={styles.chip}>
                    <span style={styles.chipNum}>{i + 1}</span>
                    {b}
                    <button style={styles.chipX} onClick={() => removeBrand(b)}>×</button>
                  </span>
                ))}
                {brands.length === 0 && (
                  <span style={{ color: '#333', fontSize: 12, fontFamily: 'DM Mono, monospace' }}>
                    No brands added yet — add up to 6
                  </span>
                )}
              </div>

              {error && <div style={styles.error}>{error}</div>}

              <button
                style={{ ...styles.analyzeBtn, ...(loading ? styles.analyzeBtnLoading : {}) }}
                onClick={handleAnalyze}
                disabled={loading}
              >
                {loading ? (
                  <span style={styles.spinnerWrap}>
                    <span style={styles.spinner} />
                    Analyzing...
                  </span>
                ) : '→ Run Visibility Analysis'}
              </button>
            </div>

            {/* Right Panel */}
            <div style={styles.resultPanel}>
              {!result && !loading && (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>◎</div>
                  <div style={styles.emptyText}>
                    Results will appear here.<br />
                    Each brand gets a visibility score from 0 to 10.
                  </div>
                  <div style={styles.scoreLegend}>
                    <div style={styles.legendItem}><span style={{ ...styles.legendDot, background: '#4ade80' }} />7–10 Mentioned positively</div>
                    <div style={styles.legendItem}><span style={{ ...styles.legendDot, background: '#facc15' }} />4–6 Mentioned neutrally</div>
                    <div style={styles.legendItem}><span style={{ ...styles.legendDot, background: '#fb923c' }} />1–3 Mentioned negatively</div>
                    <div style={styles.legendItem}><span style={{ ...styles.legendDot, background: '#333' }} />0 Not mentioned</div>
                  </div>
                </div>
              )}

              {loading && (
                <div style={styles.emptyState}>
                  <div style={{ fontSize: 32, color: '#333', animation: 'spin 1s linear infinite' }}>◌</div>
                  <div style={styles.emptyText}>Querying AI and scoring brands...</div>
                </div>
              )}

              {result && (
                <div>
                  <div style={styles.resultQuestion}>"{result.question}"</div>

                  {/* Scores */}
                  <div style={styles.sectionLabel}>VISIBILITY SCORES</div>
                  <div style={styles.scoresGrid}>
                    {result.brandResults
                      .sort((a, b) => b.score - a.score)
                      .map((br, i) => (
                        <div key={br.brand} style={{
                          ...styles.scoreCard,
                          borderColor: br.mentioned ? SENTIMENT_COLORS[br.sentiment] + '44' : '#1a1a1a',
                          background: br.mentioned ? SENTIMENT_BG[br.sentiment] : '#0d0d0d'
                        }}>
                          <div style={styles.scoreCardTop}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={styles.rankNum}>#{i + 1}</span>
                              <span style={styles.brandName}>{br.brand}</span>
                            </div>
                            <span style={{
                              ...styles.sentimentTag,
                              background: br.mentioned ? SENTIMENT_COLORS[br.sentiment] + '22' : '#1a1a1a',
                              color: br.mentioned ? SENTIMENT_COLORS[br.sentiment] : '#444',
                            }}>
                              {br.mentioned ? br.sentiment : 'absent'}
                            </span>
                          </div>
                          {scoreBar(br.score)}
                          {br.context && (
                            <div style={styles.context}>"{br.context}"</div>
                          )}
                        </div>
                      ))}
                  </div>

                  {/* Answer */}
                  <div style={{ ...styles.sectionLabel, marginTop: 28 }}>AI ANSWER</div>
                  <div style={styles.answerBox}>
                    {result.answerText.split('\n').filter(Boolean).map((para, i) => (
                      <p key={i} style={{ margin: '0 0 12px', lineHeight: 1.8 }}>{para}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <div style={styles.dashLayout}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <div style={styles.sectionLabel}>ANALYSIS HISTORY</div>
                <div style={{ color: '#444', fontSize: 13, fontFamily: 'DM Mono, monospace' }}>
                  {dashboard.length} queries stored
                </div>
              </div>
              <button style={styles.refreshBtn} onClick={fetchDashboard} disabled={dashLoading}>
                {dashLoading ? '...' : '↺ Refresh'}
              </button>
            </div>

            {dashLoading && <div style={styles.emptyState}><div style={styles.emptyText}>Loading...</div></div>}

            {!dashLoading && dashboard.length === 0 && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>◎</div>
                <div style={styles.emptyText}>No analyses yet. Run your first query!</div>
              </div>
            )}

            {!dashLoading && dashboard.map(entry => (
              <div key={entry.answerId} style={styles.dashCard}>
                <div style={styles.dashCardHeader}>
                  <span style={styles.dashQuestion}>{entry.questionText}</span>
                  <span style={styles.dashDate}>
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div style={styles.dashBrandRow}>
                  {entry.brands
                    .sort((a, b) => (b.mentioned ? 1 : 0) - (a.mentioned ? 1 : 0))
                    .map(b => (
                      <div key={b.name} style={styles.dashBrandChip}>
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%',
                          background: b.mentioned ? SENTIMENT_COLORS[b.sentiment] : '#2a2a2a',
                          display: 'inline-block', marginRight: 6, flexShrink: 0
                        }} />
                        <span style={{ color: b.mentioned ? '#ccc' : '#444' }}>{b.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #0a0a0a; }
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea::placeholder { color: #333; }
        input::placeholder { color: #333; }
        textarea:focus, input:focus { outline: none; border-color: #c8f545 !important; }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: '100vh', background: '#0a0a0a',
    color: '#e8e8e8', fontFamily: 'Fraunces, Georgia, serif',
    position: 'relative',
  },
  gridBg: {
    position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
    backgroundImage: `linear-gradient(rgba(200,245,69,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(200,245,69,0.025) 1px, transparent 1px)`,
    backgroundSize: '48px 48px',
  },
  header: {
    position: 'relative', zIndex: 10,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 36px', borderBottom: '1px solid #141414',
  },
  logoArea: { display: 'flex', alignItems: 'center', gap: 10 },
  logoDot: { width: 10, height: 10, borderRadius: '50%', background: '#c8f545', boxShadow: '0 0 12px #c8f54566' },
  logoText: { fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, fontWeight: 300, color: '#e8e8e8' },
  logoBadge: {
    fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.15em',
    background: '#141414', color: '#444', padding: '2px 6px', borderRadius: 2, border: '1px solid #1e1e1e',
  },
  nav: { display: 'flex', gap: 4 },
  navBtn: {
    fontFamily: 'DM Mono, monospace', fontSize: 12, letterSpacing: '0.08em',
    background: 'transparent', border: '1px solid #1e1e1e', color: '#555',
    padding: '7px 16px', borderRadius: 4, cursor: 'pointer',
  },
  navActive: { background: '#141414', color: '#c8f545', borderColor: '#c8f54522' },
  main: { position: 'relative', zIndex: 5, padding: '32px 36px', maxWidth: 1200, margin: '0 auto' },
  analyzeLayout: { display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24 },
  inputPanel: { background: '#0d0d0d', border: '1px solid #181818', borderRadius: 10, padding: 24, height: 'fit-content' },

  howItWorks: { marginBottom: 24, padding: '16px', background: '#111', border: '1px solid #1a1a1a', borderRadius: 8 },
  howTitle: { fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.15em', color: '#555', marginBottom: 12 },
  howStep: {
    display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8,
    fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#666', lineHeight: 1.5,
  },
  howNum: {
    background: '#c8f545', color: '#0a0a0a', width: 18, height: 18, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1,
  },
  tipBox: { marginTop: 14, paddingTop: 14, borderTop: '1px solid #1a1a1a' },
  tipTitle: { fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.1em', color: '#4ade80', marginBottom: 6 },
  tipText: { fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#444', lineHeight: 1.8 },

  sectionLabel: { fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.15em', color: '#444', marginBottom: 10 },
  textarea: {
    width: '100%', background: '#111', border: '1px solid #1e1e1e',
    borderRadius: 6, color: '#ddd', fontFamily: 'Fraunces, Georgia, serif',
    fontSize: 14, lineHeight: 1.6, padding: '12px 14px', resize: 'vertical',
  },
  brandRow: { display: 'flex', gap: 8, marginBottom: 10 },
  brandInput: {
    flex: 1, background: '#111', border: '1px solid #1e1e1e',
    borderRadius: 6, color: '#ddd', fontFamily: 'DM Mono, monospace',
    fontSize: 13, padding: '9px 12px',
  },
  addBtn: {
    background: '#c8f545', border: 'none', color: '#0a0a0a',
    width: 38, borderRadius: 6, fontSize: 22, cursor: 'pointer', fontWeight: 600,
  },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 32 },
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: '#141414', border: '1px solid #222', borderRadius: 20,
    padding: '4px 10px 4px 8px', fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#bbb',
  },
  chipNum: {
    background: '#c8f54522', color: '#c8f545', width: 16, height: 16,
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 9, fontWeight: 700,
  },
  chipX: { background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 },
  error: {
    marginTop: 12, padding: '10px 14px', background: '#150a0a',
    border: '1px solid #3a1515', borderRadius: 6,
    fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#f87171',
  },
  analyzeBtn: {
    marginTop: 20, width: '100%', padding: '14px',
    background: '#c8f545', border: 'none', borderRadius: 6,
    fontFamily: 'DM Mono, monospace', fontSize: 13, letterSpacing: '0.08em',
    color: '#0a0a0a', fontWeight: 700, cursor: 'pointer',
  },
  analyzeBtnLoading: { background: '#1a1a1a', color: '#444' },
  spinnerWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
  spinner: {
    width: 14, height: 14, border: '2px solid #333',
    borderTopColor: '#666', borderRadius: '50%', display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  },

  resultPanel: { background: '#0d0d0d', border: '1px solid #181818', borderRadius: 10, padding: 28, minHeight: 500 },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, gap: 16 },
  emptyIcon: { fontSize: 40, color: '#222' },
  emptyText: { fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#333', textAlign: 'center', lineHeight: 1.7 },
  scoreLegend: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#333' },
  legendDot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block', flexShrink: 0 },

  resultQuestion: {
    fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic',
    fontSize: 16, color: '#666', marginBottom: 24, lineHeight: 1.5,
  },
  scoresGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 },
  scoreCard: { border: '1px solid #1a1a1a', borderRadius: 8, padding: 14 },
  scoreCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rankNum: { fontFamily: 'DM Mono, monospace', fontSize: 10, color: '#444' },
  brandName: { fontFamily: 'Fraunces, Georgia, serif', fontSize: 15, fontWeight: 600, color: '#e0e0e0' },
  sentimentTag: {
    fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.1em',
    padding: '3px 8px', borderRadius: 20,
  },
  context: {
    marginTop: 8, fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic',
    fontSize: 11, color: '#555', lineHeight: 1.5,
    borderLeft: '2px solid #1e1e1e', paddingLeft: 8,
  },
  answerBox: {
    background: '#111', border: '1px solid #1a1a1a', borderRadius: 8,
    padding: '20px 24px', fontFamily: 'Fraunces, Georgia, serif',
    fontSize: 14, color: '#888', lineHeight: 1.8,
  },

  dashLayout: { maxWidth: 800, margin: '0 auto' },
  dashCard: { background: '#0d0d0d', border: '1px solid #181818', borderRadius: 8, padding: '18px 22px', marginBottom: 10 },
  dashCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 16 },
  dashQuestion: { fontFamily: 'Fraunces, Georgia, serif', fontSize: 15, color: '#ccc', flex: 1 },
  dashDate: { fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#333', flexShrink: 0 },
  dashBrandRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  dashBrandChip: {
    display: 'inline-flex', alignItems: 'center',
    fontFamily: 'DM Mono, monospace', fontSize: 12,
    background: '#111', border: '1px solid #1a1a1a', borderRadius: 20, padding: '4px 12px',
  },
  refreshBtn: {
    fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: '0.05em',
    background: '#111', border: '1px solid #1e1e1e', color: '#555',
    padding: '7px 14px', borderRadius: 4, cursor: 'pointer',
  },
};
