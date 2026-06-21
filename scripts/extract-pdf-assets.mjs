import { mkdir, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const popplerBin =
  process.env.POPPLER_BIN ||
  "/Users/kanemac2/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin";
const pdftoppm = path.join(popplerBin, "pdftoppm");

const sources = [
  ["tutorial-1", "MATS2004 Mechanical Properties of Materials  Term 2 2025 TUTORIAL 1.pdf"],
  ["tutorial-2", "MATS2004 Mechanical Properties of Materials  Term 2 2025 TUTORIAL 2 (1).pdf"],
  ["tutorial-3", "MATS2004 Mechanical Properties of Materials  Term 2 2025 TUTORIAL 3 (1).pdf"],
  ["tutorial-4", "MATS2004 Mechanical Properties of Materials  Term 2 2025 TUTORIAL 4.pdf"]
];

await mkdir("public/questions", { recursive: true });

for (const [prefix, pdf] of sources) {
  if (!existsSync(pdf)) {
    throw new Error(`Missing source PDF: ${pdf}`);
  }

  const outputPrefix = path.join("public/questions", `${prefix}-q`);
  execFileSync(pdftoppm, ["-png", "-r", "160", pdf, outputPrefix], { stdio: "inherit" });

  for (let page = 1; page <= 99; page += 1) {
    const oldName = path.join("public/questions", `${prefix}-q-${String(page).padStart(2, "0")}.png`);
    const newName = path.join("public/questions", `${prefix}-q${String(page).padStart(2, "0")}.png`);
    if (existsSync(oldName)) {
      await rename(oldName, newName);
    }
  }
}
