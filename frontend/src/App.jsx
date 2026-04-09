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

const SCOL   = { positive: COLORS.purple400, neutral: COLORS.teal400,  negative: COLORS.coral400 };
const SLIGHT  = { positive: COLORS.purple50,  neutral: COLORS.teal50,   negative: COLORS.coral50  };
const SBORDER = { positive: COLORS.purple200, neutral: COLORS.teal200,  negative: '#F0997B'        };

// Arcade dark palette used inside the score board shell
const ARC = {
  shell:     '#1A1640',
  shellBdr:  '#3C3489',
  row:       'rgba(83,74,183,0.10)',
  rowHov:    'rgba(83,74,183,0.22)',
  rowGold:   'rgba(255,215,0,0.07)',
  track:     '#2d2660',
  headerTxt: '#534AB7',
  divider:   '#2d2660',
  textDim:   '#7F77DD',
};

// Verdict labels replacing numeric sentiment words
const VERDICT = { positive: 'BUY', neutral: 'MAYBE', negative: 'SKIP', absent: 'GHOST' };
const VERDICT_COL = {
  positive: { text: '#AFA9EC', border: '#534AB7', bg: '#2d2660' },
  neutral:  { text: '#5DCAA5', border: '#0F6E56', bg: '#053d2e' },
  negative: { text: '#F0997B', border: '#993C1D', bg: '#3d1810' },
  absent:   { text: '#888780', border: '#444441', bg: '#222220' },
};

const EXAMPLE_QUESTIONS = [
  { q: 'best italian restaurant in Los Angeles?',         category: 'Food'         },
  { q: 'best shoes to run long distances?',               category: 'Sports'       },
  { q: 'Top cloud storage solutions for enterprises?',    category: 'Tech'         },
  { q: 'Best project management tools for remote teams?', category: 'Productivity' },
  { q: 'Which electric car brand leads in innovation?',   category: 'Automotive'   },
  { q: 'Best streaming platforms for content creators?',  category: 'Media'        },
];

const TICKER_ITEMS = [
  { brand: 'Nike',        score: 9, sentiment: 'positive' },
  { brand: 'Adidas',      score: 7, sentiment: 'neutral'  },
  { brand: 'Salomon',     score: 10, sentiment: 'positive'},
  { brand: 'New Balance', score: 8, sentiment: 'positive' },
  { brand: 'Salesforce',  score: 6, sentiment: 'neutral'  },
  { brand: 'HubSpot',     score: 9, sentiment: 'positive' },
  { brand: 'Monday.com',  score: 8, sentiment: 'positive' },
  { brand: 'Asana',       score: 7, sentiment: 'neutral'  },
  { brand: 'Dropbox',     score: 5, sentiment: 'neutral'  },
  { brand: 'Tesla',       score: 10, sentiment: 'positive'},
  { brand: 'Rivian',      score: 7, sentiment: 'neutral'  },
  { brand: 'Netflix',     score: 9, sentiment: 'positive' },
  { brand: 'Spotify',     score: 8, sentiment: 'positive' },
];

/* ─── helpers ─────────────────────────────────────────── */

function sentimentClass(sentiment) {
  return sentiment === 'positive' ? 'pos'
       : sentiment === 'negative' ? 'neg'
       : sentiment === 'absent'   ? 'abs'
       : 'neu';
}

function highlightBrands(text, brandResults) {
  if (!brandResults?.length) return text;
  const mentioned = brandResults.filter(b => b.mentioned);
  if (!mentioned.length) return text;
  const pattern = mentioned.map(b => b.brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');
  return text.split(regex).map((part, i) => {
    const match = mentioned.find(b => b.brand.toLowerCase() === part.toLowerCase());
    if (match) return (
      <mark key={i} style={{
        background: SLIGHT[match.sentiment],
        color: SCOL[match.sentiment],
        borderBottom: `2px solid ${SBORDER[match.sentiment]}`,
        borderRadius: 3, padding: '0 3px', fontWeight: 600,
      }}>{part}</mark>
    );
    return part;
  });
}

/* ─── Ticker ───────────────────────────────────────────── */

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={s.tickerWrap}>
      <div style={s.tickerInner}>
        {items.map((item, i) => {
          const isPos = item.sentiment === 'positive';
          const isNeg = item.sentiment === 'negative';
          const arrow = isPos ? '▲' : isNeg ? '▼' : '–';
          const col   = isPos ? COLORS.teal200 : isNeg ? COLORS.coral400 : COLORS.gray400;
          return (
            <span key={i} style={s.tickerItem}>
              <span style={s.tickerDot} />
              <b style={{ color: '#fff' }}>{item.brand}</b>
              <span style={{ color: col }}>{arrow} {item.score}/10</span>
              {i < items.length - 1 && <span style={s.tickerSep}>◈</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Flash bar ────────────────────────────────────────── */

function FlashBar() {
  return (
    <div style={s.flashBar}>
      <span style={s.flashLabel}>⚡ recent</span>
      <div style={s.flashScores}>
        {TICKER_ITEMS.slice(0, 7).map(item => {
          const isPos = item.sentiment === 'positive';
          const isNeg = item.sentiment === 'negative';
          const cls   = isPos ? { bg: COLORS.purple600, color: COLORS.purple50 }
                      : isNeg ? { bg: COLORS.coral400,  color: COLORS.coral50  }
                      :         { bg: COLORS.teal400,   color: COLORS.teal50   };
          const arrow = isPos ? '▲' : isNeg ? '▼' : '–';
          return (
            <span key={item.brand} style={{ ...s.flashBadge, background: cls.bg, color: cls.color }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', opacity: .7, display: 'inline-block' }} />
              {item.brand} {arrow}{item.score}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Arcade Score Board ───────────────────────────────── */

function ArcadeScoreBoard({ brandResults, animateIn }) {
  const sorted = [...brandResults].sort((a, b) => b.score - a.score);
  const litCount = brandResults.filter(b => b.mentioned).length;
  const [boardTab, setBoardTab] = useState('scores');
  const [hoveredScore, setHoveredScore] = useState(null);

  const HOW_ITEMS = [
    { score: 10, label: 'Positive', desc: 'AI recommends it. Get it.', ex: 'We found a great deal on Nike running shoes — highly recommended.', vc: VERDICT_COL.positive },
    { score: 7,  label: 'Neutral',  desc: 'Okay option. Keep shopping.', ex: 'This is a decent pick, but better deals exist.', vc: VERDICT_COL.neutral  },
    { score: 1,  label: 'Negative', desc: 'Overpriced or poor reviews.', ex: 'This item is overpriced — you can find a better deal.', vc: VERDICT_COL.negative },
    { score: 0,  label: 'Absent',   desc: 'No mention. Unknown brand.', ex: 'No reviews found for this name — keep looking.', vc: VERDICT_COL.absent   },
  ];

  return (
    <div style={s.boardOuter}>
      {/* inner tab strip */}
      <div style={s.boardTabs}>
        {[['scores','Score Board'],['how','How it Works']].map(([key, label]) => (
          <button key={key} style={{ ...s.boardTab, ...(boardTab === key ? s.boardTabOn : {}) }}
            onClick={() => setBoardTab(key)}>{label}</button>
        ))}
      </div>

      {boardTab === 'scores' && (
        <>
          {/* legend */}
          <div style={s.legend}>
            {[['pos','#7F77DD','Positive (8–10)'],['neu','#1D9E75','Neutral (5–7)'],['neg','#D85A30','Negative (1–4)'],['abs','#444441','Absent (0)']].map(([,color,label]) => (
              <span key={label} style={s.legendItem}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>

          {/* cabinet shell */}
          <div style={s.shell}>
            <div style={s.shellLabel}>HIGH SCORE</div>

            {/* header row */}
            <div style={s.tableHead}>
              <div style={{ ...s.headCell, width: 32, textAlign: 'center' }}>#</div>
              <div style={{ ...s.headCell, flex: 1 }}>Brand</div>
              <div style={{ ...s.headCell, width: 100, textAlign: 'center' }}>Signal</div>
              <div style={{ ...s.headCell, width: 80, textAlign: 'right' }}>Score</div>
            </div>

            {/* score rows */}
            {sorted.map((br, i) => {
              const rank   = i + 1;
              const isTop  = rank === 1 && br.mentioned;
              const absent = !br.mentioned;
              const vc     = VERDICT_COL[absent ? 'absent' : br.sentiment];
              const barPct = Math.round((br.score / 10) * 100);
              const barCol = absent    ? '#444441'
                           : br.sentiment === 'positive' ? '#7F77DD'
                           : br.sentiment === 'neutral'  ? '#1D9E75'
                           :                               '#D85A30';
              const rankCol = rank === 1 ? '#FFD700'
                            : rank === 2 ? '#B4B2A9'
                            : rank === 3 ? '#D85A30'
                            : ARC.textDim;
              return (
                <div key={br.brand}
                  style={{
                    ...s.scoreRow,
                    opacity: absent ? 0.45 : 1,
                    background: isTop ? ARC.rowGold : 'transparent',
                    animation: animateIn ? `arcFade 0.4s ease ${i * 0.08}s both` : 'none',
                  }}>
                  {/* rank */}
                  <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: rankCol, fontFamily: "'Instrument Serif',Georgia,serif" }}>
                      {rank === 1 ? '★' : rank}
                    </span>
                  </div>

                  {/* brand + context */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: isTop ? '#FFD700' : '#EEEDFE', letterSpacing: '-.01em' }}>
                        {br.brand}
                      </span>
                      {isTop && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#FFD700', letterSpacing: '.15em', animation: 'arcBlink 1.1s step-end infinite' }}>
                          ▲ TOP
                        </span>
                      )}
                    </div>
                    {br.context && (
                      <div style={{ fontSize: 10, color: ARC.textDim, marginTop: 2, fontStyle: 'italic', lineHeight: 1.3 }}>
                        "{br.context}"
                      </div>
                    )}
                  </div>

                  {/* bar */}
                  <div style={{ width: 100, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', flexShrink: 0 }}>
                    <div style={{ flex: 1, height: 6, background: ARC.track, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3, background: barCol,
                        width: `${barPct}%`,
                        transition: 'width .7s cubic-bezier(.4,0,.2,1)',
                      }} />
                    </div>
                  </div>

                  {/* score + verdict */}
                  <div style={{ width: 80, textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: barCol, fontFamily: "'Instrument Serif',Georgia,serif" }}>
                      {br.score}<span style={{ fontSize: 10, opacity: .5 }}>/10</span>
                    </span>
                    <span style={{
                      fontSize: 8, fontWeight: 700, letterSpacing: '.12em',
                      padding: '2px 7px', borderRadius: 100,
                      color: vc.text, border: `1px solid ${vc.border}`, background: vc.bg,
                    }}>{VERDICT[absent ? 'absent' : br.sentiment]}</span>
                  </div>
                </div>
              );
            })}

            {/* footer credits */}
            <div style={s.credits}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.18em', color: ARC.headerTxt, textTransform: 'uppercase' }}>Credits</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {brandResults.map((_, i) => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: i < litCount ? COLORS.purple400 : 'transparent',
                    border: `1.5px solid ${i < litCount ? COLORS.purple200 : ARC.shellBdr}`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {boardTab === 'how' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12 }}>
          {HOW_ITEMS.map(item => (
            <div key={item.score}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                borderRadius: 10, border: `1.5px solid ${item.vc.border}`,
                background: item.vc.bg, cursor: 'default', transition: 'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '.85'; setHoveredScore(item.score); }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; setHoveredScore(null); }}
            >
              <span style={{
                fontSize: 18, fontWeight: 700, fontFamily: "'Instrument Serif',Georgia,serif",
                minWidth: 44, textAlign: 'center', padding: '6px 12px',
                borderRadius: 8, border: `1.5px solid ${item.vc.border}`,
                color: item.vc.text, background: `${item.vc.bg}cc`,
              }}>{item.score}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: item.vc.text }}>{item.label}</div>
                <div style={{ fontSize: 11, color: item.vc.text, opacity: .7, marginTop: 2 }}>{item.desc}</div>
                {hoveredScore === item.score && (
                  <div style={{
                    marginTop: 8, padding: '6px 10px',
                    borderLeft: `2px solid ${item.vc.border}`,
                    fontSize: 11, fontStyle: 'italic', color: item.vc.text, lineHeight: 1.5,
                  }}>"{item.ex}"</div>
                )}
              </div>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '.12em',
                padding: '3px 9px', borderRadius: 100,
                color: item.vc.text, border: `1px solid ${item.vc.border}`, background: item.vc.bg,
                flexShrink: 0,
              }}>{VERDICT[item.label.toLowerCase()]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main App ─────────────────────────────────────────── */

export default function App() {
  const [view, setView]             = useState('analyze');
  const [question, setQuestion]     = useState('');
  const [brandInput, setBrandInput] = useState('');
  const [brands, setBrands]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState('');
  const [dashboard, setDashboard]   = useState([]);
  const [dashLoading, setDashLoading] = useState(false);
  const [animateIn, setAnimateIn]   = useState(false);
  const [activeTab, setActiveTab]   = useState('scores');
  const [hoveredEx, setHoveredEx]   = useState(null);
  const [hoveredBump, setHoveredBump] = useState(null);
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

  const BUMPERS = ['🍕 Food','👟 Sports','☁️ Tech','📋 Productivity','🚗 Automotive','📺 Media'];

  return (
    <div style={s.root}>

      {/* TICKER */}
      <Ticker />

      {/* HEADER */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logoGroup}>
            <div style={s.logoMark}>V</div>
            <span style={s.logoName}>visigraph</span>
          </div>
          <nav style={s.nav}>
            {['analyze','dashboard'].map(v => (
              <button key={v} style={{ ...s.navBtn, ...(view === v ? s.navActive : {}) }} onClick={() => setView(v)}>{v}</button>
            ))}
          </nav>
        </div>
      </header>
      <div style={s.accent} />

      {/* FLASH BAR */}
      <FlashBar />

      <main style={s.main}>
        {view === 'analyze' && (
          <>
            {/* HERO */}
            <div style={s.hero}>
              <div style={s.kicker}><span style={s.kickerLine} />brand visibility engine</div>
              <h1 style={s.heroTitle}>Best Values <em style={{ fontStyle: 'italic', fontWeight: 300, color: COLORS.purple600 }}>always.</em></h1>
              <p style={s.heroSub}>Ask any question about what to buy — we find you the best deal.</p>
            </div>

            {/* BUMPER ROW */}
            <div style={s.bumperRow}>
              {BUMPERS.map((b, i) => (
                <button key={b}
                  style={{
                    ...s.bumper,
                    background: hoveredBump === i ? COLORS.purple600 : COLORS.purple50,
                    color: hoveredBump === i ? COLORS.purple50 : COLORS.purple600,
                    borderColor: hoveredBump === i ? COLORS.purple600 : COLORS.purple200,
                    transform: hoveredBump === i ? 'scale(1.05)' : 'scale(1)',
                  }}
                  onClick={() => loadExample(EXAMPLE_QUESTIONS[i])}
                  onMouseEnter={() => setHoveredBump(i)}
                  onMouseLeave={() => setHoveredBump(null)}
                >
                  <span style={s.bumperPulse} />
                  {b}
                </button>
              ))}
            </div>

            <div style={s.twoCol}>

              {/* LEFT COL */}
              <div style={s.leftCol}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>YOUR QUESTION</label>
                  <textarea style={s.textarea} rows={4}
                    placeholder="e.g. What are the best CRM tools for B2B sales teams?"
                    value={question}
                    onChange={e => { setQuestion(e.target.value); setError(''); }}
                  />
                  <p style={s.hint}>Ask a specific category question where brand names appear naturally.</p>
                </div>

                <div style={s.fieldGroup}>
                  <label style={s.label}>TRY AN EXAMPLE <span style={s.labelNote}>click to load</span></label>
                  <div style={s.exGrid}>
                    {EXAMPLE_QUESTIONS.map((ex, i) => (
                      <div key={i}
                        style={{
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

                {/* HOW SCORING WORKS — now just shows the ArcadeScoreBoard "how" tab inline on left */}
                <div style={s.fieldGroup}>
                  <label style={s.label}>HOW SCORING WORKS <span style={s.labelNote}>hover to preview</span></label>
                  <HowScoringMini />
                </div>
              </div>

              {/* RIGHT COL */}
              <div style={s.rightCol}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>
                    BRANDS TO COMPARE
                    <span style={{ ...s.labelNote, color: brands.length === 6 ? COLORS.coral400 : COLORS.gray100 }}>{brands.length} / 6</span>
                  </label>
                  <div style={s.brandRow}>
                    <input ref={brandInputRef} style={s.brandInput}
                      placeholder="Type a brand name and press Enter"
                      value={brandInput}
                      onChange={e => setBrandInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addBrand()}
                      disabled={brands.length >= 6}
                    />
                    <button style={{ ...s.addBtn, opacity: brands.length >= 6 ? .3 : 1 }} onClick={addBrand} disabled={brands.length >= 6}>+</button>
                  </div>

                  <button style={{ ...s.suggestBtn, opacity: suggesting ? .6 : 1 }}
                    onClick={handleSuggestBrands} disabled={suggesting || !question.trim()}>
                    {suggesting
                      ? <span style={s.row}><span style={s.spinner} />Finding relevant brands...</span>
                      : <span style={s.row}><span style={{ fontSize: 12, color: COLORS.purple400 }}>✦</span>Let AI suggest brands for this question</span>
                    }
                  </button>

                  <div style={s.chips}>
                    {brands.length === 0
                      ? <span style={{ fontSize: 11, color: COLORS.gray100 }}>Add brands manually or use AI suggestions above</span>
                      : brands.map((b, i) => (
                        <div key={b} style={s.chip}>
                          <span style={s.chipNum}>{i + 1}</span>
                          <span style={{ fontWeight: 500 }}>{b}</span>
                          <button style={s.chipDel} onClick={() => removeBrand(b)}>×</button>
                        </div>
                      ))
                    }
                  </div>
                </div>

                <div style={s.divider} />

                {error && (
                  <div style={s.errorBox}>
                    <span style={s.errorDot} />{error}
                  </div>
                )}

                {result && (
                  <div style={s.liveBar}>
                    <span style={s.liveDot} />
                    <span style={s.liveLabel}>Brands analyzed</span>
                    <span style={s.liveCount}>{result.brandResults.filter(b => b.mentioned).length} / {result.brandResults.length} mentioned</span>
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
                    <p style={{ fontSize: 13, color: COLORS.gray400, fontWeight: 500 }}>Results will appear here</p>
                    <p style={{ fontSize: 11, color: COLORS.gray100 }}>Load an example or type your own question</p>
                  </div>
                )}

                {result && (
                  <div style={s.resultsCard}>
                    <div style={s.resultsHeader}>
                      <p style={s.resultsQ}>"{result.question}"</p>
                      <div style={s.badges}>
                        {result.suggestedBrands && <span style={s.aiTag}>✦ AI suggested</span>}
                        <span style={s.modelTag}>◈ Groq · LLaMA 3.3</span>
                      </div>
                    </div>

                    {/* RESULT TABS */}
                    <div style={s.tabs}>
                      {[
                        { key: 'scores', label: 'Score Board' },
                        { key: 'answer', label: `AI Answer · ${result.brandResults.filter(b => b.mentioned).length} found` },
                      ].map(({ key, label }) => (
                        <button key={key} style={{ ...s.tab, ...(activeTab === key ? s.tabActive : {}) }} onClick={() => setActiveTab(key)}>
                          {label}
                        </button>
                      ))}
                    </div>

                    {activeTab === 'scores' && (
                      <div style={{ padding: '12px 16px 18px' }}>
                        <ArcadeScoreBoard brandResults={result.brandResults} animateIn={animateIn} />
                      </div>
                    )}

                    {activeTab === 'answer' && (
                      <div style={s.tabBody}>
                        <div style={s.answerLegend}>
                          {result.brandResults.filter(b => b.mentioned).map(b => (
                            <span key={b.brand} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              fontSize: 11, fontWeight: 600,
                              color: SCOL[b.sentiment],
                              background: SLIGHT[b.sentiment],
                              border: `1px solid ${SBORDER[b.sentiment]}`,
                              padding: '3px 9px', borderRadius: 100,
                            }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: SCOL[b.sentiment], display: 'inline-block' }} />
                              {b.brand}
                            </span>
                          ))}
                          {result.brandResults.filter(b => b.mentioned).length === 0 && (
                            <span style={{ fontSize: 11, color: COLORS.gray400 }}>No brands mentioned in this answer</span>
                          )}
                        </div>
                        <div>
                          {result.answerText.split('\n').filter(Boolean).map((para, i) => (
                            <p key={i} style={{ fontSize: 13, color: COLORS.gray800, lineHeight: 1.8, marginBottom: 12 }}>
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
                <div style={s.kicker}><span style={s.kickerLine} />history</div>
                <h1 style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 36, fontWeight: 400, color: COLORS.gray900, letterSpacing: '-.02em' }}>
                  {dashboard.length} analyses stored
                </h1>
              </div>
              <button style={s.refreshBtn} onClick={fetchDashboard}>{dashLoading ? 'Loading...' : '↺ Refresh'}</button>
            </div>

            {!dashLoading && dashboard.length === 0 && (
              <div style={s.empty}>
                <div style={s.emptyRing} />
                <p style={{ fontSize: 13, color: COLORS.gray400, fontWeight: 500 }}>No analyses yet</p>
                <p style={{ fontSize: 11, color: COLORS.gray100 }}>Run your first query to see results here</p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {dashboard.map(entry => (
                <div key={entry.answerId} style={s.dashCard}>
                  <div style={s.dashCardTop}>
                    <p style={s.dashQ}>{entry.questionText}</p>
                    <span style={{ fontSize: 11, color: COLORS.gray100, flexShrink: 0 }}>
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {entry.brands.sort((a, b) => (b.mentioned ? 1 : 0) - (a.mentioned ? 1 : 0)).map(b => (
                      <div key={b.name} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        border: `1px solid ${b.mentioned ? SBORDER[b.sentiment] : COLORS.gray100}`,
                        background: b.mentioned ? SLIGHT[b.sentiment] : COLORS.gray50,
                        borderRadius: 100, padding: '3px 9px', fontSize: 11, fontWeight: 500,
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: b.mentioned ? SCOL[b.sentiment] : COLORS.gray100 }} />
                        <span style={{ color: b.mentioned ? SCOL[b.sentiment] : COLORS.gray400 }}>{b.name}</span>
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; -webkit-font-smoothing: antialiased; }
        textarea, input { font-family: inherit; }
        textarea:focus, input:focus { outline: none; border-color: ${COLORS.purple400} !important; }
        textarea::placeholder, input::placeholder { color: #d1d5db; }
        button { cursor: pointer; transition: all 0.15s ease; }
        button:hover { opacity: 0.88; }
        button:active { transform: scale(0.98); }
        @keyframes arcFade { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes arcBlink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes tickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: .8; } 50% { transform: scale(1.5); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ─── Inline "how scoring works" mini-panel for left col ─ */

function HowScoringMini() {
  const [hovered, setHovered] = useState(null);
  const items = [
    { score: 10, label: 'Positive', verdict: 'BUY',   vc: VERDICT_COL.positive, desc: 'Great deal — get it!' },
    { score: 7,  label: 'Neutral',  verdict: 'MAYBE', vc: VERDICT_COL.neutral,  desc: 'Okay, keep looking' },
    { score: 1,  label: 'Negative', verdict: 'SKIP',  vc: VERDICT_COL.negative, desc: 'You can do better' },
    { score: 0,  label: 'Absent',   verdict: 'GHOST', vc: VERDICT_COL.absent,   desc: 'No data found' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map(item => (
        <div key={item.score}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 13px', borderRadius: 10,
            border: `1.5px solid ${hovered === item.score ? item.vc.border : '#f0f0f0'}`,
            background: hovered === item.score ? item.vc.bg : '#fff',
            transition: 'all .2s', cursor: 'default',
          }}
          onMouseEnter={() => setHovered(item.score)}
          onMouseLeave={() => setHovered(null)}
        >
          <span style={{
            fontSize: 13, fontWeight: 700, padding: '3px 9px', borderRadius: 6,
            border: `1.5px solid ${item.vc.border}`, background: item.vc.bg,
            color: item.vc.text, minWidth: 34, textAlign: 'center',
            fontFamily: "'Instrument Serif',Georgia,serif",
          }}>{item.score}</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: item.vc.text }}>{item.label}</span>
            <span style={{ fontSize: 11, color: COLORS.gray400, marginLeft: 8 }}>{item.desc}</span>
          </div>
          <span style={{
            fontSize: 8, fontWeight: 700, letterSpacing: '.12em',
            padding: '2px 8px', borderRadius: 100,
            color: item.vc.text, border: `1px solid ${item.vc.border}`, background: item.vc.bg,
          }}>{item.verdict}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Styles ───────────────────────────────────────────── */

const s = {
  root: { minHeight: '100vh', background: '#fff', color: COLORS.gray900, fontFamily: "'Inter',-apple-system,sans-serif" },

  // ticker
  tickerWrap: { background: COLORS.purple900, overflow: 'hidden', whiteSpace: 'nowrap', height: 32, display: 'flex', alignItems: 'center', borderBottom: `2px solid ${COLORS.purple800}` },
  tickerInner: { display: 'inline-flex', animation: 'tickerScroll 26s linear infinite', gap: 0 },
  tickerItem: { display: 'inline-flex', alignItems: 'center', gap: 10, padding: '0 24px', fontSize: 11, fontWeight: 600, letterSpacing: '.08em', color: COLORS.purple200, textTransform: 'uppercase' },
  tickerDot: { width: 5, height: 5, borderRadius: '50%', background: COLORS.purple600, flexShrink: 0 },
  tickerSep: { color: COLORS.purple800, fontSize: 14, padding: '0 2px' },

  // flash bar
  flashBar: { background: COLORS.purple50, borderBottom: `1.5px solid ${COLORS.purple100}`, padding: '6px clamp(16px,4vw,48px)', display: 'flex', alignItems: 'center', gap: 16, overflow: 'hidden' },
  flashLabel: { fontSize: 9, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: COLORS.purple400, flexShrink: 0 },
  flashScores: { display: 'flex', gap: 8, flexWrap: 'nowrap', overflow: 'hidden' },
  flashBadge: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, padding: '2px 9px', borderRadius: 100, flexShrink: 0 },

  // header
  header: { borderBottom: `1px solid ${COLORS.gray50}`, background: '#fff', position: 'sticky', top: 0, zIndex: 100 },
  headerInner: { maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,4vw,48px)', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logoGroup: { display: 'flex', alignItems: 'center', gap: 10 },
  logoMark: { width: 32, height: 32, borderRadius: 8, background: COLORS.purple600, color: COLORS.purple50, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 },
  logoName: { fontSize: 16, fontWeight: 600, letterSpacing: '-.02em', color: COLORS.gray900 },
  nav: { display: 'flex', gap: 4, background: COLORS.gray50, padding: 4, borderRadius: 10 },
  navBtn: { fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 500, background: 'transparent', border: 'none', color: COLORS.gray400, padding: '5px 13px', borderRadius: 7 },
  navActive: { background: '#fff', color: COLORS.purple600, boxShadow: '0 1px 3px rgba(0,0,0,.08)' },
  accent: { height: 3, background: `linear-gradient(90deg,${COLORS.purple600} 0%,${COLORS.purple400} 35%,${COLORS.teal400} 70%,transparent 100%)` },

  main: { maxWidth: 1200, margin: '0 auto', padding: 'clamp(0px,1vw,8px) clamp(16px,4vw,48px) 80px' },

  // hero
  hero: { padding: 'clamp(28px,5vw,52px) 0 clamp(20px,3vw,32px)' },
  kicker: { fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: COLORS.purple400, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 },
  kickerLine: { display: 'inline-block', width: 16, height: 2, background: COLORS.purple400 },
  heroTitle: { fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 'clamp(2.4rem,6vw,4.6rem)', lineHeight: 1.08, letterSpacing: '-.03em', color: COLORS.gray900, marginBottom: '.3em' },
  heroSub: { fontSize: 15, color: COLORS.gray400, lineHeight: 1.6, maxWidth: 440 },

  // bumpers
  bumperRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'clamp(20px,3vw,36px)', overflowX: 'auto', scrollbarWidth: 'none' },
  bumper: { display: 'inline-flex', alignItems: 'center', gap: 7, border: '1.5px solid', borderRadius: 100, padding: '7px 14px', fontSize: 12, fontWeight: 500, fontFamily: "'Inter',sans-serif", transition: 'all .18s', whiteSpace: 'nowrap', flexShrink: 0 },
  bumperPulse: { width: 7, height: 7, borderRadius: '50%', background: COLORS.purple400, animation: 'pulse 1.4s ease-in-out infinite', flexShrink: 0 },

  twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 48, alignItems: 'start' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: 36 },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 16 },

  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontSize: 9, fontWeight: 700, letterSpacing: '.14em', color: COLORS.gray400, display: 'flex', justifyContent: 'space-between', alignItems: 'center', textTransform: 'uppercase' },
  labelNote: { fontWeight: 400, color: COLORS.gray100, letterSpacing: '.02em', fontSize: 9 },
  textarea: { width: '100%', background: COLORS.gray50, border: `1.5px solid ${COLORS.gray100}`, borderRadius: 10, color: COLORS.gray900, fontSize: 14, lineHeight: 1.6, padding: '14px 16px', resize: 'none', transition: 'border-color .15s', fontFamily: "'Inter',sans-serif" },
  hint: { fontSize: 11, color: COLORS.gray100, lineHeight: 1.5 },

  exGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  exCard: { display: 'flex', flexDirection: 'column', gap: 4, padding: '11px 13px', borderRadius: 10, border: '1.5px solid', cursor: 'pointer', transition: 'all .15s', background: '#fff' },
  exCat: { fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' },
  exQ: { fontSize: 11, lineHeight: 1.4 },

  // right col inputs
  brandRow: { display: 'flex', gap: 8 },
  brandInput: { flex: 1, background: COLORS.gray50, border: `1.5px solid ${COLORS.gray100}`, borderRadius: 10, color: COLORS.gray900, fontSize: 13, padding: '10px 14px', fontFamily: "'Inter',sans-serif", transition: 'border-color .15s' },
  addBtn: { width: 42, height: 42, borderRadius: 10, border: 'none', background: COLORS.purple600, color: COLORS.purple50, fontSize: 22, fontWeight: 300, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  suggestBtn: { width: '100%', padding: '10px 16px', border: `1.5px solid ${COLORS.purple200}`, borderRadius: 10, fontSize: 12, fontWeight: 500, color: COLORS.purple600, background: COLORS.purple50, fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 7, minHeight: 34, alignItems: 'center' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 6, background: COLORS.purple50, border: `1.5px solid ${COLORS.purple200}`, borderRadius: 100, padding: '4px 9px 4px 5px', fontSize: 12, color: COLORS.purple800 },
  chipNum: { width: 18, height: 18, borderRadius: '50%', background: COLORS.purple600, color: COLORS.purple50, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 },
  chipDel: { background: 'none', border: 'none', color: COLORS.purple200, fontSize: 15, lineHeight: 1, padding: '0 0 0 2px' },
  divider: { height: 1, background: COLORS.gray50 },
  errorBox: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: COLORS.coral600, background: COLORS.coral50, border: `1.5px solid #F0997B`, borderRadius: 8, padding: '9px 13px' },
  errorDot: { width: 6, height: 6, borderRadius: '50%', background: COLORS.coral400, flexShrink: 0 },

  // live bar
  liveBar: { display: 'flex', alignItems: 'center', gap: 10, background: COLORS.gray50, borderRadius: 10, padding: '9px 13px' },
  liveDot: { width: 7, height: 7, borderRadius: '50%', background: COLORS.teal400, animation: 'pulse 1.2s infinite', flexShrink: 0 },
  liveLabel: { fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: COLORS.gray400, textTransform: 'uppercase' },
  liveCount: { fontSize: 14, fontWeight: 700, color: COLORS.gray900, fontFamily: "'Instrument Serif',Georgia,serif", marginLeft: 'auto' },

  runBtn: { width: '100%', padding: '14px 24px', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, letterSpacing: '-.01em', background: COLORS.purple600, color: COLORS.purple50, fontFamily: "'Inter',sans-serif" },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  spinner: { width: 13, height: 13, border: `2px solid ${COLORS.purple200}`, borderTopColor: COLORS.purple50, borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' },

  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '44px 0', gap: 10 },
  emptyRing: { width: 36, height: 36, borderRadius: '50%', border: `1.5px solid ${COLORS.purple100}`, background: COLORS.purple50 },

  // results card
  resultsCard: { border: `1.5px solid ${COLORS.purple100}`, borderRadius: 14, overflow: 'hidden' },
  resultsHeader: { padding: '16px 18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  resultsQ: { fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 15, color: COLORS.gray400, fontStyle: 'italic', lineHeight: 1.4, flex: 1 },
  badges: { display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' },
  aiTag: { fontSize: 9, color: COLORS.purple600, background: COLORS.purple50, border: `1px solid ${COLORS.purple200}`, padding: '3px 8px', borderRadius: 100, fontWeight: 600 },
  modelTag: { fontSize: 9, color: COLORS.teal600, background: COLORS.teal50, border: `1px solid ${COLORS.teal200}`, padding: '3px 8px', borderRadius: 100, fontWeight: 600 },

  tabs: { display: 'flex', padding: '12px 18px 0', borderBottom: `1px solid ${COLORS.purple50}`, marginTop: 14, gap: 0 },
  tab: { fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 500, background: 'none', border: 'none', color: COLORS.gray400, padding: '7px 0', marginRight: 20, borderBottom: '2px solid transparent', transition: 'all .15s' },
  tabActive: { color: COLORS.purple600, borderBottomColor: COLORS.purple600 },

  tabBody: { display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 18px 18px' },
  answerLegend: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  backBtn: { fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 500, color: COLORS.purple400, background: 'none', border: 'none', padding: 0, textAlign: 'left', marginTop: 6 },

  // arcade board
  boardOuter: { display: 'flex', flexDirection: 'column', gap: 0 },
  boardTabs: { display: 'flex', gap: 0, borderBottom: `1.5px solid ${COLORS.gray50}`, marginBottom: 0 },
  boardTab: { fontFamily: "'Inter',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', background: 'none', border: 'none', color: COLORS.gray400, padding: '8px 14px', borderBottom: '2px solid transparent', cursor: 'pointer', transition: 'all .15s' },
  boardTabOn: { color: COLORS.purple600, borderBottomColor: COLORS.purple600 },
  legend: { display: 'flex', gap: 10, flexWrap: 'wrap', padding: '12px 0 10px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: COLORS.gray400 },
  shell: { background: ARC.shell, borderRadius: 12, padding: '16px 16px 14px', border: `2px solid ${ARC.shellBdr}`, position: 'relative', overflow: 'hidden' },
  shellLabel: { position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', fontSize: 8, fontWeight: 700, letterSpacing: '.22em', color: ARC.headerTxt, textTransform: 'uppercase', fontFamily: "'Inter',sans-serif" },
  tableHead: { display: 'flex', alignItems: 'center', padding: '24px 0 8px', borderBottom: `1px solid ${ARC.divider}`, marginBottom: 4 },
  headCell: { fontSize: 8, fontWeight: 700, letterSpacing: '.14em', color: ARC.headerTxt, textTransform: 'uppercase', padding: '0 6px' },
  scoreRow: { display: 'flex', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${ARC.divider}`, borderRadius: 6, transition: 'background .15s' },
  credits: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${ARC.divider}` },

  // dashboard
  dashWrap: { maxWidth: 720, margin: '0 auto', paddingTop: 'clamp(28px,5vw,52px)' },
  dashTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 },
  refreshBtn: { fontSize: 12, fontWeight: 500, background: COLORS.purple50, border: `1.5px solid ${COLORS.purple200}`, color: COLORS.purple600, padding: '8px 14px', borderRadius: 8, fontFamily: "'Inter',sans-serif" },
  dashCard: { border: `1.5px solid ${COLORS.gray50}`, borderRadius: 12, padding: '18px 22px', background: '#fff' },
  dashCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 12 },
  dashQ: { fontSize: 14, color: COLORS.gray900, lineHeight: 1.4, fontWeight: 500, flex: 1, fontFamily: "'Instrument Serif',Georgia,serif" },
};
