import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import {
  fetchProductByBarcode,
  calculateHealthScore,
  getHealthGrade,
  getConditionWarnings,
} from './api';

import { ScanIcon, SearchIcon, AlertIcon } from './components/Icons';
import ScoreRing         from './components/ScoreRing';
import Badge             from './components/Badge';
import Tab               from './components/Tab';
import NutritionPanel    from './components/NutritionPanel';
import IngredientsPanel  from './components/IngredientsPanel';
import HealthPanel       from './components/HealthPanel';
import AllergensPanel    from './components/AllergensPanel';
import ConditionWarnings from './components/ConditionWarnings';
import BarcodeScanner    from './components/BarcodeScanner';
import ThemeToggle       from './components/ThemeToggle';

const EXAMPLE_BARCODES = [
  { code: '8901030697976', name: 'Maggi Noodles' },
  { code: '8901491500015', name: 'Amul Butter' },
  { code: '8906050311012', name: 'Parle-G' },
  { code: '8901555100209', name: 'Haldirams Bhujia' },
];

const TABS = [
  { id: 'nutrition',   label: 'Nutrition',   icon: '🥗' },
  { id: 'ingredients', label: 'Ingredients', icon: '📋' },
  { id: 'health',      label: 'Health',      icon: '💊' },
  { id: 'allergens',   label: 'Allergens',   icon: '⚠️'  },
];

const CONDITIONS = {
  diabetes:     '🩸 Diabetes',
  hypertension: '❤️ High BP',
  obesity:      '⚖️ Obesity',
  cholesterol:  '🫀 Cholesterol',
  kidney:       '🫘 Kidney Issue',
};

export default function App() {
  const [barcode, setBarcode]   = useState('');
  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [tab, setTab]           = useState('nutrition');
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [history, setHistory]   = useState([]);
  const [showScanner, setShowScanner] = useState(false);

  // ── Theme ─────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('lc-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lc-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // ── Search ────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (code) => {
    const query = (code || barcode).trim();
    if (!query) return;
    setLoading(true);
    setError(null);
    setProduct(null);
    setTab('nutrition');
    try {
      const result = await fetchProductByBarcode(query);
      if (result) {
        setProduct(result);
        setHistory(prev => {
          const filtered = prev.filter(h => h.barcode !== result.barcode);
          return [result, ...filtered].slice(0, 6);
        });
      } else {
        setError(`No product found for barcode "${query}". Try a different barcode or check if the product is in the India database.`);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [barcode]);

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };
  const toggleCondition = (c) =>
    setSelectedConditions(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );

  // ── Scanner callback ──────────────────────────────────────────────────
  const handleScanDetected = useCallback((code) => {
    setShowScanner(false);
    setBarcode(code);
    handleSearch(code);
  }, [handleSearch]);

  const score             = product ? calculateHealthScore(product.nutrients, product.nova_group) : 0;
  const gradeInfo         = getHealthGrade(score);
  const conditionWarnings = product ? getConditionWarnings(product.nutrients) : {};

  return (
    <div className="app" data-theme={theme}>
      <div className="bg-orb orb1" />
      <div className="bg-orb orb2" />

      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon"><ScanIcon /></div>
            <div>
              <div className="logo-title">LabelCheck</div>
              <div className="logo-sub">India Food Intelligence</div>
            </div>
          </div>
          <div className="header-right">
            <div className="header-badge">
              <span className="dot" />
              Open Food Facts · India
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      <main className="main">
        {/* ── Search ── */}
        <section className="search-section">
          <div className="search-hero">
            <h1 className="hero-title">
              Know what's <span className="accent-text">inside</span><br />your food
            </h1>
            <p className="hero-sub">
              Enter a barcode, scan with your camera, or upload a photo — powered by India's largest food database.
            </p>
          </div>

          <div className="search-box">
            <div className="search-input-wrap">
              <SearchIcon />
              <input
                type="text"
                className="search-input"
                placeholder="Enter barcode number (e.g. 8901030697976)"
                value={barcode}
                onChange={e => setBarcode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={handleKeyDown}
                maxLength={15}
              />
            </div>
            <button
              className="scan-icon-btn"
              onClick={() => setShowScanner(true)}
              title="Scan barcode"
            >
              <ScanIcon />
            </button>
            <button
              className="search-btn"
              onClick={() => handleSearch()}
              disabled={loading || !barcode.trim()}
            >
              {loading ? <span className="spinner" /> : 'Check Label'}
            </button>
          </div>

          {/* Quick examples */}
          <div className="examples">
            <span className="examples-label">Try popular Indian products:</span>
            <div className="example-chips">
              {EXAMPLE_BARCODES.map(ex => (
                <button
                  key={ex.code}
                  className="chip"
                  onClick={() => { setBarcode(ex.code); handleSearch(ex.code); }}
                >
                  {ex.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Error ── */}
        {error && (
          <div className="error-card animate-fadeUp">
            <AlertIcon /><span>{error}</span>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="loading-wrap animate-fadeIn">
            <div className="loading-pulse">
              <div className="pulse-ring" />
              <div className="pulse-ring delay" />
              <ScanIcon />
            </div>
            <p className="loading-text">Scanning product database…</p>
          </div>
        )}

        {/* ── Product result ── */}
        {product && !loading && (
          <div className="result animate-fadeUp">
            <div className="product-header">
              <div className="product-image-wrap">
                {product.image
                  ? <img src={product.image} alt={product.name} className="product-image" />
                  : <div className="product-image-placeholder">📦</div>
                }
              </div>
              <div className="product-meta">
                <div className="product-brand">{product.brand}</div>
                <h2 className="product-name">{product.name}</h2>
                <div className="product-tags">
                  {product.quantity   && <Badge text={product.quantity}              color="#00b8ff" />}
                  {product.category   && <Badge text={product.category.slice(0, 30)} color="#a78bfa" />}
                  {product.nova_group && (
                    <Badge
                      text={`NOVA ${product.nova_group}`}
                      color={['#00e5a0','#7adf3e','#ffb830','#ff4757'][product.nova_group - 1]}
                    />
                  )}
                </div>
                <div className="source-tag">Source: {product.source} · #{product.barcode}</div>
              </div>
              <div className="score-section">
                <ScoreRing score={score} grade={gradeInfo.grade} label={gradeInfo.label} color={gradeInfo.color} />
              </div>
            </div>

            {/* Condition filter */}
            <div className="condition-filter">
              <div className="condition-label">I have:</div>
              <div className="condition-chips">
                {Object.entries(CONDITIONS).map(([key, label]) => (
                  <button
                    key={key}
                    className={`cond-chip ${selectedConditions.includes(key) ? 'active' : ''}`}
                    onClick={() => toggleCondition(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <ConditionWarnings
              selectedConditions={selectedConditions}
              conditionWarnings={conditionWarnings}
            />

            <Tab tabs={TABS} active={tab} onChange={setTab} />

            <div className="tab-content">
              {tab === 'nutrition'   && <NutritionPanel   product={product} />}
              {tab === 'ingredients' && <IngredientsPanel product={product} />}
              {tab === 'health'      && <HealthPanel      product={product} score={score} />}
              {tab === 'allergens'   && <AllergensPanel   product={product} />}
            </div>
          </div>
        )}

        {/* ── History ── */}
        {history.length > 0 && !product && !loading && (
          <div className="history-section animate-fadeUp">
            <div className="history-title">Recent Scans</div>
            <div className="history-grid">
              {history.map(h => {
                const s = calculateHealthScore(h.nutrients, h.nova_group);
                const g = getHealthGrade(s);
                return (
                  <button
                    key={h.barcode}
                    className="history-card"
                    onClick={() => { setBarcode(h.barcode); setProduct(h); setTab('nutrition'); }}
                  >
                    <div className="hc-grade" style={{ color: g.color }}>{g.grade}</div>
                    <div className="hc-name">{h.name}</div>
                    <div className="hc-brand">{h.brand}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <div>Data sourced from Open Food Facts — community-driven food database</div>
        <div>LabelCheck India · For educational purposes · Always verify with product packaging</div>
      </footer>

      {/* ── Barcode Scanner Modal ── */}
      {showScanner && (
        <BarcodeScanner
          onDetected={handleScanDetected}
          onClose={() => setShowScanner(false)}
          theme={theme}
        />
      )}
    </div>
  );
}
