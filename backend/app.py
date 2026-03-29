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
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content


def summarise_text(text, depth="student"):
    depth_prompts = {
        "quick": "Explain this research paper in simple terms in 3-4 sentences for someone with no technical background.",
        "student": "Explain this research paper clearly for a computer science undergraduate student. Cover what problem it solves, how it solves it, and what the results mean.",
        "researcher": "Provide a detailed technical summary of this research paper covering methodology, key contributions, results, and limitations."
    }
    prompt = depth_prompts.get(depth, depth_prompts["student"])
    return call_groq(f"{prompt}\n\nPaper content:\n{text[:4000]}")


def extract_concepts(text):
    result = call_groq(
        f"Extract the 6-8 most important technical concepts from this research paper. "
        f"Return them as a simple comma-separated list, nothing else.\n\nPaper:\n{text[:3000]}"
    )
    return [c.strip() for c in result.split(",")]


def generate_analogy(text):
    return call_groq(
        f"For the main concept in this research paper, generate one clear real-world analogy "
        f"that makes it easy to understand for a student. Keep it to 2-3 sentences.\n\nPaper:\n{text[:2000]}"
    )


def detect_prerequisites(text):
    result = call_groq(
        f"What concepts should someone already know before reading this paper? "
        f"List 4-5 prerequisites as a comma-separated list, nothing else.\n\nPaper:\n{text[:2000]}"
    )
    return [p.strip() for p in result.split(",")]


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

    return jsonify({
        "summary": summary,
        "concepts": concepts,
        "analogy": analogy,
        "prerequisites": prerequisites,
        "word_count": len(text.split()),
        "depth": depth
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)