import { useState, useEffect, useRef } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  flowchart: { curve: "basis" },
});

function MermaidDiagram({ chart, id }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && chart) {
      const cleaned = chart
        .replace(/```mermaid/g, "")
        .replace(/```/g, "")
        .trim();
      ref.current.innerHTML = "";
      mermaid.render(`diagram-${id}-${Date.now()}`, cleaned)
        .then(({ svg }) => {
          ref.current.innerHTML = svg;
        })
        .catch((err) => {
          ref.current.innerHTML = `<p style='color:#ff6584;font-size:13px'>Could not render diagram: ${err.message}</p>`;
        });
    }
  }, [chart, id]);

  return <div ref={ref} style={{ width: "100%", overflowX: "auto" }} />;
}

const TABS = ["Summary", "Flowchart", "Concept Map", "Q&A", "Concepts"];

export default function App() {
  const [file, setFile] = useState(null);
  const [depth, setDepth] = useState("student");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Summary");
  const [darkMode, setDarkMode] = useState(true);

  const bg = darkMode ? "#0a0a1a" : "#f5f5ff";
  const surface = darkMode ? "#12122a" : "#ffffff";
  const surface2 = darkMode ? "#1a1a3a" : "#f0f0ff";
  const text = darkMode ? "#e0e0ff" : "#1a1a3a";
  const textMuted = darkMode ? "#8888aa" : "#6666aa";
  const border = darkMode ? "#2a2a5a" : "#d0d0ff";
  const accent = "#6c63ff";

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: darkMode ? "dark" : "default",
      flowchart: { curve: "basis" },
    });
  }, [darkMode]);

  const handleUpload = async () => {
    if (!file) return alert("Please select a PDF file first");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("depth", depth);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.error) setError(data.error);
      else { setResult(data); setActiveTab("Summary"); }
    } catch {
      setError("Could not connect to backend. Make sure Flask is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "'Segoe UI', sans-serif", transition: "all 0.3s" }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${border}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700", background: "linear-gradient(135deg, #6c63ff, #00bcd4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            PaperLens
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: "13px", color: textMuted }}>
            From research papers to textbooks — understand anything instantly
          </p>
        </div>
        <button onClick={() => setDarkMode(!darkMode)}
          style={{ padding: "8px 16px", borderRadius: "20px", border: `1px solid ${border}`, background: surface2, color: text, cursor: "pointer", fontSize: "13px" }}>
          {darkMode ? "Light mode" : "Dark mode"}
        </button>
      </div>

      {/* Upload section */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 20px" }}>

        <div style={{ border: `2px dashed ${border}`, borderRadius: "12px", padding: "32px", textAlign: "center", marginBottom: "20px", background: surface }}>
          <div style={{ fontSize: "32px", marginBottom: "10px" }}>📄</div>
          <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} style={{ marginBottom: "8px" }} />
          {file && <p style={{ color: textMuted, fontSize: "13px", margin: "6px 0 0" }}>Selected: {file.name}</p>}
        </div>

        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontWeight: "600", marginBottom: "10px", fontSize: "14px" }}>How deep do you want to go?</p>
          <div style={{ display: "flex", gap: "10px" }}>
            {["quick", "student", "researcher"].map((d) => (
              <button key={d} onClick={() => setDepth(d)}
                style={{ padding: "8px 20px", borderRadius: "20px", border: `2px solid ${depth === d ? accent : border}`, background: depth === d ? `${accent}22` : surface2, color: depth === d ? accent : text, cursor: "pointer", fontWeight: "500", textTransform: "capitalize", fontSize: "13px" }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleUpload} disabled={loading}
          style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "none", background: loading ? "#444" : accent, color: "white", fontSize: "16px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", marginBottom: "24px" }}>
          {loading ? "⚙️ Analysing document..." : "Analyse Document"}
        </button>

        {error && (
          <div style={{ background: "#ff000022", border: "1px solid #ff6584", borderRadius: "10px", padding: "14px", color: "#ff6584", marginBottom: "20px" }}>
            {error}
          </div>
        )}

        {/* Difficulty badge */}
        {result && (
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
            <span style={{ background: `${accent}22`, color: accent, padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
              Difficulty: {result.difficulty_score}/10
            </span>
            <span style={{ background: "#00bcd422", color: "#00bcd4", padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
              {result.word_count?.toLocaleString()} words
            </span>
            <span style={{ background: "#4caf5022", color: "#4caf50", padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
              Depth: {result.depth}
            </span>
          </div>
        )}

        {/* Tabs */}
        {result && (
          <div>
            <div style={{ display: "flex", gap: "4px", borderBottom: `1px solid ${border}`, marginBottom: "20px", overflowX: "auto" }}>
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding: "10px 18px", border: "none", borderBottom: `2px solid ${activeTab === tab ? accent : "transparent"}`, background: "transparent", color: activeTab === tab ? accent : textMuted, cursor: "pointer", fontWeight: activeTab === tab ? "600" : "400", fontSize: "14px", whiteSpace: "nowrap" }}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Summary Tab */}
            {activeTab === "Summary" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: "12px", padding: "20px" }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: "15px", color: accent }}>Summary</h3>
                  <p style={{ lineHeight: "1.8", color: text, whiteSpace: "pre-wrap", margin: 0, fontSize: "14px" }}>{result.summary}</p>
                </div>
                <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: "12px", padding: "20px" }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: "15px", color: "#f9a825" }}>Analogy</h3>
                  <p style={{ lineHeight: "1.8", color: text, fontStyle: "italic", margin: 0, fontSize: "14px" }}>{result.analogy}</p>
                </div>
                <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: "12px", padding: "20px" }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: "15px", color: "#4caf50" }}>Prerequisites</h3>
                  <ul style={{ margin: 0, paddingLeft: "20px" }}>
                    {result.prerequisites.map((p, i) => (
                      <li key={i} style={{ marginBottom: "6px", color: text, fontSize: "14px" }}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Flowchart Tab */}
            {activeTab === "Flowchart" && (
              <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: accent }}>Methodology Flowchart</h3>
                <div style={{ background: surface2, borderRadius: "10px", padding: "20px" }}>
                  <MermaidDiagram chart={result.flowchart} id="flowchart" />
                </div>
                <details style={{ marginTop: "12px" }}>
                  <summary style={{ cursor: "pointer", fontSize: "12px", color: textMuted }}>View raw Mermaid code</summary>
                  <pre style={{ background: surface2, padding: "12px", borderRadius: "8px", fontSize: "12px", color: textMuted, overflowX: "auto", marginTop: "8px" }}>
                    {result.flowchart}
                  </pre>
                </details>
              </div>
            )}

            {/* Concept Map Tab */}
            {activeTab === "Concept Map" && (
              <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#00bcd4" }}>Concept Relationship Map</h3>
                <div style={{ background: surface2, borderRadius: "10px", padding: "20px" }}>
                  <MermaidDiagram chart={result.concept_diagram} id="concept" />
                </div>
                <details style={{ marginTop: "12px" }}>
                  <summary style={{ cursor: "pointer", fontSize: "12px", color: textMuted }}>View raw Mermaid code</summary>
                  <pre style={{ background: surface2, padding: "12px", borderRadius: "8px", fontSize: "12px", color: textMuted, overflowX: "auto", marginTop: "8px" }}>
                    {result.concept_diagram}
                  </pre>
                </details>
              </div>
            )}

            {/* Q&A Tab */}
            {activeTab === "Q&A" && result.qa && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  { key: "one_mark", label: "1 Mark Questions", color: "#4caf50", desc: "Definition and fact-based" },
                  { key: "five_mark", label: "5 Mark Questions", color: "#f9a825", desc: "Explanation and comparison" },
                  { key: "ten_mark", label: "10 Mark Questions", color: "#ff6584", desc: "Analysis and discussion" },
                ].map(({ key, label, color, desc }) => (
                  <div key={key} style={{ background: surface, border: `1px solid ${border}`, borderRadius: "12px", padding: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                      <span style={{ background: `${color}22`, color: color, padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>{label}</span>
                      <span style={{ fontSize: "12px", color: textMuted }}>{desc}</span>
                    </div>
                    <ol style={{ margin: 0, paddingLeft: "20px" }}>
                      {result.qa[key]?.map((q, i) => (
                        <li key={i} style={{ marginBottom: "10px", color: text, fontSize: "14px", lineHeight: "1.6" }}>{q}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}

            {/* Concepts Tab */}
            {activeTab === "Concepts" && (
              <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: accent }}>Key Concepts</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {result.concepts.map((c, i) => {
                    const colors = ["#6c63ff", "#ff6584", "#f9a825", "#00bcd4", "#4caf50", "#ff9800", "#e91e63", "#9c27b0"];
                    const color = colors[i % colors.length];
                    return (
                      <span key={i} style={{ background: `${color}22`, color: color, border: `1px solid ${color}44`, padding: "8px 16px", borderRadius: "20px", fontSize: "14px", fontWeight: "500" }}>
                        {c}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}