import { useState, useEffect, useRef } from 'react';

const API = import.meta.env.VITE_API_URL || '/api';

const COLORS = {
  purple50:  '#EEEDFE',
  purple100: '#CECBF6',
  purple200: '#AFA9EC',
  purple400: '#7F77DD',
  purple600: '#534AB7',
  purple800: '#3C3489',
  purple900: '#26215C',
  teal50:    '#E1F5EE',
  teal100:   '#9FE1CB',
  teal200:   '#5DCAA5',
  teal400:   '#1D9E75',
  teal600:   '#0F6E56',
  teal800:   '#085041',
  coral50:   '#FAECE7',
  coral400:  '#D85A30',
  coral600:  '#993C1D',
  gray50:    '#F1EFE8',
  gray100:   '#D3D1C7',
  gray400:   '#888780',
  gray800:   '#444441',
  gray900:   '#2C2C2A',
};

const SENTIMENT_COLORS = {
  positive: COLORS.purple600,
  neutral:  COLORS.teal400,
  negative: COLORS.coral400,
};

const SENTIMENT_LIGHT = {
  positive: COLORS.purple50,
  neutral:  COLORS.teal50,
  negative: COLORS.coral50,
};

const SENTIMENT_BORDER = {
  positive: COLORS.purple200,
  neutral:  COLORS.teal200,
  negative: '#F0997B',
};

const EXAMPLE_QUESTIONS = [
  { q: 'best italian restaurant in Los Angeles ?',        category: 'Food'       },
  { q: 'best shoes to run long distances?',               category: 'Sports'     },
  { q: 'Top cloud storage solutions for enterprises?',    category: 'Tech'         },
  { q: 'Best project management tools for remote teams?', category: 'Productivity' },
  { q: 'Which electric car brand leads in innovation?',   category: 'Automotive'   },
  { q: 'Best streaming platforms for content creators?',  category: 'Media'        },
];

const SCORING_STEPS = [
  { score: 10, label: 'Positive', desc: 'Is a good deal, get it!',    color: COLORS.purple600, bg: COLORS.purple50,  border: COLORS.purple200, example: 'we found a great deal on Nike running shoes!' },
  { score: 7,  label: 'Neutral',  desc: 'if you are not in a rush keep looking', color: COLORS.teal600,   bg: COLORS.teal50,    border: COLORS.teal200,   example: 'This is an okay option, but there are better deals out there' },
  { score: 1,  label: 'Negative', desc: 'I will not get this deal, you can do better',   color: COLORS.coral600,  bg: COLORS.coral50,   border: '#F0997B',        example:'This item is overpriced, you can find a better deal' },
  { score: 0,  label: 'Absent',   desc: 'No one has heard of this name, keep looking ',   color: COLORS.gray400,   bg: COLORS.gray50,    border: COLORS.gray100,   example: 'no reiews on this name, sorry' },
];

function highlightBrands(text, brandResults) {
  if (!brandResults || brandResults.length === 0) return text;
  const mentioned = brandResults.filter(b => b.mentioned);
  if (mentioned.length === 0) return text;
  const pattern = mentioned.map(b => b.brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');
  return text.split(regex).map((part, i) => {
    const match = mentioned.find(b => b.brand.toLowerCase() === part.toLowerCase());
    if (match) {
      return (
        <mark key={i} style={{
          background: SENTIMENT_LIGHT[match.sentiment],
          color: SENTIMENT_COLORS[match.sentiment],
          borderBottom: `2px solid ${SENTIMENT_BORDER[match.sentiment]}`,
          borderRadius: '3px', padding: '0 3px', fontWeight: 600,
        }}>{part}</mark>
      );
    }
    return part;
  });
}

export default function App() {
  const [view, setView]               = useState('analyze');
  const [question, setQuestion]       = useState('');
  const [brandInput, setBrandInput]   = useState('');
  const [brands, setBrands]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [suggesting, setSuggesting]   = useState(false);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState('');
  const [dashboard, setDashboard]     = useState([]);
  const [dashLoading, setDashLoading] = useState(false);
  const [animateIn, setAnimateIn]     = useState(false);
  const [activeScore, setActiveScore] = useState(null);
  const [hoveredEx, setHoveredEx]     = useState(null);
  const [activeTab, setActiveTab]     = useState('scores');
  const brandInputRef = useRef(null);

  useEffect(() => { if (view === 'dashboard') fetchDashboard(); }, [view]);
  useEffect(() => {
    if (result) { setAnimateIn(false); setActiveTab('scores'); setTimeout(() => setAnimateIn(true), 30); }
  }, [result]);

  async function fetchDashboard() {
    setDashLoading(true);
    try { const r = await fetch(`${API}/dashboard`); setDashboard(await r.json()); }
    catch (e) { console.error(e); }
    finally { setDashLoading(false); }
  }

  function addBrand() {
    const t = brandInput.trim();
    if (t && !brands.includes(t) && brands.length < 6) {
      setBrands([...brands, t]); setBrandInput(''); brandInputRef.current?.focus();
    }
  }

  function removeBrand(b) { setBrands(brands.filter(x => x !== b)); }

  function loadExample(ex) { setQuestion(ex.q); setBrands([]); setResult(null); setError(''); }

  async function handleSuggestBrands() {
    if (!question.trim()) { setError('Enter a question first.'); return; }
    setError(''); setSuggesting(true);
    try {
      const r = await fetch(`${API}/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: question.trim(), brands: [] }) });
      if (!r.ok) throw new Error((await r.json()).error || 'Request failed');
      const data = await r.json();
      if (data.suggestedBrands?.length > 0) { setBrands(data.suggestedBrands.slice(0, 6)); setResult(data); }
    } catch (e) { setError(e.message); }
    finally { setSuggesting(false); }
  }

  async function handleAnalyze() {
    if (!question.trim()) { setError('Enter a question to continue.'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const r = await fetch(`${API}/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: question.trim(), brands }) });
      if (!r.ok) throw new Error((await r.json()).error || 'Request failed');
      const data = await r.json();
      setResult(data);
      if (data.suggestedBrands && brands.length === 0) setBrands(data.suggestedBrands.slice(0, 6));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const sorted = result ? [...result.brandResults].sort((a, b) => b.score - a.score) : [];

  return (
    <div style={s.root}>

      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logoGroup}>
            <div style={s.logoMark}>V</div>
            <span style={s.logoName}>visigraph</span>
          </div>
          <nav style={s.nav}>
            {['analyze', 'dashboard'].map(v => (
              <button key={v} style={{ ...s.navBtn, ...(view === v ? s.navActive : {}) }} onClick={() => setView(v)}>{v}</button>
            ))}
          </nav>
        </div>
      </header>

      <div style={s.headerAccent} />

      <main style={s.main}>
        {view === 'analyze' && (
          <>
            <div style={s.pageTitle}>
             <h1 style={{
  fontSize: 'clamp(3rem, 8vw, 6rem)', // Responsive oversized text
  fontFamily: '"Editorial New", serif', // High-contrast serif
  letterSpacing: '-0.02em', 
  lineHeight: '1.1',
  textTransform: 'uppercase',
  color: '#1a1a1a',
  marginBottom: '0.5rem'
}}>
  Best Values <span style={{ fontStyle: 'italic', fontWeight: '300' }}>always.</span>
</h1>
              <p style={s.subtitle}>Ask any question you want to buy, we will find you the best deal!.</p>
            </div>

            <div style={s.twoCol}>

              {/* LEFT */}
              <div style={s.leftCol}>

                <div style={s.fieldGroup}>
                  <label style={s.label}>YOUR QUESTION</label>
                  <textarea style={s.textarea} placeholder="e.g. What are the best CRM tools for B2B sales teams?" value={question} onChange={e => { setQuestion(e.target.value); setError(''); }} rows={4} />
                  <p style={s.hint}>Ask a specific category question where brand names appear naturally.</p>
                </div>

                <div style={s.fieldGroup}>
                  <label style={s.label}>
                    TRY AN EXAMPLE
                    <span style={s.labelNote}>click to load</span>
                  </label>
                  <div style={s.exGrid}>
                    {EXAMPLE_QUESTIONS.map((ex, i) => (
                      <div key={i} style={{
                        ...s.exCard,
                        background: question === ex.q ? COLORS.purple50 : hoveredEx === i ? COLORS.gray50 : '#fff',
                        borderColor: question === ex.q ? COLORS.purple400 : hoveredEx === i ? COLORS.gray100 : '#f0f0f0',
                        transform: hoveredEx === i ? 'translateY(-2px)' : 'none',
                      }}
                        onClick={() => loadExample(ex)}
                        onMouseEnter={() => setHoveredEx(i)}
                        onMouseLeave={() => setHoveredEx(null)}
                      >
                        <span style={{ ...s.exCat, color: question === ex.q ? COLORS.purple600 : COLORS.gray400 }}>{ex.category}</span>
                        <span style={{ ...s.exQ, color: question === ex.q ? COLORS.purple800 : COLORS.gray900 }}>{ex.q}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={s.fieldGroup}>
                  <label style={s.label}>
                    HOW SCORING WORKS
                    <span style={s.labelNote}>hover to preview</span>
                  </label>
                  <div style={s.scoringCards}>
                    {SCORING_STEPS.map(({ score, label, desc, color, bg, border, example }) => (
                      <div key={score}
                        style={{ ...s.scoringCard, background: activeScore === score ? bg : '#fff', borderColor: activeScore === score ? border : '#f0f0f0' }}
                        onMouseEnter={() => setActiveScore(score)}
                        onMouseLeave={() => setActiveScore(null)}
                      >
                        <div style={s.scoringTop}>
                          <span style={{ ...s.scoreChip, color, borderColor: border, background: bg }}>{score}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color, letterSpacing: '-0.01em' }}>{label}</div>
                            <div style={{ fontSize: 12, color: COLORS.gray400, marginTop: 1 }}>{desc}</div>
                          </div>
                        </div>
                        {activeScore === score && (
                          <div style={{ marginTop: 10, padding: '8px 12px', borderLeft: `2px solid ${border}`, borderRadius: 4, fontSize: 12, fontStyle: 'italic', color, lineHeight: 1.5 }}>
                            {example}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div style={s.rightCol}>

                <div style={s.fieldGroup}>
                  <label style={s.label}>
                    BRANDS TO COMPARE
                    <span style={{ ...s.labelNote, color: brands.length === 6 ? COLORS.coral400 : COLORS.gray100 }}>{brands.length} / 6</span>
                  </label>

                  <div style={s.brandRow}>
                    <input ref={brandInputRef} style={s.brandInput} placeholder="Type a brand name and press Enter" value={brandInput}
                      onChange={e => setBrandInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBrand()} disabled={brands.length >= 6} />
                    <button style={{ ...s.addBtn, opacity: brands.length >= 6 ? 0.3 : 1 }} onClick={addBrand} disabled={brands.length >= 6}>+</button>
                  </div>

                  <button style={{ ...s.suggestBtn, opacity: suggesting ? 0.6 : 1 }} onClick={handleSuggestBrands} disabled={suggesting || !question.trim()}>
                    {suggesting
                      ? <span style={s.row}><span style={s.spinner} />Finding relevant brands...</span>
                      : <span style={s.row}><span style={s.sparkle}>✦</span>Let AI suggest brands for this question</span>
                    }
                  </button>

                  <div style={s.chips}>
                    {brands.length === 0
                      ? <span style={s.noChips}>Add brands manually or use AI suggestions above</span>
                      : brands.map((b, i) => (
                        <div key={b} style={s.chip}>
                          <span style={s.chipNum}>{i + 1}</span>
                          <span style={s.chipName}>{b}</span>
                          <button style={s.chipDel} onClick={() => removeBrand(b)}>×</button>
                        </div>
                      ))
                    }
                  </div>
                </div>

                <div style={s.divider} />

                {error && (
                  <div style={s.error}>
                    <span style={s.errorDot} />
                    {error}
                  </div>
                )}

                <button style={s.runBtn} onClick={handleAnalyze} disabled={loading}>
                  {loading
                    ? <span style={s.row}><span style={s.spinner} />Analyzing visibility...</span>
                    : 'Run Analysis →'
                  }
                </button>

                {!result && !loading && !suggesting && (
                  <div style={s.empty}>
                    <div style={s.emptyRing} />
                    <p style={s.emptyLabel}>Results will appear here</p>
                    <p style={s.emptyHint}>Load an example or type your own question</p>
                  </div>
                )}

                {result && (
                  <div style={s.resultsCard}>

                    <div style={s.resultsHeader}>
                      <p style={s.resultsQ}>"{result.question}"</p>
                      <div style={s.resultsBadges}>
                        {result.suggestedBrands && <span style={s.aiTag}>✦ AI suggested</span>}
                        <span style={s.modelTag}>◈ Groq · LLaMA 3.3 70B</span>
                      </div>
                    </div>

                    <div style={s.tabs}>
                      {[
                        { key: 'scores', label: 'Visibility Scores' },
                        { key: 'answer', label: `AI Answer · ${result.brandResults.filter(b => b.mentioned).length} brands found` },
                      ].map(({ key, label }) => (
                        <button key={key} style={{ ...s.tab, ...(activeTab === key ? s.tabActive : {}) }} onClick={() => setActiveTab(key)}>
                          {label}
                        </button>
                      ))}
                    </div>

                    {activeTab === 'scores' && (
                      <div style={s.tabBody}>
                        {sorted.map((br, i) => (
                          <div key={br.brand} style={{
                            ...s.resultRow,
                            animation: animateIn ? `fadeSlide 0.35s ease ${i * 0.07}s both` : 'none',
                            background: br.mentioned ? SENTIMENT_LIGHT[br.sentiment] : COLORS.gray50,
                            borderColor: br.mentioned ? SENTIMENT_BORDER[br.sentiment] : COLORS.gray100,
                          }}>
                            <div style={s.resultLeft}>
                              <span style={s.rank}>#{i + 1}</span>
                              <div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.gray900, letterSpacing: '-0.01em' }}>{br.brand}</div>
                                {br.context && <div style={{ fontSize: 12, color: COLORS.gray400, marginTop: 3, fontStyle: 'italic', lineHeight: 1.4 }}>"{br.context}"</div>}
                              </div>
                            </div>
                            <div style={s.resultRight}>
                              <div style={{
                                fontSize: 20, fontWeight: 700, padding: '4px 12px', borderRadius: 8,
                                fontFamily: "'Instrument Serif', Georgia, serif",
                                color: br.mentioned ? SENTIMENT_COLORS[br.sentiment] : COLORS.gray400,
                                background: br.mentioned ? SENTIMENT_LIGHT[br.sentiment] : COLORS.gray50,
                                border: `1px solid ${br.mentioned ? SENTIMENT_BORDER[br.sentiment] : COLORS.gray100}`,
                              }}>
                                {br.score}<span style={{ fontSize: 11, fontWeight: 400, opacity: 0.6 }}>/10</span>
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: br.mentioned ? SENTIMENT_COLORS[br.sentiment] : COLORS.gray400 }}>
                                {br.mentioned ? br.sentiment : 'absent'}
                              </span>
                            </div>
                          </div>
                        ))}

                        <div style={s.answerTeaser} onClick={() => setActiveTab('answer')}>
                          <div style={s.row}>
                            <span style={{ fontSize: 16, color: COLORS.purple400 }}>◎</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.gray900 }}>Read the full AI answer</div>
                              <div style={{ fontSize: 11, color: COLORS.gray400, marginTop: 2 }}>Brand mentions highlighted in context</div>
                            </div>
                          </div>
                          <span style={{ fontSize: 14, color: COLORS.purple400 }}>→</span>
                        </div>
                      </div>
                    )}

                    {activeTab === 'answer' && (
                      <div style={s.tabBody}>
                        <div style={s.legend}>
                          {result.brandResults.filter(b => b.mentioned).map(b => (
                            <span key={b.brand} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              fontSize: 12, fontWeight: 600,
                              color: SENTIMENT_COLORS[b.sentiment],
                              background: SENTIMENT_LIGHT[b.sentiment],
                              border: `1px solid ${SENTIMENT_BORDER[b.sentiment]}`,
                              padding: '4px 10px', borderRadius: 100,
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: SENTIMENT_COLORS[b.sentiment], display: 'inline-block' }} />
                              {b.brand}
                            </span>
                          ))}
                          {result.brandResults.filter(b => b.mentioned).length === 0 && (
                            <span style={{ fontSize: 12, color: COLORS.gray400 }}>No brands mentioned in this answer</span>
                          )}
                        </div>

                        <div style={s.answerBody}>
                          {result.answerText.split('\n').filter(Boolean).map((para, i) => (
                            <p key={i} style={{ fontSize: 14, color: COLORS.gray800, lineHeight: 1.8, marginBottom: 14 }}>
                              {highlightBrands(para, result.brandResults)}
                            </p>
                          ))}
                        </div>

                        <button style={s.backBtn} onClick={() => setActiveTab('scores')}>← Back to scores</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {view === 'dashboard' && (
          <div style={s.dashWrap}>
            <div style={s.dashTop}>
              <div>
                <h1 style={s.h1}>History</h1>
                <p style={s.subtitle}>{dashboard.length} analyses stored in Neo4j</p>
              </div>
              <button style={s.refreshBtn} onClick={fetchDashboard}>{dashLoading ? 'Loading...' : '↺ Refresh'}</button>
            </div>

            {!dashLoading && dashboard.length === 0 && (
              <div style={s.empty}>
                <div style={s.emptyRing} />
                <p style={s.emptyLabel}>No analyses yet</p>
                <p style={s.emptyHint}>Run your first query to see results here</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {dashboard.map(entry => (
                <div key={entry.answerId} style={s.dashCard}>
                  <div style={s.dashTop2}>
                    <p style={s.dashQ}>{entry.questionText}</p>
                    <span style={s.dashDate}>{entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {entry.brands.sort((a, b) => (b.mentioned ? 1 : 0) - (a.mentioned ? 1 : 0)).map(b => (
                      <div key={b.name} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        border: `1px solid ${b.mentioned ? SENTIMENT_BORDER[b.sentiment] : COLORS.gray100}`,
                        background: b.mentioned ? SENTIMENT_LIGHT[b.sentiment] : COLORS.gray50,
                        borderRadius: 100, padding: '4px 10px', fontSize: 12, fontWeight: 500,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: b.mentioned ? SENTIMENT_COLORS[b.sentiment] : COLORS.gray100 }} />
                        <span style={{ color: b.mentioned ? SENTIMENT_COLORS[b.sentiment] : COLORS.gray400 }}>{b.name}</span>
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
        body { background: #fff; -webkit-font-smoothing: antialiased; }
        textarea, input { font-family: inherit; }
        textarea:focus, input:focus { outline: none; border-color: ${COLORS.purple400} !important; }
        textarea::placeholder, input::placeholder { color: #d1d5db; }
        button { cursor: pointer; transition: all 0.15s ease; }
        button:hover { opacity: 0.85; }
        button:active { transform: scale(0.98); }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { h1 { font-size: 28px !important; } }
      `}</style>
    </div>
  );
}

const s = {
  root: { minHeight: '100vh', background: '#fff', color: COLORS.gray900, fontFamily: "'Inter', -apple-system, sans-serif" },

  header: { borderBottom: `1px solid ${COLORS.gray50}`, background: '#fff', position: 'sticky', top: 0, zIndex: 100 },
  headerInner: { maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logoGroup: { display: 'flex', alignItems: 'center', gap: 10 },
  logoMark: { width: 32, height: 32, borderRadius: 8, background: COLORS.purple600, color: COLORS.purple50, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 },
  logoName: { fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em', color: COLORS.gray900 },
  nav: { display: 'flex', gap: 4, background: COLORS.gray50, padding: 4, borderRadius: 10 },
  navBtn: { fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500, background: 'transparent', border: 'none', color: COLORS.gray400, padding: '6px 14px', borderRadius: 7 },
  navActive: { background: '#fff', color: COLORS.purple600, boxShadow: `0 1px 3px rgba(0,0,0,0.08)` },
  headerAccent: { height: 3, background: `linear-gradient(90deg, ${COLORS.purple600} 0%, ${COLORS.teal400} 60%, transparent 100%)` },

  main: { maxWidth: 1200, margin: '0 auto', padding: 'clamp(32px,5vw,64px) clamp(16px,4vw,48px) 80px' },
  pageTitle: { marginBottom: 56 },
  h1: { fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 42, fontWeight: 400, color: COLORS.gray900, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 14 },
  subtitle: { fontSize: 15, color: COLORS.gray400, lineHeight: 1.6, maxWidth: 520 },

  twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 56, alignItems: 'start' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: 40 },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 20 },

  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: COLORS.gray400, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  labelNote: { fontWeight: 400, color: COLORS.gray100, letterSpacing: '0.02em', fontSize: 10 },

  textarea: { width: '100%', background: COLORS.gray50, border: `1px solid ${COLORS.gray100}`, borderRadius: 10, color: COLORS.gray900, fontSize: 15, lineHeight: 1.6, padding: '16px 18px', resize: 'none', transition: 'border-color 0.15s ease', fontFamily: "'Inter',sans-serif" },
  hint: { fontSize: 12, color: COLORS.gray100, lineHeight: 1.5 },

  exGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  exCard: { display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 14px', borderRadius: 10, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s ease' },
  exCat: { fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' },
  exQ: { fontSize: 12, lineHeight: 1.4 },

  scoringCards: { display: 'flex', flexDirection: 'column', gap: 6 },
  scoringCard: { padding: '12px 14px', borderRadius: 10, border: '1px solid', transition: 'all 0.2s ease', cursor: 'default' },
  scoringTop: { display: 'flex', alignItems: 'center', gap: 12 },
  scoreChip: { fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: '1px solid', minWidth: 36, textAlign: 'center', flexShrink: 0 },

  brandRow: { display: 'flex', gap: 8 },
  brandInput: { flex: 1, background: COLORS.gray50, border: `1px solid ${COLORS.gray100}`, borderRadius: 10, color: COLORS.gray900, fontSize: 14, padding: '12px 16px', fontFamily: "'Inter',sans-serif", transition: 'border-color 0.15s ease' },
  addBtn: { width: 44, height: 44, borderRadius: 10, border: 'none', background: COLORS.purple600, color: COLORS.purple50, fontSize: 22, fontWeight: 300, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },

  suggestBtn: { width: '100%', padding: '11px 16px', border: `1px solid ${COLORS.purple200}`, borderRadius: 10, fontSize: 13, fontWeight: 500, color: COLORS.purple600, background: COLORS.purple50, fontFamily: "'Inter',sans-serif", transition: 'all 0.2s ease' },
  sparkle: { fontSize: 12, color: COLORS.purple400 },

  chips: { display: 'flex', flexWrap: 'wrap', gap: 8, minHeight: 36, alignItems: 'center' },
  noChips: { fontSize: 12, color: COLORS.gray100 },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 7, background: COLORS.purple50, border: `1px solid ${COLORS.purple200}`, borderRadius: 100, padding: '5px 10px 5px 6px', fontSize: 13, color: COLORS.purple800 },
  chipNum: { width: 20, height: 20, borderRadius: '50%', background: COLORS.purple600, color: COLORS.purple50, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 },
  chipName: { fontWeight: 500 },
  chipDel: { background: 'none', border: 'none', color: COLORS.purple200, fontSize: 16, lineHeight: 1, padding: '0 0 0 2px' },

  divider: { height: 1, background: COLORS.gray50 },

  error: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: COLORS.coral600, background: COLORS.coral50, border: `1px solid #F0997B`, borderRadius: 8, padding: '10px 14px' },
  errorDot: { width: 6, height: 6, borderRadius: '50%', background: COLORS.coral400, flexShrink: 0 },

  runBtn: { width: '100%', padding: '15px 24px', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', background: `linear-gradient(135deg, ${COLORS.purple600} 0%, ${COLORS.purple400} 100%)`, color: COLORS.purple50, boxShadow: `0 4px 16px ${COLORS.purple200}`, fontFamily: "'Inter',sans-serif" },

  row: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  spinner: { width: 14, height: 14, border: `2px solid ${COLORS.purple200}`, borderTopColor: COLORS.purple600, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' },

  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 10 },
  emptyRing: { width: 40, height: 40, borderRadius: '50%', border: `1px solid ${COLORS.purple100}`, background: COLORS.purple50 },
  emptyLabel: { fontSize: 14, color: COLORS.gray400, fontWeight: 500 },
  emptyHint: { fontSize: 12, color: COLORS.gray100 },

  resultsCard: { border: `1px solid ${COLORS.purple100}`, borderRadius: 14, overflow: 'hidden' },
  resultsHeader: { padding: '18px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  resultsQ: { fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 16, color: COLORS.gray400, fontStyle: 'italic', lineHeight: 1.4, flex: 1 },
  resultsBadges: { display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' },
  aiTag: { fontSize: 10, color: COLORS.purple600, background: COLORS.purple50, border: `1px solid ${COLORS.purple200}`, padding: '3px 8px', borderRadius: 100, fontWeight: 600 },
  modelTag: { fontSize: 10, color: COLORS.teal600, background: COLORS.teal50, border: `1px solid ${COLORS.teal200}`, padding: '3px 8px', borderRadius: 100, fontWeight: 600 },

  tabs: { display: 'flex', padding: '12px 20px 0', borderBottom: `1px solid ${COLORS.purple50}`, marginTop: 16, gap: 0 },
  tab: { fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500, background: 'none', border: 'none', color: COLORS.gray400, padding: '8px 0', marginRight: 24, borderBottom: '2px solid transparent', transition: 'all 0.15s ease' },
  tabActive: { color: COLORS.purple600, borderBottomColor: COLORS.purple600 },

  tabBody: { display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 20px 20px' },
  resultRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid', borderRadius: 10, padding: '14px 18px', gap: 16, transition: 'all 0.2s ease' },
  resultLeft: { display: 'flex', alignItems: 'center', gap: 14, flex: 1 },
  rank: { fontSize: 11, color: COLORS.gray100, fontWeight: 600, minWidth: 24 },
  resultRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 },

  answerTeaser: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: COLORS.purple50, border: `1px solid ${COLORS.purple100}`, borderRadius: 10, cursor: 'pointer', marginTop: 4 },

  legend: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  answerBody: { display: 'flex', flexDirection: 'column' },
  backBtn: { fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 500, color: COLORS.purple400, background: 'none', border: 'none', padding: 0, textAlign: 'left', marginTop: 8 },

  dashWrap: { maxWidth: 760, margin: '0 auto' },
  dashTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 },
  refreshBtn: { fontSize: 13, fontWeight: 500, background: COLORS.purple50, border: `1px solid ${COLORS.purple200}`, color: COLORS.purple600, padding: '9px 16px', borderRadius: 8, fontFamily: "'Inter',sans-serif" },
  dashCard: { border: `1px solid ${COLORS.gray50}`, borderRadius: 12, padding: '20px 24px', background: '#fff' },
  dashTop2: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14 },
  dashQ: { fontSize: 15, color: COLORS.gray900, lineHeight: 1.4, fontWeight: 500, flex: 1, fontFamily: "'Instrument Serif',Georgia,serif" },
  dashDate: { fontSize: 12, color: COLORS.gray100, flexShrink: 0 },
};
