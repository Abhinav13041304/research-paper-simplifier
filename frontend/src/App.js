import { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [depth, setDepth] = useState("student");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Could not connect to backend. Make sure Flask is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px", fontFamily: "sans-serif" }}>
      
      <h1 style={{ fontSize: "32px", fontWeight: "700", marginBottom: "8px" }}>
        PaperLens
      </h1>
      <p style={{ color: "#666", marginBottom: "32px" }}>
        Upload a research paper and get an instant AI-powered explanation
      </p>

      <div style={{ border: "2px dashed #ccc", borderRadius: "12px", padding: "32px", textAlign: "center", marginBottom: "20px" }}>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ marginBottom: "10px" }}
        />
        {file && <p style={{ color: "#666", fontSize: "14px" }}>Selected: {file.name}</p>}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <p style={{ fontWeight: "600", marginBottom: "10px" }}>How deep do you want to go?</p>
        <div style={{ display: "flex", gap: "10px" }}>
          {["quick", "student", "researcher"].map((d) => (
            <button
              key={d}
              onClick={() => setDepth(d)}
              style={{
                padding: "8px 20px",
                borderRadius: "20px",
                border: depth === d ? "2px solid #6c63ff" : "2px solid #ccc",
                background: depth === d ? "#6c63ff" : "white",
                color: depth === d ? "white" : "#333",
                cursor: "pointer",
                fontWeight: "500",
                textTransform: "capitalize"
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleUpload}
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "10px",
          border: "none",
          background: loading ? "#ccc" : "#6c63ff",
          color: "white",
          fontSize: "16px",
          fontWeight: "600",
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: "32px"
        }}
      >
        {loading ? "Analysing paper..." : "Analyse Paper"}
      </button>

      {error && (
        <div style={{ background: "#fff0f0", border: "1px solid #ffcccc", borderRadius: "10px", padding: "16px", color: "#cc0000", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {result && (
        <div>
          <div style={{ background: "#f9f9ff", border: "1px solid #e0e0ff", borderRadius: "12px", padding: "24px", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px" }}>Summary</h2>
            <p style={{ lineHeight: "1.8", color: "#333", whiteSpace: "pre-wrap" }}>{result.summary}</p>
          </div>

          <div style={{ background: "#f9f9ff", border: "1px solid #e0e0ff", borderRadius: "12px", padding: "24px", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px" }}>Key Concepts</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {result.concepts.map((c, i) => (
                <span key={i} style={{ background: "#6c63ff", color: "white", padding: "6px 14px", borderRadius: "20px", fontSize: "14px" }}>
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div style={{ background: "#f9f9ff", border: "1px solid #e0e0ff", borderRadius: "12px", padding: "24px", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px" }}>Analogy</h2>
            <p style={{ lineHeight: "1.8", color: "#333", fontStyle: "italic" }}>{result.analogy}</p>
          </div>

          <div style={{ background: "#f9f9ff", border: "1px solid #e0e0ff", borderRadius: "12px", padding: "24px", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px" }}>Prerequisites</h2>
            <ul style={{ paddingLeft: "20px" }}>
              {result.prerequisites.map((p, i) => (
                <li key={i} style={{ marginBottom: "6px", color: "#333" }}>{p}</li>
              ))}
            </ul>
          </div>

          <p style={{ color: "#999", fontSize: "13px", textAlign: "right" }}>
            Paper word count: {result.word_count.toLocaleString()} words
          </p>
        </div>
      )}
    </div>
  );
}

export default App;