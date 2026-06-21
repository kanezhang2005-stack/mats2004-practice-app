import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const python =
  process.env.PYTHON_BIN ||
  "/Users/kanemac2/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";

const sources = [
  {
    source: "tutorial_1",
    imagePrefix: "tutorial-1",
    pdf: "MATS2004 Mechanical Properties of Materials  Term 2 2025 TUTORIAL 1.pdf"
  },
  {
    source: "tutorial_2",
    imagePrefix: "tutorial-2",
    pdf: "MATS2004 Mechanical Properties of Materials  Term 2 2025 TUTORIAL 2 (1).pdf"
  },
  {
    source: "tutorial_3",
    imagePrefix: "tutorial-3",
    pdf: "MATS2004 Mechanical Properties of Materials  Term 2 2025 TUTORIAL 3 (1).pdf"
  },
  {
    source: "tutorial_4",
    imagePrefix: "tutorial-4",
    pdf: "MATS2004 Mechanical Properties of Materials  Term 2 2025 TUTORIAL 4.pdf"
  }
];

const extractor = `
import json, pdfplumber, re, sys
pdf_path = sys.argv[1]
rows = []
with pdfplumber.open(pdf_path) as pdf:
    for index, page in enumerate(pdf.pages, start=1):
        text = page.extract_text(x_tolerance=1, y_tolerance=3) or ""
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        useful = [line for line in lines if not line.lower().startswith("copyright")]
        if useful and useful[0].startswith("QC"):
            useful = useful[1:]
        cleaned = "\\n".join(useful)
        cleaned = re.sub(r"oupeyrsigthiot n20\\s+\\S+\\s+.*?Professor", "", cleaned)
        cleaned = re.sub(r"oupeyrsigthiot n20\\s+\\S+\\s+.*?Kaynak", "", cleaned)
        rows.append({"page": index, "text": cleaned.strip()})
print(json.dumps(rows))
`;

const verified = new Map([
  ["tutorial_2:1", { answer: ["A", "C", "E"], explanation: "The axial deformation expression follows from normal stress, normal strain, and Hooke's law.", status: "verified" }],
  ["tutorial_3:2", { answer: "C", explanation: "The polar moment of inertia is the cross section's geometric resistance to twisting under applied torque.", status: "verified" }],
  ["tutorial_3:3", { answer: "A", explanation: "For a circular shaft in torsion, the angle of twist is phi = TL/JG.", status: "verified" }]
]);

function inferType(prompt) {
  const optionMatches = prompt.match(/^\s*([A-H])\.\s+/gm) || [];
  if (optionMatches.length > 0 && /select all|which of the listed choices/i.test(prompt)) return "multi_choice";
  if (optionMatches.length > 0) return "single_choice";
  if (/what|determine|calculate|submit|maximum value|in units|how much|by how much/i.test(prompt)) return "numeric";
  return "text";
}

function extractOptions(prompt) {
  const options = [];
  const optionRegex = /^\s*([A-H])\.\s+(.+)$/gm;
  let match;
  while ((match = optionRegex.exec(prompt)) !== null) {
    options.push(match[2].trim());
  }
  return options;
}

const records = [];

for (const source of sources) {
  const output = execFileSync(python, ["-c", extractor, source.pdf], { encoding: "utf8" });
  const pages = JSON.parse(output);

  for (const page of pages) {
    const questionNumber = page.page;
    const prompt = page.text.trim();
    const type = inferType(prompt);
    const key = `${source.source}:${questionNumber}`;
    const confirmed = verified.get(key);

    records.push({
      source: source.source,
      questionNumber,
      prompt,
      imageUrl: `/questions/${source.imagePrefix}-q${String(questionNumber).padStart(2, "0")}.png`,
      type,
      options: extractOptions(prompt),
      answer: confirmed?.answer ?? (type === "multi_choice" ? [] : null),
      tolerance: type === "numeric" ? 0.01 : null,
      unit: null,
      explanation: confirmed?.explanation ?? "Answer requires verification from the question image.",
      status: confirmed?.status ?? "needs_review"
    });
  }
}

await fs.mkdir("data", { recursive: true });
await fs.writeFile(path.join("data", "questions.seed.json"), `${JSON.stringify(records, null, 2)}\n`);
console.log(`Wrote ${records.length} questions`);
