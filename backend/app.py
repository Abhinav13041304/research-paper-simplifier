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
    if depth == "quick":
        return call_groq(
            f"Explain this document in simple terms in 3-4 sentences for someone with no technical background.\n\nDocument:\n{text[:2000]}"
        )

    elif depth == "student":
        return call_groq(
            f"""You are an expert teacher. Analyse this entire document thoroughly and provide a comprehensive section-by-section explanation for a university student.

IMPORTANT: Each section must have substantial content — at least 4-6 sentences of explanation plus detailed bullet points. Do not rush or summarise too briefly. The student is using this to study, not just get a quick overview.

Format each section exactly like this:

**Section Title**
Write 4-6 sentences explaining this section in depth. Cover what it means, why it matters, how it works, and connect it to other concepts in the document. Use clear, student-friendly language but do not oversimplify.

* Detailed point 1 with explanation
* Detailed point 2 with explanation  
* Detailed point 3 with explanation
* Detailed point 4 with explanation

Identify and cover ALL major sections and subtopics present in the document including:
- Introduction and background
- Every major concept or topic discussed
- Methods or approaches explained
- Results, findings, or conclusions
- Real world applications if mentioned

Do not skip any major topic. If the document has 10 topics, cover all 10 in detail.

Document:\n{text[:7000]}"""
        )

    elif depth == "researcher":
        return call_groq(
            f"""You are an expert academic researcher. Analyse this document in full technical depth and provide an exhaustive section-by-section breakdown.

IMPORTANT: Each section must be thoroughly detailed — at least 6-8 sentences of technical analysis plus comprehensive bullet points. Cover every nuance, assumption, limitation, and implication. This is for a researcher who needs complete understanding.

Format each section exactly like this:

**Section Title**
Write 6-8 sentences of deep technical analysis. Cover the theoretical foundations, methodological choices, mathematical or algorithmic details, comparisons with related work, and critical evaluation. Be precise and use domain-specific terminology.

* Technical detail 1 with full explanation
* Technical detail 2 with full explanation
* Technical detail 3 with full explanation
* Technical detail 4 with full explanation
* Technical detail 5 with full explanation

Identify and cover ALL sections and subtopics in the document including:
- Abstract and research objectives
- Literature review and background theory
- Every methodology, algorithm, or approach in detail
- Experimental setup and datasets if applicable
- Results with quantitative analysis
- Limitations and assumptions
- Conclusions and future research directions
- Critical evaluation of the work

Do not skip any section. Provide maximum depth for every topic covered.

Document:\n{text[:8000]}"""
        )


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
        f"""Generate exam questions with answers from this study material.

Return ONLY a valid JSON object in exactly this format, no extra text:
{{
  "two_mark": [
    {{"question": "Question 1?", "answer": "Answer 1."}},
    {{"question": "Question 2?", "answer": "Answer 2."}},
    {{"question": "Question 3?", "answer": "Answer 3."}}
  ],
  "four_mark": [
    {{"question": "Question 1?", "answer": "Answer 1."}},
    {{"question": "Question 2?", "answer": "Answer 2."}}
  ],
  "six_mark": [
    {{"question": "Question 1?", "answer": "Answer 1."}},
    {{"question": "Question 2?", "answer": "Answer 2."}}
  ]
}}

two_mark: Simple definition or fact-based questions with short answers (3 questions) 2 marks worthy
four_mark: Explain concepts, processes, or comparisons, Explanation questions with medium length answers (2 questions) 4 marks worthy
six_mark: Deep analysis, architecture, or critical discussion, Analysis or detailed discussion questions with detailed and long answers (2 questions) 6 marks worthy

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
            "two_mark": [{"question": "Could not generate questions.", "answer": "Please try again."}],
            "five_mark": [{"question": "Could not generate questions.", "answer": "Please try again."}],
            "eight_mark": [{"question": "Could not generate questions.", "answer": "Please try again."}]
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
    diagram_data = generate_diagram_data(text)

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
        "depth": depth,
        "diagram_data": diagram_data,
    })

@app.route("/explain-concept", methods=["POST"])
def explain_concept():
    data = request.get_json()
    concept = data.get("concept", "")
    context = data.get("context", "")
    
    if not concept:
        return jsonify({"error": "No concept provided"}), 400
    
    explanation = call_groq(
        f"""Explain the concept "{concept}" clearly and concisely for a student.
        
Context from the document they are reading: {context[:500]}

Keep the explanation to 3-4 sentences maximum. Be specific and use simple language.
Do not use markdown formatting."""
    )
    
    return jsonify({"explanation": explanation})

def generate_diagram_data(text):
    result = call_groq(
        f"""Analyse this document and extract structured data for diagrams.

Return ONLY a valid JSON object in exactly this format, no extra text:
{{
  "main_topic": "Main topic name",
  "subtopics": [
    {{
      "name": "Subtopic 1",
      "color": "#6c63ff",
      "children": ["Sub-concept 1", "Sub-concept 2", "Sub-concept 3"]
    }},
    {{
      "name": "Subtopic 2", 
      "color": "#ff6584",
      "children": ["Sub-concept 1", "Sub-concept 2"]
    }},
    {{
      "name": "Subtopic 3",
      "color": "#00bcd4",
      "children": ["Sub-concept 1", "Sub-concept 2"]
    }},
    {{
      "name": "Subtopic 4",
      "color": "#f9a825",
      "children": ["Sub-concept 1", "Sub-concept 2"]
    }}
  ],
  "process_steps": [
    {{"step": 1, "title": "Step 1", "description": "What happens", "color": "#6c63ff"}},
    {{"step": 2, "title": "Step 2", "description": "What happens", "color": "#ff6584"}},
    {{"step": 3, "title": "Step 3", "description": "What happens", "color": "#00bcd4"}},
    {{"step": 4, "title": "Step 4", "description": "What happens", "color": "#f9a825"}},
    {{"step": 5, "title": "Step 5", "description": "What happens", "color": "#4caf50"}}
  ],
  "image_prompts": [
    "detailed technical illustration of [main topic], educational diagram style, colorful, clear labels",
    "visual representation of [key concept from document], infographic style, professional, colorful"
  ]
}}

Base everything on the actual content of this document.

Document:\n{text[:4000]}"""
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
            "main_topic": "Document",
            "subtopics": [],
            "process_steps": [],
            "image_prompts": ["educational diagram", "technical illustration"]
        }


def generate_extra_image_prompts(text):
    result = call_groq(
        f"""Generate 2 more image generation prompts for visual diagrams about this document's content.

Return ONLY a JSON array, no extra text:
[
  "detailed prompt 1 for an educational illustration",
  "detailed prompt 2 for a different aspect of the topic"
]

Document:\n{text[:2000]}"""
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
        return ["educational diagram", "technical illustration"]

@app.route("/more-diagrams", methods=["POST"])
def more_diagrams():
    data = request.get_json()
    text = data.get("text", "")
    prompts = generate_extra_image_prompts(text)
    return jsonify({"prompts": prompts})

if __name__ == "__main__":
    app.run(debug=True, port=5000)