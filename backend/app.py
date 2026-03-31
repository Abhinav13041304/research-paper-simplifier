from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = Flask(__name__)
CORS(app)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text


def call_groq(prompt):
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content


def summarise_text(text, depth="student"):
    depth_prompts = {
        "quick": "Explain this document in simple terms in 3-4 sentences for someone with no technical background.",
        "student": "Explain this document clearly for a student. Cover what topic it addresses, the key ideas, and what the main takeaways are.",
        "researcher": "Provide a detailed technical summary of this document covering methodology, key contributions, results, and limitations if applicable."
    }
    prompt = depth_prompts.get(depth, depth_prompts["student"])
    return call_groq(f"{prompt}\n\nDocument content:\n{text[:4000]}")


def extract_concepts(text):
    result = call_groq(
        f"Extract the 6-8 most important concepts or topics from this study material. "
        f"Return them as a simple comma-separated list, nothing else.\n\nDocument:\n{text[:3000]}"
    )
    return [c.strip() for c in result.split(",")]


def generate_analogy(text):
    return call_groq(
        f"For the main concept in this document, generate one clear real-world analogy "
        f"that makes it easy to understand for a student. Keep it to 2-3 sentences.\n\nDocument:\n{text[:2000]}"
    )


def detect_prerequisites(text):
    result = call_groq(
        f"What concepts should someone already know before studying this material? "
        f"List 4-5 prerequisites as a comma-separated list, nothing else.\n\nDocument:\n{text[:2000]}"
    )
    return [p.strip() for p in result.split(",")]


def generate_flowchart(text):
    result = call_groq(
        f"""Analyse this document and extract the main process, algorithm, or methodology described.
Generate a Mermaid.js flowchart diagram that visualises this process step by step.

Rules:
- Use flowchart TD format (top-down)
- Maximum 10 nodes
- Keep node labels short (under 5 words each)
- Use simple shapes: rectangles for steps, diamonds for decisions
- Return ONLY the raw Mermaid code, no explanation, no markdown code blocks, no backticks

Example format:
flowchart TD
    A[Start] --> B[Step 1]
    B --> C{{Decision}}
    C -->|Yes| D[Step 2]
    C -->|No| E[Step 3]
    D --> F[End]
    E --> F

Document:\n{text[:3000]}"""
    )
    cleaned = result.strip()
    if "```" in cleaned:
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("mermaid"):
            cleaned = cleaned[7:]
    return cleaned.strip()


def generate_concept_diagram(text):
    result = call_groq(
        f"""Analyse this document and identify the key concepts and how they relate to each other.
Generate a Mermaid.js mind map or graph diagram showing these relationships.

Rules:
- Use graph LR format (left to right)
- Maximum 12 nodes
- Keep labels short (under 4 words)
- Show meaningful relationships between concepts
- Return ONLY the raw Mermaid code, no explanation, no markdown code blocks, no backticks

Example format:
graph LR
    A[Main Topic] --> B[Concept 1]
    A --> C[Concept 2]
    B --> D[Sub concept]
    C --> D

Document:\n{text[:3000]}"""
    )
    cleaned = result.strip()
    if "```" in cleaned:
        cleaned = cleaned.split("```")[1]
        if cleaned.startswith("mermaid"):
            cleaned = cleaned[7:]
    return cleaned.strip()


def generate_qa(text):
    result = call_groq(
        f"""Generate exam questions from this study material at three difficulty levels.

Return ONLY a valid JSON object in exactly this format, no extra text:
{{
  "one_mark": [
    "Question 1?",
    "Question 2?",
    "Question 3?"
  ],
  "five_mark": [
    "Question 1?",
    "Question 2?"
  ],
  "ten_mark": [
    "Question 1?",
    "Question 2?"
  ]
}}

one_mark: Simple definition or fact-based questions (3 questions)
five_mark: Explanation or comparison questions (2 questions)
ten_mark: Analysis or detailed discussion questions (2 questions)

Document:\n{text[:3000]}"""
    )
    try:
        import json
        cleaned = result.strip()
        if "```" in cleaned:
            cleaned = cleaned.split("```")[1]
            if cleaned.startswith("json"):
                cleaned = cleaned[4:]
        return json.loads(cleaned.strip())
    except Exception:
        return {
            "one_mark": ["Could not generate questions. Please try again."],
            "five_mark": ["Could not generate questions. Please try again."],
            "ten_mark": ["Could not generate questions. Please try again."]
        }


def get_difficulty_score(text):
    words = text.split()
    avg_word_length = sum(len(w) for w in words[:500]) / min(500, len(words))
    if avg_word_length > 7:
        score = 8
    elif avg_word_length > 5.5:
        score = 6
    else:
        score = 4
    return score


@app.route("/")
def home():
    return jsonify({"message": "PaperLens API is running"})


@app.route("/upload", methods=["POST"])
def upload_pdf():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported"}), 400

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    text = extract_text_from_pdf(filepath)

    if not text.strip():
        return jsonify({"error": "Could not extract text from PDF"}), 400

    depth = request.form.get("depth", "student")

    summary = summarise_text(text, depth)
    concepts = extract_concepts(text)
    analogy = generate_analogy(text)
    prerequisites = detect_prerequisites(text)
    flowchart = generate_flowchart(text)
    concept_diagram = generate_concept_diagram(text)
    qa = generate_qa(text)
    difficulty = get_difficulty_score(text)

    return jsonify({
        "summary": summary,
        "concepts": concepts,
        "analogy": analogy,
        "prerequisites": prerequisites,
        "flowchart": flowchart,
        "concept_diagram": concept_diagram,
        "qa": qa,
        "difficulty_score": difficulty,
        "word_count": len(text.split()),
        "depth": depth
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)