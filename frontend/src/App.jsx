import { useState, useEffect, useRef } from 'react';

const API = '/api';

const PRESET_QUESTIONS = [
  'What is the best project management software for remote teams?',
  'Which CRM tools do you recommend for B2B sales?',
  'What are the top cloud storage solutions for enterprises?',
  'Which email marketing platforms are most effective?',
  'What are the leading DevOps tools for CI/CD pipelines?',
];

const PRESET_BRANDS = [
  ['Notion', 'Asana', 'Linear', 'Jira', 'Monday.com', 'ClickUp'],
  ['Salesforce', 'HubSpot', 'Pipedrive', 'Zoho CRM'],
  ['AWS S3', 'Google Drive', 'Dropbox', 'OneDrive'],
  ['Mailchimp', 'Klaviyo', 'Brevo', 'ActiveCampaign'],
  ['GitHub Actions', 'CircleCI', 'Jenkins', 'GitLab CI'],
];

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
  const [view, setView] = useState('analyze'); // 'analyze' | 'dashboard'
  const [question, setQuestion] = useState('');
  const [brandInput, setBrandInput] = useState('');
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState([]);
  const [dashLoading, setDashLoading] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
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

  function loadPreset(idx) {
    setQuestion(PRESET_QUESTIONS[idx]);
    setBrands(PRESET_BRANDS[idx]);
    setPresetOpen(false);
    setResult(null);
    setError('');
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
    const color = score >= 7 ? '#4ade80' : score >= 4 ? '#facc15' : score >= 1 ? '#fb923c' : '#444';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          flex: 1, height: 6, borderRadius: 3, background: '#1a1a1a', overflow: 'hidden'
        }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: 3,
            background: color, transition: 'width 0.6s cubic-bezier(.4,0,.2,1)'
          }} />
        </div>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#888', minWidth: 24 }}>
          {score}/10
        </span>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {/* Background grid */}
      <div style={styles.gridBg} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logoArea}>
          <div style={styles.logoDot} />
          <span style={styles.logoText}>AI Visibility Tracker</span>
          <span style={styles.logoBadge}>BETA</span>
        </div>
        <nav style={styles.nav}>
          <button
            style={{ ...styles.navBtn, ...(view === 'analyze' ? styles.navActive : {}) }}
            onClick={() => setView('analyze')}
          >
            Analyze
          </button>
          <button
            style={{ ...styles.navBtn, ...(view === 'dashboard' ? styles.navActive : {}) }}
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </button>
        </nav>
      </header>

      <main style={styles.main}>
        {view === 'analyze' && (
          <div style={styles.analyzeLayout}>
            {/* Left panel — input */}
            <div style={styles.inputPanel}>
              <div style={styles.sectionLabel}>QUERY</div>

              {/* Presets */}
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <button
                  style={styles.presetBtn}
                  onClick={() => setPresetOpen(v => !v)}
                >
                  Load example ↓
                </button>
                {presetOpen && (
                  <div style={styles.presetDropdown}>
                    {PRESET_QUESTIONS.map((q, i) => (
                      <div key={i} style={styles.presetItem} onClick={() => loadPreset(i)}>
                        {q}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <textarea
                style={styles.textarea}
                placeholder="e.g. What is the best project management software for remote teams?"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                rows={3}
              />

              <div style={{ ...styles.sectionLabel, marginTop: 24 }}>BRANDS TO TRACK</div>
              <div style={styles.brandRow}>
                <input
                  ref={brandInputRef}
                  style={styles.brandInput}
                  placeholder="Type a brand name..."
                  value={brandInput}
                  onChange={e => setBrandInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addBrand()}
                />
                <button style={styles.addBtn} onClick={addBrand} disabled={brands.length >= 6}>
                  +
                </button>
              </div>

              <div style={styles.chipRow}>
                {brands.map(b => (
                  <span key={b} style={styles.chip}>
                    {b}
                    <button style={styles.chipX} onClick={() => removeBrand(b)}>×</button>
                  </span>
                ))}
                {brands.length === 0 && (
                  <span style={{ color: '#444', fontSize: 13, fontFamily: 'DM Mono, monospace' }}>
                    No brands added yet
                  </span>
                )}
              </div>
              <div style={{ color: '#555', fontSize: 11, fontFamily: 'DM Mono, monospace', marginTop: 4 }}>
                {brands.length}/6 brands
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
                ) : '→ Run Analysis'}
              </button>
            </div>

            {/* Right panel — results */}
            <div style={styles.resultPanel}>
              {!result && !loading && (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>◎</div>
                  <div style={styles.emptyText}>
                    Ask a question and select brands<br />to see how they appear in AI answers.
                  </div>
                </div>
              )}

              {loading && (
                <div style={styles.emptyState}>
                  <div style={{ ...styles.emptyIcon, animation: 'spin 1s linear infinite' }}>◌</div>
                  <div style={styles.emptyText}>Querying the model and parsing results...</div>
                </div>
              )}

              {result && (
                <div>
                  {/* Scores table */}
                  <div style={styles.sectionLabel}>VISIBILITY SCORES</div>
                  <div style={styles.scoresGrid}>
                    {result.brandResults.map(br => (
                      <div key={br.brand} style={{
                        ...styles.scoreCard,
                        borderColor: br.mentioned ? SENTIMENT_COLORS[br.sentiment] + '55' : '#222',
                        background: br.mentioned ? SENTIMENT_BG[br.sentiment] : 'transparent'
                      }}>
                        <div style={styles.scoreCardTop}>
                          <span style={styles.brandName}>{br.brand}</span>
                          <span style={{
                            ...styles.sentimentTag,
                            background: br.mentioned ? SENTIMENT_COLORS[br.sentiment] + '22' : '#222',
                            color: br.mentioned ? SENTIMENT_COLORS[br.sentiment] : '#555',
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

                  {/* LLM Answer */}
                  <div style={{ ...styles.sectionLabel, marginTop: 28 }}>LLM ANSWER</div>
                  <div style={styles.answerBox}>
                    {result.answerText.split('\n').filter(Boolean).map((para, i) => (
                      <p key={i} style={{ margin: '0 0 12px', lineHeight: 1.7 }}>{para}</p>
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
                <div style={styles.sectionLabel}>HISTORY</div>
                <div style={{ color: '#666', fontSize: 13, fontFamily: 'DM Mono, monospace' }}>
                  {dashboard.length} analyses stored in Neo4j
                </div>
              </div>
              <button style={styles.refreshBtn} onClick={fetchDashboard} disabled={dashLoading}>
                {dashLoading ? '...' : '↺ Refresh'}
              </button>
            </div>

            {dashLoading && (
              <div style={styles.emptyState}><div style={styles.emptyText}>Loading from Neo4j...</div></div>
            )}

            {!dashLoading && dashboard.length === 0 && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>◎</div>
                <div style={styles.emptyText}>No analyses yet. Run your first query to see results here.</div>
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
                  {entry.brands.map(b => (
                    <div key={b.name} style={styles.dashBrandChip}>
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: b.mentioned ? SENTIMENT_COLORS[b.sentiment] : '#333',
                        display: 'inline-block', marginRight: 6, flexShrink: 0
                      }} />
                      <span style={{ color: b.mentioned ? '#ddd' : '#555' }}>{b.name}</span>
                      {b.mentioned && (
                        <span style={{ color: '#555', fontSize: 10, marginLeft: 4 }}>
                          [{b.sentiment}]
                        </span>
                      )}
                    </div>
                  ))}
                  {entry.brands.length === 0 && (
                    <span style={{ color: '#444', fontSize: 12 }}>No brand data</span>
                  )}
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
        textarea::placeholder { color: #444; }
        input::placeholder { color: #444; }
        textarea:focus, input:focus { outline: none; border-color: #c8f545 !important; }
        button:hover { opacity: 0.85; }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: '100vh',
    background: '#0a0a0a',
    color: '#e8e8e8',
    fontFamily: 'Fraunces, Georgia, serif',
    position: 'relative',
    overflow: 'hidden',
  },
  gridBg: {
    position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
    backgroundImage: `
      linear-gradient(rgba(200,245,69,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(200,245,69,0.03) 1px, transparent 1px)
    `,
    backgroundSize: '48px 48px',
  },
  header: {
    position: 'relative', zIndex: 10,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 36px', borderBottom: '1px solid #1a1a1a',
  },
  logoArea: { display: 'flex', alignItems: 'center', gap: 10 },
  logoDot: {
    width: 10, height: 10, borderRadius: '50%',
    background: '#c8f545', boxShadow: '0 0 12px #c8f54588',
  },
  logoText: {
    fontFamily: 'Fraunces, Georgia, serif',
    fontSize: 18, fontWeight: 300, color: '#e8e8e8', letterSpacing: '0.02em',
  },
  logoBadge: {
    fontFamily: 'DM Mono, monospace', fontSize: 9, letterSpacing: '0.15em',
    background: '#1a1a1a', color: '#555', padding: '2px 6px', borderRadius: 2,
    border: '1px solid #222',
  },
  nav: { display: 'flex', gap: 4 },
  navBtn: {
    fontFamily: 'DM Mono, monospace', fontSize: 12, letterSpacing: '0.08em',
    background: 'transparent', border: '1px solid #222', color: '#666',
    padding: '7px 16px', borderRadius: 4, cursor: 'pointer', transition: 'all 0.15s',
  },
  navActive: { background: '#1a1a1a', color: '#c8f545', borderColor: '#c8f54533' },
  main: {
    position: 'relative', zIndex: 5, padding: '36px',
    maxWidth: 1200, margin: '0 auto',
  },
  analyzeLayout: {
    display: 'grid', gridTemplateColumns: '380px 1fr', gap: 28,
    '@media (max-width: 768px)': { gridTemplateColumns: '1fr' },
  },
  inputPanel: {
    background: '#0f0f0f', border: '1px solid #1c1c1c',
    borderRadius: 10, padding: 24,
    height: 'fit-content',
  },
  sectionLabel: {
    fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.15em',
    color: '#555', marginBottom: 10,
  },
  textarea: {
    width: '100%', background: '#111', border: '1px solid #222',
    borderRadius: 6, color: '#e0e0e0', fontFamily: 'Fraunces, Georgia, serif',
    fontSize: 14, lineHeight: 1.6, padding: '12px 14px', resize: 'vertical',
    transition: 'border-color 0.15s',
  },
  brandRow: { display: 'flex', gap: 8, marginBottom: 10 },
  brandInput: {
    flex: 1, background: '#111', border: '1px solid #222',
    borderRadius: 6, color: '#e0e0e0', fontFamily: 'DM Mono, monospace',
    fontSize: 13, padding: '9px 12px', transition: 'border-color 0.15s',
  },
  addBtn: {
    background: '#c8f545', border: 'none', color: '#0a0a0a',
    width: 36, borderRadius: 6, fontSize: 20, cursor: 'pointer',
    fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 32 },
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: 20, padding: '4px 10px 4px 12px',
    fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#ccc',
  },
  chipX: {
    background: 'none', border: 'none', color: '#555', cursor: 'pointer',
    fontSize: 16, padding: 0, lineHeight: 1,
  },
  presetBtn: {
    fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: '0.05em',
    background: '#111', border: '1px solid #222', color: '#666',
    padding: '5px 12px', borderRadius: 4, cursor: 'pointer',
  },
  presetDropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
    background: '#141414', border: '1px solid #2a2a2a', borderRadius: 6,
    marginTop: 4, overflow: 'hidden',
  },
  presetItem: {
    fontFamily: 'Fraunces, Georgia, serif', fontSize: 13, color: '#bbb',
    padding: '10px 14px', cursor: 'pointer',
    borderBottom: '1px solid #1e1e1e',
    transition: 'background 0.1s',
    ':hover': { background: '#1a1a1a' },
  },
  analyzeBtn: {
    marginTop: 20, width: '100%', padding: '13px',
    background: '#c8f545', border: 'none', borderRadius: 6,
    fontFamily: 'DM Mono, monospace', fontSize: 13, letterSpacing: '0.08em',
    color: '#0a0a0a', fontWeight: 600, cursor: 'pointer',
    transition: 'opacity 0.15s, transform 0.1s',
  },
  analyzeBtnLoading: { background: '#2a2a2a', color: '#555' },
  spinnerWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
  spinner: {
    width: 14, height: 14, border: '2px solid #444',
    borderTopColor: '#888', borderRadius: '50%', display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  },
  error: {
    marginTop: 12, padding: '10px 14px', background: '#1a0a0a',
    border: '1px solid #3a1515', borderRadius: 6,
    fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#f87171',
  },
  resultPanel: {
    background: '#0f0f0f', border: '1px solid #1c1c1c',
    borderRadius: 10, padding: 28, minHeight: 400,
  },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: 280, gap: 16,
  },
  emptyIcon: { fontSize: 36, color: '#333' },
  emptyText: {
    fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#444',
    textAlign: 'center', lineHeight: 1.7,
  },
  scoresGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 },
  scoreCard: {
    background: '#111', border: '1px solid #222', borderRadius: 8, padding: 14,
    transition: 'border-color 0.3s',
  },
  scoreCardTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  brandName: { fontFamily: 'Fraunces, Georgia, serif', fontSize: 15, fontWeight: 600, color: '#e0e0e0' },
  sentimentTag: {
    fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.1em',
    padding: '3px 8px', borderRadius: 20,
  },
  context: {
    marginTop: 8, fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'italic',
    fontSize: 12, color: '#666', lineHeight: 1.5,
    borderLeft: '2px solid #2a2a2a', paddingLeft: 10,
  },
  answerBox: {
    background: '#111', border: '1px solid #1e1e1e', borderRadius: 8,
    padding: '20px 24px', fontFamily: 'Fraunces, Georgia, serif',
    fontSize: 14, color: '#b0b0b0', lineHeight: 1.8,
  },
  dashLayout: { maxWidth: 800, margin: '0 auto' },
  dashCard: {
    background: '#0f0f0f', border: '1px solid #1c1c1c', borderRadius: 8,
    padding: '18px 22px', marginBottom: 12,
  },
  dashCardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 14, gap: 16,
  },
  dashQuestion: { fontFamily: 'Fraunces, Georgia, serif', fontSize: 15, color: '#ddd', flex: 1 },
  dashDate: { fontFamily: 'DM Mono, monospace', fontSize: 11, color: '#444', flexShrink: 0 },
  dashBrandRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  dashBrandChip: {
    display: 'inline-flex', alignItems: 'center',
    fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#888',
    background: '#141414', border: '1px solid #1e1e1e', borderRadius: 20,
    padding: '4px 12px',
  },
  refreshBtn: {
    fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: '0.05em',
    background: '#111', border: '1px solid #222', color: '#666',
    padding: '7px 14px', borderRadius: 4, cursor: 'pointer',
  },
};
