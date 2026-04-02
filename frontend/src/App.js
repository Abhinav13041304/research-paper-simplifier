import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import mermaid from "mermaid";
import "./App.css";

mermaid.initialize({ startOnLoad: false, theme: "dark", flowchart: { curve: "basis" } });

function MermaidDiagram({ chart, id }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && chart) {
      const cleaned = chart.replace(/```mermaid/g, "").replace(/```/g, "").trim();
      ref.current.innerHTML = "";
      mermaid.render(`diagram-${id}-${Date.now()}`, cleaned)
        .then(({ svg }) => { ref.current.innerHTML = svg; })
        .catch(() => { ref.current.innerHTML = "<p style='color:#ff6584;font-size:13px'>Could not render diagram.</p>"; });
    }
  }, [chart, id]);
  return <div ref={ref} className="mermaid-container" style={{ width: "100%", overflowX: "auto" }} />;
}

const TABS = [
  { id: "Summary", icon: "📋" },
  { id: "Flowchart", icon: "🔄" },
  { id: "Concept Map", icon: "🗺" },
  { id: "Q&A", icon: "❓" },
  { id: "Concepts", icon: "💡" },
];

const LOADING_STEPS = [
  "Extracting text from PDF...",
  "Generating summary...",
  "Identifying key concepts...",
  "Building flowchart...",
  "Creating concept map...",
  "Generating exam questions...",
  "Almost done...",
];

export default function App() {
  const [file, setFile] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [depth, setDepth] = useState("student");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Summary");
  const [darkMode, setDarkMode] = useState(true);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const bg = darkMode ? "#0a0a1a" : "#f5f5ff";
  const surface = darkMode ? "#12122a" : "#ffffff";
  const surface2 = darkMode ? "#1a1a3a" : "#f0f0ff";
  const text = darkMode ? "#e0e0ff" : "#1a1a3a";
  const textMuted = darkMode ? "#8888aa" : "#6666aa";
  const border = darkMode ? "#2a2a5a" : "#d0d0ff";
  const accent = "#6c63ff";

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: darkMode ? "dark" : "default", flowchart: { curve: "basis" } });
  }, [darkMode]);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep(s => (s + 1) % LOADING_STEPS.length);
      }, 1800);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith(".pdf")) setFile(dropped);
    else alert("Please drop a PDF file");
  }, []);

  const handleUpload = async () => {
    if (!file) return alert("Please select a PDF file first");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("depth", depth);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("http://127.0.0.1:5000/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (data.error) setError(data.error);
      else { setResult(data); setActiveTab("Summary"); }
    } catch {
      setError("Could not connect to backend. Make sure Flask is running.");
    } finally {
      setLoading(false);
    }
  };

  const difficultyColor = (score) => {
    if (score <= 3) return "#4caf50";
    if (score <= 6) return "#f9a825";
    return "#ff6584";
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {initialLoading && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="splash-screen"
            style={{ background: bg }}
          >
            <div className="splash-ring">
              <div className="splash-ring-inner"></div>
            </div>
            <h1 className="splash-text">PaperLens</h1>
          </motion.div>
        )}
      </AnimatePresence>

      {!initialLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ minHeight: "100vh", background: bg, color: text, transition: "all 0.3s" }}
        >
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{ borderBottom: `1px solid ${border}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 100, background: darkMode ? "#0a0a1acc" : "#f5f5ffcc" }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "800", background: "linear-gradient(135deg, #6c63ff, #00bcd4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                PaperLens
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: textMuted }}>
                From research papers to textbooks — understand anything instantly
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDarkMode(!darkMode)}
              style={{ padding: "8px 18px", borderRadius: "20px", border: `1px solid ${border}`, background: surface2, color: text, cursor: "pointer", fontSize: "13px", fontWeight: "500" }}
            >
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </motion.button>
          </motion.div>

          <div style={{ maxWidth: "860px", margin: "0 auto", padding: "36px 20px" }}>

            {/* Upload zone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`upload-zone ${dragging ? "dragging" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ border: `2px dashed ${dragging ? accent : border}`, borderRadius: "16px", padding: "40px", textAlign: "center", marginBottom: "24px", background: dragging ? `${accent}11` : surface, transition: "all 0.2s" }}
            >
              <input ref={fileInputRef} type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} style={{ display: "none" }} />
              <motion.div
                animate={{ scale: dragging ? 1.1 : 1 }}
                style={{ fontSize: "40px", marginBottom: "12px" }}
              >
                {file ? "📄" : "📂"}
              </motion.div>
              {file ? (
                <div>
                  <p style={{ color: accent, fontWeight: "600", fontSize: "15px", margin: "0 0 4px" }}>{file.name}</p>
                  <p style={{ color: textMuted, fontSize: "13px", margin: 0 }}>{(file.size / 1024).toFixed(0)} KB — click to change</p>
                </div>
              ) : (
                <div>
                  <p style={{ color: text, fontWeight: "600", fontSize: "15px", margin: "0 0 4px" }}>Drop your PDF here</p>
                  <p style={{ color: textMuted, fontSize: "13px", margin: 0 }}>or click to browse — research papers, textbooks, notes</p>
                </div>
              )}
            </motion.div>

            {/* Depth selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{ marginBottom: "20px" }}
            >
              <p style={{ fontWeight: "600", marginBottom: "10px", fontSize: "13px", color: textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Explanation depth</p>
              <div style={{ display: "flex", gap: "10px" }}>
                {[
                  { id: "quick", label: "Quick", desc: "5 min overview" },
                  { id: "student", label: "Student", desc: "Full breakdown" },
                  { id: "researcher", label: "Researcher", desc: "Deep technical" },
                ].map((d) => (
                  <motion.button
                    key={d.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDepth(d.id)}
                    style={{ flex: 1, padding: "12px", borderRadius: "12px", border: `2px solid ${depth === d.id ? accent : border}`, background: depth === d.id ? `${accent}22` : surface2, color: depth === d.id ? accent : text, cursor: "pointer", textAlign: "center" }}
                  >
                    <div style={{ fontWeight: "600", fontSize: "14px" }}>{d.label}</div>
                    <div style={{ fontSize: "11px", color: depth === d.id ? `${accent}cc` : textMuted, marginTop: "2px" }}>{d.desc}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Analyse button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={!loading ? { scale: 1.01, boxShadow: "0 4px 24px #6c63ff44" } : {}}
              whileTap={!loading ? { scale: 0.99 } : {}}
              onClick={handleUpload}
              disabled={loading}
              className="btn-primary"
              style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "none", background: loading ? surface2 : `linear-gradient(135deg, ${accent}, #00bcd4)`, color: loading ? textMuted : "white", fontSize: "16px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", marginBottom: "28px", letterSpacing: "0.02em" }}
            >
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                  <div className="loading-dots">
                    <span /><span /><span />
                  </div>
                  <span style={{ fontSize: "14px" }}>{LOADING_STEPS[loadingStep]}</span>
                </div>
              ) : "Analyse Document →"}
            </motion.button>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ background: "#ff000022", border: "1px solid #ff6584", borderRadius: "12px", padding: "14px 18px", color: "#ff6584", marginBottom: "20px", fontSize: "14px" }}
                >
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Stats row */}
                  <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                    {[
                      { label: `Difficulty ${result.difficulty_score}/10`, color: difficultyColor(result.difficulty_score) },
                      { label: `${result.word_count?.toLocaleString()} words`, color: "#00bcd4" },
                      { label: result.depth, color: accent },
                      { label: `${result.concepts?.length} concepts`, color: "#f9a825" },
                    ].map((badge, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        style={{ background: `${badge.color}22`, color: badge.color, border: `1px solid ${badge.color}44`, padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}
                      >
                        {badge.label}
                      </motion.span>
                    ))}
                  </div>

                  {/* Tabs */}
                  <div style={{ display: "flex", gap: "2px", borderBottom: `1px solid ${border}`, marginBottom: "20px", overflowX: "auto" }}>
                    {TABS.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{ padding: "10px 20px", border: "none", borderBottom: `2px solid ${activeTab === tab.id ? accent : "transparent"}`, background: "transparent", color: activeTab === tab.id ? accent : textMuted, cursor: "pointer", fontWeight: activeTab === tab.id ? "600" : "400", fontSize: "14px", whiteSpace: "nowrap", transition: "all 0.2s" }}
                      >
                        {tab.icon} {tab.id}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <div className="tab-content" key={activeTab}>
                    {activeTab === "Summary" && (
                      <div className="stagger-children" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div className="result-card" style={{ background: surface, border: `1px solid ${border}`, borderRadius: "14px", padding: "22px" }}>
                          <h3 style={{ margin: "0 0 14px", fontSize: "14px", color: accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>Summary</h3>
                          <p style={{ lineHeight: "1.85", color: text, whiteSpace: "pre-wrap", margin: 0, fontSize: "14px" }}>{result.summary}</p>
                        </div>
                        <div className="result-card" style={{ background: surface, border: `1px solid ${border}`, borderRadius: "14px", padding: "22px" }}>
                          <h3 style={{ margin: "0 0 14px", fontSize: "14px", color: "#f9a825", textTransform: "uppercase", letterSpacing: "0.05em" }}>Real-world analogy</h3>
                          <p style={{ lineHeight: "1.85", color: text, fontStyle: "italic", margin: 0, fontSize: "14px" }}>{result.analogy}</p>
                        </div>
                        <div className="result-card" style={{ background: surface, border: `1px solid ${border}`, borderRadius: "14px", padding: "22px" }}>
                          <h3 style={{ margin: "0 0 14px", fontSize: "14px", color: "#4caf50", textTransform: "uppercase", letterSpacing: "0.05em" }}>Prerequisites</h3>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {result.prerequisites.map((p, i) => (
                              <span key={i} style={{ background: "#4caf5022", color: "#4caf50", border: "1px solid #4caf5044", padding: "5px 12px", borderRadius: "20px", fontSize: "13px" }}>{p}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "Flowchart" && (
                      <div className="result-card" style={{ background: surface, border: `1px solid ${border}`, borderRadius: "14px", padding: "22px" }}>
                        <h3 style={{ margin: "0 0 16px", fontSize: "14px", color: accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>Methodology Flowchart</h3>
                        <div style={{ background: surface2, borderRadius: "12px", padding: "24px" }}>
                          <MermaidDiagram chart={result.flowchart} id="flowchart" />
                        </div>
                      </div>
                    )}

                    {activeTab === "Concept Map" && (
                      <div className="result-card" style={{ background: surface, border: `1px solid ${border}`, borderRadius: "14px", padding: "22px" }}>
                        <h3 style={{ margin: "0 0 16px", fontSize: "14px", color: "#00bcd4", textTransform: "uppercase", letterSpacing: "0.05em" }}>Concept Relationship Map</h3>
                        <div style={{ background: surface2, borderRadius: "12px", padding: "24px" }}>
                          <MermaidDiagram chart={result.concept_diagram} id="concept" />
                        </div>
                      </div>
                    )}

                    {activeTab === "Q&A" && result.qa && (
                      <div className="stagger-children" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {[
                          { key: "one_mark", label: "1 Mark", color: "#4caf50", desc: "Definition & fact-based" },
                          { key: "five_mark", label: "5 Mark", color: "#f9a825", desc: "Explanation & comparison" },
                          { key: "ten_mark", label: "10 Mark", color: "#ff6584", desc: "Analysis & discussion" },
                        ].map(({ key, label, color, desc }) => (
                          <div key={key} className="result-card" style={{ background: surface, border: `1px solid ${border}`, borderRadius: "14px", padding: "22px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                              <span style={{ background: `${color}22`, color, padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>{label}</span>
                              <span style={{ fontSize: "12px", color: textMuted }}>{desc}</span>
                            </div>
                            <ol style={{ margin: 0, paddingLeft: "20px" }}>
                              {result.qa[key]?.map((q, i) => (
                                <li key={i} style={{ marginBottom: "12px", color: text, fontSize: "14px", lineHeight: "1.7" }}>{q}</li>
                              ))}
                            </ol>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTab === "Concepts" && (
                      <div className="result-card" style={{ background: surface, border: `1px solid ${border}`, borderRadius: "14px", padding: "22px" }}>
                        <h3 style={{ margin: "0 0 16px", fontSize: "14px", color: accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>Key Concepts</h3>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                          {result.concepts.map((c, i) => {
                            const colors = ["#6c63ff", "#ff6584", "#f9a825", "#00bcd4", "#4caf50", "#ff9800", "#e91e63", "#9c27b0"];
                            const color = colors[i % colors.length];
                            return (
                              <motion.span
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ scale: 1.08 }}
                                style={{ background: `${color}22`, color, border: `1px solid ${color}44`, padding: "8px 18px", borderRadius: "20px", fontSize: "14px", fontWeight: "500" }}
                              >
                                {c}
                              </motion.span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!result && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: "center", padding: "40px", color: textMuted }}
              >
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚛️</div>
                <p style={{ fontSize: "15px", margin: "0 0 8px", color: text, fontWeight: "500" }}>Ready to analyse</p>
                <p style={{ fontSize: "13px", margin: 0 }}>Upload a PDF and click Analyse to get started</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
}