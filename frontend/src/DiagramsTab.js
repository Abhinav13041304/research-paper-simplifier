import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function ConceptHierarchy({ data, darkMode }) {
  const surface2 = darkMode ? "#1a1a3a" : "#f0f0ff";
  const border = darkMode ? "#2a2a5a" : "#d0d0ff";
  const text = darkMode ? "#e0e0ff" : "#1a1a3a";

  if (!data || !data.subtopics) return null;

  return (
    <div style={{ overflowX: "auto", padding: "10px 0" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "600px" }}>
        <div style={{
          background: "linear-gradient(135deg, #6c63ff, #00bcd4)",
          borderRadius: "16px", padding: "16px 32px",
          color: "white", fontWeight: "800", fontSize: "18px",
          boxShadow: "0 4px 24px #6c63ff44", textAlign: "center"
        }}>
          {data.main_topic}
        </div>
        <div style={{ width: "2px", height: "30px", background: "#6c63ff44" }} />
        <div style={{ position: "relative", display: "flex", gap: "16px", justifyContent: "center" }}>
          <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "2px", background: "#6c63ff33" }} />
          {data.subtopics.map((sub, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "2px", height: "20px", background: `${sub.color}66` }} />
              <motion.div
                whileHover={{ scale: 1.05 }}
                style={{
                  background: `${sub.color}22`, border: `2px solid ${sub.color}`,
                  borderRadius: "12px", padding: "12px 16px",
                  color: sub.color, fontWeight: "700", fontSize: "13px",
                  textAlign: "center", minWidth: "120px"
                }}
              >
                {sub.name}
              </motion.div>
              <div style={{ width: "2px", height: "20px", background: `${sub.color}44` }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                {sub.children?.map((child, j) => (
                  <motion.div
                    key={j}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 + j * 0.05 }}
                    style={{
                      background: surface2, border: `1px solid ${sub.color}44`,
                      borderRadius: "8px", padding: "6px 12px",
                      color: text, fontSize: "11px", textAlign: "center", maxWidth: "130px"
                    }}
                  >
                    {child}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProcessFlow({ data, darkMode }) {
  const text = darkMode ? "#e0e0ff" : "#1a1a3a";

  if (!data || !data.process_steps) return null;

  return (
    <div style={{ overflowX: "auto", padding: "10px 0" }}>
      <div style={{ display: "flex", alignItems: "flex-start", minWidth: "700px", justifyContent: "center" }}>
        {data.process_steps.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}
            >
              <div style={{
                width: "48px", height: "48px", borderRadius: "50%",
                background: `linear-gradient(135deg, ${step.color}, ${step.color}88)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: "800", fontSize: "18px",
                boxShadow: `0 4px 16px ${step.color}44`
              }}>
                {step.step}
              </div>
              <div style={{
                background: `${step.color}11`, border: `2px solid ${step.color}44`,
                borderRadius: "12px", padding: "12px", maxWidth: "120px", textAlign: "center"
              }}>
                <div style={{ color: step.color, fontWeight: "700", fontSize: "12px", marginBottom: "4px" }}>
                  {step.title}
                </div>
                <div style={{ color: text, fontSize: "10px", lineHeight: "1.4" }}>
                  {step.description}
                </div>
              </div>
            </motion.div>
            {i < data.process_steps.length - 1 && (
              <div style={{ display: "flex", alignItems: "center", padding: "0 8px", marginBottom: "40px" }}>
                <div style={{ width: "30px", height: "2px", background: "#6c63ff44" }} />
                <div style={{ color: "#6c63ff", fontSize: "16px" }}>{">"}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function KeyTermsCard({ prompt, index, darkMode }) {
  const surface2 = darkMode ? "#1a1a3a" : "#f0f0ff";
  const text = darkMode ? "#e0e0ff" : "#1a1a3a";
  const textMuted = darkMode ? "#8888aa" : "#6666aa";
  const colors = ["#6c63ff", "#ff6584", "#f9a825", "#00bcd4", "#4caf50", "#ff9800"];
  const mainColor = colors[index % colors.length];
  const words = prompt.split(" ").filter(w => w.length > 4).slice(0, 12);

  return (
    <div style={{
      background: `${mainColor}0d`, border: `1px solid ${mainColor}33`,
      borderRadius: "12px", padding: "28px", position: "relative", overflow: "hidden"
    }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: `${50 + i * 35}px`, height: `${50 + i * 35}px`,
          borderRadius: "50%", border: `1px solid ${mainColor}${12 + i * 6}`,
          top: `${-15 + i * 8}%`, right: `${-8 + i * 4}%`,
          pointerEvents: "none"
        }} />
      ))}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: "11px", fontWeight: "700", color: mainColor, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>
          Key Terms
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              style={{
                background: `${colors[(index + i) % colors.length]}22`,
                color: colors[(index + i) % colors.length],
                border: `1px solid ${colors[(index + i) % colors.length]}44`,
                padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "500"
              }}
            >
              {word}
            </motion.span>
          ))}
        </div>
        <div style={{
          padding: "10px 14px", background: `${mainColor}0d`,
          borderRadius: "8px", borderLeft: `3px solid ${mainColor}`
        }}>
          <p style={{ fontSize: "12px", color: textMuted, margin: 0, lineHeight: "1.6", fontStyle: "italic" }}>
            {prompt}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DiagramsTab({ result, darkMode }) {
  const [showMore, setShowMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [extraPrompts, setExtraPrompts] = useState([]);

  const surface = darkMode ? "#12122a" : "#ffffff";
  const border = darkMode ? "#2a2a5a" : "#d0d0ff";
  const text = darkMode ? "#e0e0ff" : "#1a1a3a";
  const textMuted = darkMode ? "#8888aa" : "#6666aa";
  const accent = "#6c63ff";

  const handleGetMore = async () => {
    setLoadingMore(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/more-diagrams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: result.summary })
      });
      const data = await res.json();
      setExtraPrompts(data.prompts || []);
      setShowMore(true);
    } catch {
      setExtraPrompts(["educational diagram", "technical illustration"]);
      setShowMore(true);
    } finally {
      setLoadingMore(false);
    }
  };

  if (!result?.diagram_data) return (
    <div style={{ textAlign: "center", padding: "40px", color: textMuted }}>
      No diagram data available. Please re-upload your document.
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: surface, border: `1px solid ${border}`, borderRadius: "14px", padding: "22px" }}>
        <h3 style={{ margin: "0 0 6px", fontSize: "14px", color: accent, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Concept Hierarchy
        </h3>
        <p style={{ fontSize: "12px", color: textMuted, margin: "0 0 16px" }}>
          Main topic broken down into subtopics and concepts
        </p>
        <ConceptHierarchy data={result.diagram_data} darkMode={darkMode} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ background: surface, border: `1px solid ${border}`, borderRadius: "14px", padding: "22px" }}>
        <h3 style={{ margin: "0 0 6px", fontSize: "14px", color: "#00bcd4", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Process Flow
        </h3>
        <p style={{ fontSize: "12px", color: textMuted, margin: "0 0 16px" }}>
          Step by step process extracted from the document
        </p>
        <ProcessFlow data={result.diagram_data} darkMode={darkMode} />
      </motion.div>

      {result.diagram_data.image_prompts?.map((prompt, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
          style={{ background: surface, border: `1px solid ${border}`, borderRadius: "14px", padding: "22px" }}>
          <h3 style={{ margin: "0 0 6px", fontSize: "14px", color: "#f9a825", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Visual Illustration {i + 1}
          </h3>
          <p style={{ fontSize: "12px", color: textMuted, margin: "0 0 16px" }}>
            {prompt.slice(0, 80)}...
          </p>
          <KeyTermsCard prompt={prompt} index={i} darkMode={darkMode} />
        </motion.div>
      ))}

      <AnimatePresence>
        {showMore && extraPrompts.map((prompt, i) => (
          <motion.div key={`extra-${i}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: surface, border: `1px solid ${border}`, borderRadius: "14px", padding: "22px" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: "14px", color: "#4caf50", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Extra Illustration {i + 1}
            </h3>
            <KeyTermsCard prompt={prompt} index={i + 2} darkMode={darkMode} />
          </motion.div>
        ))}
      </AnimatePresence>

      {!showMore && (
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={handleGetMore} disabled={loadingMore}
          style={{
            padding: "14px", borderRadius: "12px", border: `2px solid ${accent}`,
            background: `${accent}11`, color: accent, fontSize: "14px",
            fontWeight: "600", cursor: loadingMore ? "not-allowed" : "pointer", width: "100%"
          }}>
          {loadingMore ? "Generating more..." : "+ Get more diagrams"}
        </motion.button>
      )}

    </div>
  );
}