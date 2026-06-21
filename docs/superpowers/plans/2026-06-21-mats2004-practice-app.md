# MATS2004 Practice App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and prepare a public Next.js practice app for MATS2004 tutorial questions with per-question PDF images, hidden answers, answer checking, password-protected admin editing, and anonymous aggregate statistics.

**Architecture:** Use one Next.js App Router project containing public practice pages, admin pages, server actions/API routes, shared answer-checking utilities, and database access helpers. Store questions and anonymous attempts in a SQL database through Prisma; store generated question images under `public/questions/` so Vercel can serve them statically.

**Tech Stack:** Next.js, TypeScript, React, Prisma, PostgreSQL-compatible database for Vercel deployment, Vitest, Testing Library, Playwright, Poppler command-line tools for PDF page rendering.

---

## File Structure

- `package.json`: project scripts and dependencies.
- `next.config.mjs`: Next.js configuration.
- `tsconfig.json`: TypeScript configuration.
- `vitest.config.ts`: Vitest unit and component test configuration.
- `playwright.config.ts`: browser test configuration.
- `prisma/schema.prisma`: database schema for questions and anonymous attempts.
- `prisma/seed.ts`: seed script that loads generated question records.
- `src/lib/answers.ts`: pure answer-normalization and answer-checking logic.
- `src/lib/questions.ts`: question query helpers and public-safe mapping.
- `src/lib/admin-auth.ts`: admin password verification and signed cookie helpers.
- `src/lib/stats.ts`: anonymous attempt recording and aggregate statistics.
- `src/lib/db.ts`: Prisma client singleton.
- `src/app/page.tsx`: public randomized practice UI.
- `src/app/admin/page.tsx`: admin login and dashboard page.
- `src/app/api/questions/route.ts`: public question list API.
- `src/app/api/attempts/route.ts`: public anonymous attempt API.
- `src/app/api/admin/login/route.ts`: admin login API.
- `src/app/api/admin/questions/route.ts`: admin question create/list API.
- `src/app/api/admin/questions/[id]/route.ts`: admin question update/delete API.
- `src/app/api/admin/stats/route.ts`: admin aggregate stats API.
- `src/components/PracticeQuestion.tsx`: public question display and answer form.
- `src/components/AdminQuestionEditor.tsx`: admin question editor.
- `src/components/AdminStats.tsx`: admin stats table.
- `src/styles/globals.css`: minimal shared styling.
- `scripts/extract-pdf-assets.mjs`: render PDF pages to `public/questions/`.
- `scripts/build-seed-data.mjs`: extract prompt text and create seed JSON.
- `data/questions.seed.json`: seed data from the four PDFs.
- `public/questions/*.png`: generated question images.
- `tests/unit/answers.test.ts`: answer-checking tests.
- `tests/unit/stats.test.ts`: aggregate stats tests.
- `tests/api/admin-auth.test.ts`: admin authorization behavior tests.
- `tests/components/practice-question.test.tsx`: public UI behavior tests.
- `tests/e2e/practice.spec.ts`: browser-level practice flow test.

## Task 1: Initialize the Next.js Project and Tooling

**Files:**
- Create: `package.json`
- Create: `next.config.mjs`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/styles/globals.css`
- Create: `src/app/layout.tsx`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Initialize git if needed**

Run:

```bash
test -d .git || git init
```

Expected: the directory has a `.git` folder after the command.

- [ ] **Step 2: Create the package manifest**

Write `package.json`:

```json
{
  "name": "mats2004-practice-app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "extract:pdf": "node scripts/extract-pdf-assets.mjs",
    "build:seed": "node scripts/build-seed-data.mjs"
  },
  "dependencies": {
    "@prisma/client": "^6.0.0",
    "bcryptjs": "^2.4.3",
    "cookie": "^1.0.2",
    "jose": "^5.9.6",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.2",
    "eslint": "^9.17.0",
    "eslint-config-next": "^15.0.0",
    "jsdom": "^25.0.1",
    "prisma": "^6.0.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

- [ ] **Step 3: Install dependencies**

Run:

```bash
npm install
```

Expected: `node_modules/` and `package-lock.json` are created. If network sandboxing blocks installation, rerun with escalated network approval.

- [ ] **Step 4: Create base configuration files**

Write `next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true
  }
};

export default nextConfig;
```

Write `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Write `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"]
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname
    }
  }
});
```

Write `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry"
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } }
  ]
});
```

Write `tests/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Create minimal app shell**

Write `src/app/layout.tsx`:

```tsx
import "../styles/globals.css";

export const metadata = {
  title: "MATS2004 Practice",
  description: "Randomized MATS2004 tutorial practice questions"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Write `src/styles/globals.css`:

```css
:root {
  color-scheme: light;
  --bg: #f7f7f5;
  --panel: #ffffff;
  --text: #171717;
  --muted: #616161;
  --line: #d7d7d2;
  --accent: #0f766e;
  --danger: #b42318;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Arial, Helvetica, sans-serif;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}
```

Write `.env.example`:

```text
DATABASE_URL="postgresql://user:password@host:5432/mats2004"
ADMIN_PASSWORD="change-this-password"
ADMIN_SESSION_SECRET="replace-with-at-least-32-random-characters"
```

Write `.gitignore`:

```text
.next/
node_modules/
.env
.env.local
coverage/
test-results/
playwright-report/
```

- [ ] **Step 6: Verify the base project builds far enough to typecheck**

Run:

```bash
npm run test
```

Expected: Vitest starts and reports no tests or passes `tests/setup.ts` without TypeScript errors.

- [ ] **Step 7: Commit**

Run:

```bash
git add package.json package-lock.json next.config.mjs tsconfig.json vitest.config.ts playwright.config.ts tests/setup.ts src/app/layout.tsx src/styles/globals.css .env.example .gitignore
git commit -m "chore: initialize practice app"
```

Expected: commit succeeds.

## Task 2: Implement Answer Checking with TDD

**Files:**
- Create: `tests/unit/answers.test.ts`
- Create: `src/lib/answers.ts`

- [ ] **Step 1: Write failing answer-checking tests**

Write `tests/unit/answers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { checkAnswer } from "@/lib/answers";

describe("checkAnswer", () => {
  it("checks single choice answers after trimming and uppercasing", () => {
    expect(checkAnswer({ type: "single_choice", answer: "C" }, " c ")).toEqual({
      correct: true,
      normalizedSubmission: "C"
    });
  });

  it("checks multi choice answers without depending on order", () => {
    expect(checkAnswer({ type: "multi_choice", answer: ["A", "C", "D"] }, ["d", "a", "c"])).toEqual({
      correct: true,
      normalizedSubmission: ["A", "C", "D"]
    });
  });

  it("rejects multi choice answers with missing choices", () => {
    expect(checkAnswer({ type: "multi_choice", answer: ["A", "C"] }, ["A"])).toEqual({
      correct: false,
      normalizedSubmission: ["A"]
    });
  });

  it("checks numeric answers within tolerance", () => {
    expect(checkAnswer({ type: "numeric", answer: 12.5, tolerance: 0.05 }, "12.53")).toEqual({
      correct: true,
      normalizedSubmission: 12.53
    });
  });

  it("rejects numeric answers outside tolerance", () => {
    expect(checkAnswer({ type: "numeric", answer: 12.5, tolerance: 0.05 }, "12.57")).toEqual({
      correct: false,
      normalizedSubmission: 12.57
    });
  });

  it("checks text answers by trimming and ignoring case", () => {
    expect(checkAnswer({ type: "text", answer: "A-B and C-D" }, " a-b AND c-d ")).toEqual({
      correct: true,
      normalizedSubmission: "a-b and c-d"
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test -- tests/unit/answers.test.ts
```

Expected: FAIL because `@/lib/answers` does not exist.

- [ ] **Step 3: Implement minimal answer checking**

Write `src/lib/answers.ts`:

```ts
export type QuestionType = "single_choice" | "multi_choice" | "numeric" | "text";

type AnswerKey =
  | { type: "single_choice"; answer: string }
  | { type: "multi_choice"; answer: string[] }
  | { type: "numeric"; answer: number; tolerance?: number }
  | { type: "text"; answer: string };

type Submission = string | string[] | number;

export type CheckResult =
  | { correct: boolean; normalizedSubmission: string }
  | { correct: boolean; normalizedSubmission: string[] }
  | { correct: boolean; normalizedSubmission: number };

function normalizeChoice(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function asString(value: Submission): string {
  return Array.isArray(value) ? value.join(",") : String(value);
}

export function checkAnswer(key: AnswerKey, submission: Submission): CheckResult {
  if (key.type === "single_choice") {
    const normalizedSubmission = normalizeChoice(asString(submission));
    return {
      correct: normalizedSubmission === normalizeChoice(key.answer),
      normalizedSubmission
    };
  }

  if (key.type === "multi_choice") {
    const values = Array.isArray(submission) ? submission : asString(submission).split(",");
    const normalizedSubmission = values.map(normalizeChoice).filter(Boolean).sort();
    const normalizedAnswer = key.answer.map(normalizeChoice).filter(Boolean).sort();
    return {
      correct: JSON.stringify(normalizedSubmission) === JSON.stringify(normalizedAnswer),
      normalizedSubmission
    };
  }

  if (key.type === "numeric") {
    const normalizedSubmission = typeof submission === "number" ? submission : Number(asString(submission));
    const tolerance = key.tolerance ?? 0;
    return {
      correct: Number.isFinite(normalizedSubmission) && Math.abs(normalizedSubmission - key.answer) <= tolerance,
      normalizedSubmission
    };
  }

  const normalizedSubmission = normalizeText(asString(submission));
  return {
    correct: normalizedSubmission === normalizeText(key.answer),
    normalizedSubmission
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm run test -- tests/unit/answers.test.ts
```

Expected: all six tests pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add tests/unit/answers.test.ts src/lib/answers.ts
git commit -m "feat: add answer checking"
```

Expected: commit succeeds.

## Task 3: Add Prisma Data Model and Seed Pipeline

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`
- Create: `data/questions.seed.json`
- Create: `prisma/seed.ts`

- [ ] **Step 1: Write the Prisma schema**

Write `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum QuestionType {
  single_choice
  multi_choice
  numeric
  text
}

enum QuestionStatus {
  verified
  needs_review
}

model Question {
  id             String         @id @default(cuid())
  source         String
  questionNumber Int
  prompt         String
  imageUrl       String
  type           QuestionType
  options        Json
  answer         Json
  tolerance      Float?
  unit           String?
  explanation    String?
  status         QuestionStatus @default(needs_review)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  attempts       Attempt[]

  @@unique([source, questionNumber])
  @@index([source])
  @@index([status])
}

model Attempt {
  id         String   @id @default(cuid())
  questionId String
  isCorrect  Boolean
  createdAt  DateTime @default(now())
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@index([questionId])
  @@index([createdAt])
}
```

- [ ] **Step 2: Create the Prisma client singleton**

Write `src/lib/db.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 3: Create initial seed data shape**

Write `data/questions.seed.json` with four representative records first:

```json
[
  {
    "source": "tutorial_1",
    "questionNumber": 1,
    "prompt": "A cylinder is subject to applied torques as shown. In which segment(s) of this cylinder is the torque a maximum?",
    "imageUrl": "/questions/tutorial-1-q01.png",
    "type": "multi_choice",
    "options": ["A-B", "B-C", "C-D", "D-E", "E-F", "F-G"],
    "answer": [],
    "tolerance": null,
    "unit": null,
    "explanation": "Answer requires verification from the torque diagram.",
    "status": "needs_review"
  },
  {
    "source": "tutorial_2",
    "questionNumber": 1,
    "prompt": "Which listed choices are used to develop the expression shown for delta, the deflection of a uniform, axially loaded member?",
    "imageUrl": "/questions/tutorial-2-q01.png",
    "type": "multi_choice",
    "options": ["Hooke's Law", "Poisson's Ratio", "Definition of Normal Strain", "Coefficient of Thermal Expansion", "Definition of Normal Stress", "Definition of Shear Stress", "Principle of Superposition", "Strain Energy"],
    "answer": ["A", "C", "E"],
    "tolerance": null,
    "unit": null,
    "explanation": "The axial deformation expression follows from normal stress, normal strain, and Hooke's law.",
    "status": "verified"
  },
  {
    "source": "tutorial_3",
    "questionNumber": 2,
    "prompt": "What does Polar Moment of Inertia (denoted by J) physically represent in torsion?",
    "imageUrl": "/questions/tutorial-3-q02.png",
    "type": "single_choice",
    "options": ["The resistance of a material to axial loading", "The resistance of a shaft to bending deformation", "The resistance of a shaft's cross section to twisting under applied torque", "The energy stored in a shaft during elastic deformation"],
    "answer": "C",
    "tolerance": null,
    "unit": null,
    "explanation": "The polar moment of inertia measures the cross section's geometric resistance to twisting.",
    "status": "verified"
  },
  {
    "source": "tutorial_4",
    "questionNumber": 1,
    "prompt": "Determine the moment reaction in kN.m at the support for the cantilever beam shown.",
    "imageUrl": "/questions/tutorial-4-q01.png",
    "type": "numeric",
    "options": [],
    "answer": null,
    "tolerance": 0.01,
    "unit": "kN.m",
    "explanation": "Answer requires verification from the beam diagram.",
    "status": "needs_review"
  }
]
```

- [ ] **Step 4: Write the seed script**

Write `prisma/seed.ts`:

```ts
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/db";

type SeedQuestion = {
  source: string;
  questionNumber: number;
  prompt: string;
  imageUrl: string;
  type: "single_choice" | "multi_choice" | "numeric" | "text";
  options: unknown[];
  answer: unknown;
  tolerance: number | null;
  unit: string | null;
  explanation: string | null;
  status: "verified" | "needs_review";
};

async function main() {
  const seedPath = path.join(process.cwd(), "data", "questions.seed.json");
  const raw = await fs.readFile(seedPath, "utf8");
  const questions = JSON.parse(raw) as SeedQuestion[];

  for (const question of questions) {
    await prisma.question.upsert({
      where: {
        source_questionNumber: {
          source: question.source,
          questionNumber: question.questionNumber
        }
      },
      update: {
        prompt: question.prompt,
        imageUrl: question.imageUrl,
        type: question.type,
        options: question.options,
        answer: question.answer,
        tolerance: question.tolerance,
        unit: question.unit,
        explanation: question.explanation,
        status: question.status
      },
      create: question
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
```

- [ ] **Step 5: Generate Prisma client**

Run:

```bash
npm run db:generate
```

Expected: Prisma client generation succeeds.

- [ ] **Step 6: Commit**

Run:

```bash
git add prisma/schema.prisma src/lib/db.ts data/questions.seed.json prisma/seed.ts
git commit -m "feat: add question database model"
```

Expected: commit succeeds.

## Task 4: Generate PDF Question Images and Full Seed Draft

**Files:**
- Create: `scripts/extract-pdf-assets.mjs`
- Create: `scripts/build-seed-data.mjs`
- Modify: `data/questions.seed.json`
- Create: `public/questions/*.png`

- [ ] **Step 1: Write the PDF image extraction script**

Write `scripts/extract-pdf-assets.mjs`:

```js
import { mkdir, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const popplerBin = process.env.POPPLER_BIN || "/Users/kanemac2/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin";
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
```

- [ ] **Step 2: Run image extraction**

Run:

```bash
npm run extract:pdf
```

Expected: `public/questions/` contains 48 PNG files named `tutorial-1-q01.png` through each tutorial's final question.

- [ ] **Step 3: Write the seed-building script**

Write `scripts/build-seed-data.mjs`:

```js
import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const python = process.env.PYTHON_BIN || "/Users/kanemac2/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";

const sources = [
  { source: "tutorial_1", imagePrefix: "tutorial-1", pdf: "MATS2004 Mechanical Properties of Materials  Term 2 2025 TUTORIAL 1.pdf", count: 12 },
  { source: "tutorial_2", imagePrefix: "tutorial-2", pdf: "MATS2004 Mechanical Properties of Materials  Term 2 2025 TUTORIAL 2 (1).pdf", count: 10 },
  { source: "tutorial_3", imagePrefix: "tutorial-3", pdf: "MATS2004 Mechanical Properties of Materials  Term 2 2025 TUTORIAL 3 (1).pdf", count: 10 },
  { source: "tutorial_4", imagePrefix: "tutorial-4", pdf: "MATS2004 Mechanical Properties of Materials  Term 2 2025 TUTORIAL 4.pdf", count: 16 }
];

const extractor = `
import json, pdfplumber, sys
pdf_path = sys.argv[1]
rows = []
with pdfplumber.open(pdf_path) as pdf:
    for index, page in enumerate(pdf.pages, start=1):
        text = page.extract_text(x_tolerance=1, y_tolerance=3) or ""
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        useful = [line for line in lines if not line.lower().startswith("copyright")]
        if useful and useful[0].startswith("QC"):
            useful = useful[1:]
        rows.append({"page": index, "text": "\\n".join(useful)})
print(json.dumps(rows))
`;

function inferType(prompt) {
  const optionMatches = prompt.match(/^([A-H])\\.\\s+/gm) || [];
  if (optionMatches.length > 0 && /select all|which of the listed choices/i.test(prompt)) return "multi_choice";
  if (optionMatches.length > 0) return "single_choice";
  if (/what|determine|calculate|submit|maximum value|in units|how much/i.test(prompt)) return "numeric";
  return "text";
}

function extractOptions(prompt) {
  const options = [];
  const optionRegex = /^([A-H])\\.\\s+(.+)$/gm;
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
    const prompt = page.text.replace(/\\s+Copyright.*$/i, "").trim();
    const type = inferType(prompt);
    records.push({
      source: source.source,
      questionNumber,
      prompt,
      imageUrl: `/questions/${source.imagePrefix}-q${String(questionNumber).padStart(2, "0")}.png`,
      type,
      options: extractOptions(prompt),
      answer: type === "multi_choice" ? [] : null,
      tolerance: type === "numeric" ? 0.01 : null,
      unit: null,
      explanation: "Answer requires verification.",
      status: "needs_review"
    });
  }
}

await fs.mkdir("data", { recursive: true });
await fs.writeFile(path.join("data", "questions.seed.json"), `${JSON.stringify(records, null, 2)}\\n`);
console.log(`Wrote ${records.length} questions`);
```

- [ ] **Step 4: Run seed builder**

Run:

```bash
npm run build:seed
```

Expected: output says `Wrote 48 questions`, and `data/questions.seed.json` contains 48 records.

- [ ] **Step 5: Manually enrich obvious verified answers**

Edit `data/questions.seed.json` for low-risk conceptual questions visible in extracted text, such as:

```json
{
  "source": "tutorial_3",
  "questionNumber": 2,
  "answer": "C",
  "explanation": "The polar moment of inertia is the cross-sectional geometric resistance to twisting under torque.",
  "status": "verified"
}
```

Keep calculation-heavy or diagram-ambiguous answers as:

```json
{
  "answer": null,
  "explanation": "Answer requires verification from the diagram.",
  "status": "needs_review"
}
```

- [ ] **Step 6: Verify generated assets**

Run:

```bash
find public/questions -name '*.png' | wc -l
node -e "const q=require('./data/questions.seed.json'); console.log(q.length); console.log(q.every(x=>x.imageUrl&&x.prompt&&x.status));"
```

Expected: first command prints `48`; second command prints `48` and `true`.

- [ ] **Step 7: Commit**

Run:

```bash
git add scripts/extract-pdf-assets.mjs scripts/build-seed-data.mjs data/questions.seed.json public/questions
git commit -m "feat: seed tutorial questions and images"
```

Expected: commit succeeds.

## Task 5: Build Public Question and Attempt APIs

**Files:**
- Create: `src/lib/questions.ts`
- Create: `src/lib/stats.ts`
- Create: `src/app/api/questions/route.ts`
- Create: `src/app/api/attempts/route.ts`
- Create: `tests/unit/stats.test.ts`

- [ ] **Step 1: Write failing stats aggregation tests**

Write `tests/unit/stats.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { summarizeAttempts } from "@/lib/stats";

describe("summarizeAttempts", () => {
  it("computes attempts, correct count, and rate per question", () => {
    expect(
      summarizeAttempts([
        { questionId: "q1", isCorrect: true },
        { questionId: "q1", isCorrect: false },
        { questionId: "q2", isCorrect: true }
      ])
    ).toEqual({
      overall: { attempts: 3, correct: 2, correctRate: 2 / 3 },
      byQuestion: {
        q1: { attempts: 2, correct: 1, correctRate: 0.5 },
        q2: { attempts: 1, correct: 1, correctRate: 1 }
      }
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- tests/unit/stats.test.ts
```

Expected: FAIL because `summarizeAttempts` does not exist.

- [ ] **Step 3: Implement public mapping and stats helpers**

Write `src/lib/questions.ts`:

```ts
import { prisma } from "@/lib/db";

export async function listPublicQuestions(source?: string) {
  const questions = await prisma.question.findMany({
    where: source ? { source } : undefined,
    orderBy: [{ source: "asc" }, { questionNumber: "asc" }]
  });

  return questions.map((question) => ({
    id: question.id,
    source: question.source,
    questionNumber: question.questionNumber,
    prompt: question.prompt,
    imageUrl: question.imageUrl,
    type: question.type,
    options: question.options,
    unit: question.unit,
    status: question.status
  }));
}
```

Write `src/lib/stats.ts`:

```ts
import { prisma } from "@/lib/db";

type AttemptLike = {
  questionId: string;
  isCorrect: boolean;
};

type Stat = {
  attempts: number;
  correct: number;
  correctRate: number;
};

export function summarizeAttempts(attempts: AttemptLike[]) {
  const byQuestion: Record<string, Stat> = {};
  const overall: Stat = { attempts: 0, correct: 0, correctRate: 0 };

  for (const attempt of attempts) {
    byQuestion[attempt.questionId] ??= { attempts: 0, correct: 0, correctRate: 0 };
    byQuestion[attempt.questionId].attempts += 1;
    overall.attempts += 1;

    if (attempt.isCorrect) {
      byQuestion[attempt.questionId].correct += 1;
      overall.correct += 1;
    }
  }

  for (const stat of Object.values(byQuestion)) {
    stat.correctRate = stat.attempts === 0 ? 0 : stat.correct / stat.attempts;
  }
  overall.correctRate = overall.attempts === 0 ? 0 : overall.correct / overall.attempts;

  return { overall, byQuestion };
}

export async function recordAttempt(questionId: string, isCorrect: boolean) {
  return prisma.attempt.create({
    data: { questionId, isCorrect }
  });
}

export async function getAggregateStats() {
  const attempts = await prisma.attempt.findMany({
    select: { questionId: true, isCorrect: true }
  });
  return summarizeAttempts(attempts);
}
```

- [ ] **Step 4: Run stats test to verify it passes**

Run:

```bash
npm run test -- tests/unit/stats.test.ts
```

Expected: PASS.

- [ ] **Step 5: Create public API routes**

Write `src/app/api/questions/route.ts`:

```ts
import { listPublicQuestions } from "@/lib/questions";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const source = url.searchParams.get("source") || undefined;
  const questions = await listPublicQuestions(source);
  return NextResponse.json({ questions });
}
```

Write `src/app/api/attempts/route.ts`:

```ts
import { checkAnswer } from "@/lib/answers";
import { prisma } from "@/lib/db";
import { recordAttempt } from "@/lib/stats";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  questionId: z.string().min(1),
  submission: z.union([z.string(), z.array(z.string()), z.number()])
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const question = await prisma.question.findUniqueOrThrow({
    where: { id: body.questionId }
  });

  const result = checkAnswer(
    {
      type: question.type,
      answer: question.answer as never,
      tolerance: question.tolerance ?? undefined
    } as never,
    body.submission
  );

  await recordAttempt(question.id, result.correct);

  return NextResponse.json({
    correct: result.correct,
    answer: question.answer,
    explanation: question.explanation,
    status: question.status
  });
}
```

- [ ] **Step 6: Run unit tests**

Run:

```bash
npm run test -- tests/unit/answers.test.ts tests/unit/stats.test.ts
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/lib/questions.ts src/lib/stats.ts src/app/api/questions/route.ts src/app/api/attempts/route.ts tests/unit/stats.test.ts
git commit -m "feat: add public question and attempt APIs"
```

Expected: commit succeeds.

## Task 6: Build Admin Authentication and Admin APIs

**Files:**
- Create: `src/lib/admin-auth.ts`
- Create: `src/app/api/admin/login/route.ts`
- Create: `src/app/api/admin/questions/route.ts`
- Create: `src/app/api/admin/questions/[id]/route.ts`
- Create: `src/app/api/admin/stats/route.ts`
- Create: `tests/api/admin-auth.test.ts`

- [ ] **Step 1: Write failing admin auth tests**

Write `tests/api/admin-auth.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { isAdminPassword, requireAdmin } from "@/lib/admin-auth";

describe("admin auth", () => {
  it("accepts the configured admin password", async () => {
    vi.stubEnv("ADMIN_PASSWORD", "secret-pass");
    await expect(isAdminPassword("secret-pass")).resolves.toBe(true);
  });

  it("rejects the wrong admin password", async () => {
    vi.stubEnv("ADMIN_PASSWORD", "secret-pass");
    await expect(isAdminPassword("wrong")).resolves.toBe(false);
  });

  it("throws when an admin cookie is missing", async () => {
    await expect(requireAdmin(null)).rejects.toThrow("Admin authentication required");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- tests/api/admin-auth.test.ts
```

Expected: FAIL because `@/lib/admin-auth` does not exist.

- [ ] **Step 3: Implement admin auth helpers**

Write `src/lib/admin-auth.ts`:

```ts
import { SignJWT, jwtVerify } from "jose";

const cookieName = "mats2004_admin";

function secretKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export function adminCookieName() {
  return cookieName;
}

export async function isAdminPassword(password: string) {
  return password === process.env.ADMIN_PASSWORD;
}

export async function createAdminToken() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secretKey());
}

export async function requireAdmin(token: string | null | undefined) {
  if (!token) {
    throw new Error("Admin authentication required");
  }
  const verified = await jwtVerify(token, secretKey());
  if (verified.payload.role !== "admin") {
    throw new Error("Admin authentication required");
  }
}
```

- [ ] **Step 4: Run admin auth tests**

Run:

```bash
ADMIN_SESSION_SECRET=12345678901234567890123456789012 npm run test -- tests/api/admin-auth.test.ts
```

Expected: PASS.

- [ ] **Step 5: Create admin API routes**

Write `src/app/api/admin/login/route.ts`:

```ts
import { adminCookieName, createAdminToken, isAdminPassword } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ password: z.string().min(1) });

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  if (!(await isAdminPassword(body.password))) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName(), await createAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}
```

Write `src/app/api/admin/questions/route.ts`:

```ts
import { adminCookieName, requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  await requireAdmin(request.headers.get("cookie")?.includes(adminCookieName()) ? request.headers.get("cookie")?.split(`${adminCookieName()}=`)[1]?.split(";")[0] : null);
  const questions = await prisma.question.findMany({ orderBy: [{ source: "asc" }, { questionNumber: "asc" }] });
  return NextResponse.json({ questions });
}

export async function POST(request: Request) {
  await requireAdmin(request.headers.get("cookie")?.includes(adminCookieName()) ? request.headers.get("cookie")?.split(`${adminCookieName()}=`)[1]?.split(";")[0] : null);
  const body = await request.json();
  const question = await prisma.question.create({ data: body });
  return NextResponse.json({ question }, { status: 201 });
}
```

Write `src/app/api/admin/questions/[id]/route.ts`:

```ts
import { adminCookieName, requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

function tokenFromCookieHeader(header: string | null) {
  return header?.includes(adminCookieName()) ? header.split(`${adminCookieName()}=`)[1]?.split(";")[0] : null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(tokenFromCookieHeader(request.headers.get("cookie")));
  const { id } = await params;
  const body = await request.json();
  const question = await prisma.question.update({ where: { id }, data: body });
  return NextResponse.json({ question });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(tokenFromCookieHeader(request.headers.get("cookie")));
  const { id } = await params;
  await prisma.question.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

Write `src/app/api/admin/stats/route.ts`:

```ts
import { adminCookieName, requireAdmin } from "@/lib/admin-auth";
import { getAggregateStats } from "@/lib/stats";
import { NextResponse } from "next/server";

function tokenFromCookieHeader(header: string | null) {
  return header?.includes(adminCookieName()) ? header.split(`${adminCookieName()}=`)[1]?.split(";")[0] : null;
}

export async function GET(request: Request) {
  await requireAdmin(tokenFromCookieHeader(request.headers.get("cookie")));
  return NextResponse.json(await getAggregateStats());
}
```

- [ ] **Step 6: Refactor duplicate cookie parsing**

Move `tokenFromCookieHeader` into `src/lib/admin-auth.ts`:

```ts
export function tokenFromCookieHeader(header: string | null) {
  return header?.includes(cookieName) ? header.split(`${cookieName}=`)[1]?.split(";")[0] : null;
}
```

Update all admin routes to import and use `tokenFromCookieHeader`.

- [ ] **Step 7: Run admin auth tests**

Run:

```bash
ADMIN_SESSION_SECRET=12345678901234567890123456789012 npm run test -- tests/api/admin-auth.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add src/lib/admin-auth.ts src/app/api/admin tests/api/admin-auth.test.ts
git commit -m "feat: add admin authentication and APIs"
```

Expected: commit succeeds.

## Task 7: Build Public Practice UI

**Files:**
- Create: `src/components/PracticeQuestion.tsx`
- Create: `tests/components/practice-question.test.tsx`
- Create: `src/app/page.tsx`
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Write failing component tests**

Write `tests/components/practice-question.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PracticeQuestion } from "@/components/PracticeQuestion";

const question = {
  id: "q1",
  source: "tutorial_3",
  questionNumber: 2,
  prompt: "What does J represent?",
  imageUrl: "/questions/tutorial-3-q02.png",
  type: "single_choice" as const,
  options: ["Axial loading", "Bending", "Twisting resistance", "Energy"],
  unit: null,
  status: "verified" as const
};

describe("PracticeQuestion", () => {
  it("hides the answer before checking", () => {
    render(<PracticeQuestion question={question} onCheck={vi.fn()} />);
    expect(screen.queryByText(/standard answer/i)).not.toBeInTheDocument();
  });

  it("shows the result after checking", async () => {
    const user = userEvent.setup();
    render(
      <PracticeQuestion
        question={question}
        onCheck={vi.fn().mockResolvedValue({ correct: true, answer: "C", explanation: "Because J resists twist.", status: "verified" })}
      />
    );

    await user.click(screen.getByRole("radio", { name: /twisting/i }));
    await user.click(screen.getByRole("button", { name: /check/i }));

    expect(await screen.findByText(/correct/i)).toBeInTheDocument();
    expect(screen.getByText(/standard answer/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- tests/components/practice-question.test.tsx
```

Expected: FAIL because `PracticeQuestion` does not exist.

- [ ] **Step 3: Implement practice component**

Write `src/components/PracticeQuestion.tsx`:

```tsx
"use client";

import { useState } from "react";

type PracticeQuestionData = {
  id: string;
  source: string;
  questionNumber: number;
  prompt: string;
  imageUrl: string;
  type: "single_choice" | "multi_choice" | "numeric" | "text";
  options: unknown;
  unit: string | null;
  status: "verified" | "needs_review";
};

type CheckResponse = {
  correct: boolean;
  answer: unknown;
  explanation: string | null;
  status: "verified" | "needs_review";
};

export function PracticeQuestion({
  question,
  onCheck
}: {
  question: PracticeQuestionData;
  onCheck: (questionId: string, submission: string | string[]) => Promise<CheckResponse>;
}) {
  const [submission, setSubmission] = useState<string | string[]>("");
  const [result, setResult] = useState<CheckResponse | null>(null);
  const options = Array.isArray(question.options) ? question.options.map(String) : [];

  async function check() {
    setResult(await onCheck(question.id, submission));
  }

  function toggleChoice(choice: string) {
    const current = Array.isArray(submission) ? submission : [];
    setSubmission(current.includes(choice) ? current.filter((item) => item !== choice) : [...current, choice]);
  }

  return (
    <article className="question-shell">
      <div className="question-meta">
        {question.source.replace("_", " ")} · Q{question.questionNumber}
      </div>
      <h1>{question.prompt}</h1>
      <img className="question-image" src={question.imageUrl} alt={`Question ${question.questionNumber}`} />

      <div className="answer-area">
        {question.type === "single_choice" &&
          options.map((option, index) => {
            const letter = String.fromCharCode(65 + index);
            return (
              <label key={option} className="option-row">
                <input type="radio" name={question.id} value={letter} onChange={() => setSubmission(letter)} />
                <span>{letter}. {option}</span>
              </label>
            );
          })}

        {question.type === "multi_choice" &&
          options.map((option, index) => {
            const letter = String.fromCharCode(65 + index);
            return (
              <label key={option} className="option-row">
                <input type="checkbox" value={letter} onChange={() => toggleChoice(letter)} />
                <span>{letter}. {option}</span>
              </label>
            );
          })}

        {(question.type === "numeric" || question.type === "text") && (
          <input
            className="answer-input"
            aria-label="Answer"
            placeholder={question.unit ? `Answer in ${question.unit}` : "Answer"}
            value={Array.isArray(submission) ? submission.join(",") : submission}
            onChange={(event) => setSubmission(event.target.value)}
          />
        )}

        <button className="primary-button" type="button" onClick={check}>Check</button>
      </div>

      {result && (
        <section className={result.correct ? "result result-correct" : "result result-wrong"}>
          <strong>{result.correct ? "Correct" : "Incorrect"}</strong>
          <p>Standard answer: {JSON.stringify(result.answer)}</p>
          {result.status === "needs_review" && <p>This answer is pending verification.</p>}
          {result.explanation && <p>{result.explanation}</p>}
        </section>
      )}
    </article>
  );
}
```

- [ ] **Step 4: Run component tests**

Run:

```bash
npm run test -- tests/components/practice-question.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Create public page**

Write `src/app/page.tsx`:

```tsx
import { PracticeQuestion } from "@/components/PracticeQuestion";
import { listPublicQuestions } from "@/lib/questions";

async function checkAnswer(questionId: string, submission: string | string[]) {
  "use server";
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000"}/api/attempts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ questionId, submission })
  });
  return response.json();
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export default async function Home({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const params = await searchParams;
  const questions = shuffle(await listPublicQuestions(params.source));
  const firstQuestion = questions[0];

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">MATS2004</p>
          <h1>Practice Questions</h1>
        </div>
        <form>
          <select name="source" defaultValue={params.source ?? ""}>
            <option value="">All tutorials</option>
            <option value="tutorial_1">Tutorial 1</option>
            <option value="tutorial_2">Tutorial 2</option>
            <option value="tutorial_3">Tutorial 3</option>
            <option value="tutorial_4">Tutorial 4</option>
          </select>
          <button type="submit">Filter</button>
        </form>
      </header>
      {firstQuestion ? (
        <PracticeQuestion question={firstQuestion} onCheck={checkAnswer} />
      ) : (
        <p>No questions found.</p>
      )}
    </main>
  );
}
```

- [ ] **Step 6: Add page styles**

Append to `src/styles/globals.css`:

```css
.app-shell {
  width: min(1120px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 24px 0 48px;
}

.topbar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.eyebrow,
.question-meta {
  color: var(--muted);
  font-size: 0.85rem;
  text-transform: uppercase;
}

.question-shell {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 20px;
}

.question-shell h1 {
  font-size: clamp(1.2rem, 2vw, 1.6rem);
  line-height: 1.35;
}

.question-image {
  width: 100%;
  max-height: 560px;
  object-fit: contain;
  border: 1px solid var(--line);
  background: white;
}

.answer-area {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.answer-input {
  min-height: 42px;
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
}

.primary-button {
  width: fit-content;
  min-height: 40px;
  padding: 8px 14px;
  border: 0;
  border-radius: 6px;
  background: var(--accent);
  color: white;
}

.result {
  margin-top: 16px;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid var(--line);
}

.result-correct {
  border-color: var(--accent);
}

.result-wrong {
  border-color: var(--danger);
}
```

- [ ] **Step 7: Run component tests**

Run:

```bash
npm run test -- tests/components/practice-question.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add src/components/PracticeQuestion.tsx tests/components/practice-question.test.tsx src/app/page.tsx src/styles/globals.css
git commit -m "feat: add public practice interface"
```

Expected: commit succeeds.

## Task 8: Build Admin UI

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/components/AdminQuestionEditor.tsx`
- Create: `src/components/AdminStats.tsx`
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Create admin page**

Write `src/app/admin/page.tsx`:

```tsx
import { AdminQuestionEditor } from "@/components/AdminQuestionEditor";
import { AdminStats } from "@/components/AdminStats";

export default function AdminPage() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>MATS2004 Question Manager</h1>
        </div>
      </header>
      <AdminQuestionEditor />
      <AdminStats />
    </main>
  );
}
```

- [ ] **Step 2: Create admin question editor**

Write `src/components/AdminQuestionEditor.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

type AdminQuestion = {
  id: string;
  source: string;
  questionNumber: number;
  prompt: string;
  imageUrl: string;
  type: string;
  options: unknown;
  answer: unknown;
  tolerance: number | null;
  unit: string | null;
  explanation: string | null;
  status: string;
};

export function AdminQuestionEditor() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [selected, setSelected] = useState<AdminQuestion | null>(null);

  async function login() {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password })
    });
    if (response.ok) {
      setLoggedIn(true);
    }
  }

  async function loadQuestions() {
    const response = await fetch("/api/admin/questions");
    if (response.ok) {
      const data = await response.json();
      setQuestions(data.questions);
      setSelected(data.questions[0] ?? null);
    }
  }

  async function saveQuestion() {
    if (!selected) return;
    const response = await fetch(`/api/admin/questions/${selected.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(selected)
    });
    if (response.ok) {
      await loadQuestions();
    }
  }

  useEffect(() => {
    if (loggedIn) void loadQuestions();
  }, [loggedIn]);

  if (!loggedIn) {
    return (
      <section className="admin-panel">
        <h2>Admin login</h2>
        <input aria-label="Admin password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <button className="primary-button" type="button" onClick={login}>Enter</button>
      </section>
    );
  }

  return (
    <section className="admin-grid">
      <aside className="admin-list">
        {questions.map((question) => (
          <button key={question.id} type="button" onClick={() => setSelected(question)}>
            {question.source} Q{question.questionNumber} · {question.status}
          </button>
        ))}
      </aside>
      {selected && (
        <form className="admin-panel" onSubmit={(event) => { event.preventDefault(); void saveQuestion(); }}>
          <label>Prompt<textarea value={selected.prompt} onChange={(event) => setSelected({ ...selected, prompt: event.target.value })} /></label>
          <label>Image URL<input value={selected.imageUrl} onChange={(event) => setSelected({ ...selected, imageUrl: event.target.value })} /></label>
          <label>Type<input value={selected.type} onChange={(event) => setSelected({ ...selected, type: event.target.value })} /></label>
          <label>Answer<textarea value={JSON.stringify(selected.answer)} onChange={(event) => setSelected({ ...selected, answer: JSON.parse(event.target.value) })} /></label>
          <label>Explanation<textarea value={selected.explanation ?? ""} onChange={(event) => setSelected({ ...selected, explanation: event.target.value })} /></label>
          <label>Status<select value={selected.status} onChange={(event) => setSelected({ ...selected, status: event.target.value })}>
            <option value="verified">verified</option>
            <option value="needs_review">needs_review</option>
          </select></label>
          <button className="primary-button" type="submit">Save</button>
        </form>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Create admin stats component**

Write `src/components/AdminStats.tsx`:

```tsx
"use client";

import { useState } from "react";

type Stats = {
  overall: { attempts: number; correct: number; correctRate: number };
  byQuestion: Record<string, { attempts: number; correct: number; correctRate: number }>;
};

export function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  async function loadStats() {
    const response = await fetch("/api/admin/stats");
    if (response.ok) {
      setStats(await response.json());
    }
  }

  return (
    <section className="admin-panel">
      <h2>Anonymous statistics</h2>
      <button type="button" onClick={loadStats}>Load stats</button>
      {stats && (
        <>
          <p>Total attempts: {stats.overall.attempts}</p>
          <p>Overall correct rate: {(stats.overall.correctRate * 100).toFixed(1)}%</p>
          <table>
            <thead><tr><th>Question ID</th><th>Attempts</th><th>Correct</th><th>Rate</th></tr></thead>
            <tbody>
              {Object.entries(stats.byQuestion).map(([questionId, stat]) => (
                <tr key={questionId}>
                  <td>{questionId}</td>
                  <td>{stat.attempts}</td>
                  <td>{stat.correct}</td>
                  <td>{(stat.correctRate * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Add admin styles**

Append to `src/styles/globals.css`:

```css
.admin-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  align-items: start;
}

.admin-list,
.admin-panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px;
}

.admin-list {
  display: grid;
  gap: 8px;
}

.admin-list button {
  text-align: left;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: white;
  padding: 8px;
}

.admin-panel {
  display: grid;
  gap: 12px;
}

.admin-panel label {
  display: grid;
  gap: 6px;
}

.admin-panel input,
.admin-panel textarea,
.admin-panel select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 8px;
}

.admin-panel textarea {
  min-height: 96px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid var(--line);
  padding: 8px;
  text-align: left;
}
```

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: Next.js build completes without TypeScript errors.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/app/admin/page.tsx src/components/AdminQuestionEditor.tsx src/components/AdminStats.tsx src/styles/globals.css
git commit -m "feat: add admin dashboard"
```

Expected: commit succeeds.

## Task 9: Add Browser-Level Practice Verification

**Files:**
- Create: `tests/e2e/practice.spec.ts`

- [ ] **Step 1: Write Playwright test**

Write `tests/e2e/practice.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("practice page hides answers until check", async ({ page }) => {
  await page.route("**/api/attempts", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        correct: true,
        answer: "C",
        explanation: "Verified explanation",
        status: "verified"
      })
    });
  });

  await page.goto("/");
  await expect(page.getByText(/standard answer/i)).toHaveCount(0);
  const check = page.getByRole("button", { name: /check/i });
  await expect(check).toBeVisible();
});
```

- [ ] **Step 2: Run Playwright test**

Run:

```bash
npm run test:e2e -- tests/e2e/practice.spec.ts
```

Expected: PASS after the local dev server starts.

- [ ] **Step 3: Commit**

Run:

```bash
git add tests/e2e/practice.spec.ts
git commit -m "test: add practice page browser check"
```

Expected: commit succeeds.

## Task 10: Configure Local Database and Deployment Notes

**Files:**
- Create: `README.md`
- Create: `docs/deployment-vercel.md`

- [ ] **Step 1: Create README**

Write `README.md`:

```md
# MATS2004 Practice App

Public practice app for MATS2004 tutorial questions.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Set `DATABASE_URL`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET`.

4. Generate question images and seed data:

```bash
npm run extract:pdf
npm run build:seed
```

5. Run database migration and seed:

```bash
npm run db:migrate
npm run db:seed
```

6. Start the app:

```bash
npm run dev
```

Public app: `http://127.0.0.1:3000`

Admin app: `http://127.0.0.1:3000/admin`
```

- [ ] **Step 2: Create Vercel deployment notes**

Write `docs/deployment-vercel.md`:

```md
# Vercel Deployment

## Required Environment Variables

- `DATABASE_URL`: PostgreSQL-compatible connection string from Vercel Postgres or Neon.
- `ADMIN_PASSWORD`: password used to enter `/admin`.
- `ADMIN_SESSION_SECRET`: at least 32 random characters.
- `NEXT_PUBLIC_APP_URL`: deployed site URL, for example `https://mats2004-practice.vercel.app`.

## Deployment Steps

1. Push this repository to GitHub.
2. Import the repository into Vercel.
3. Add the environment variables above.
4. Run the Prisma migration against the production database:

```bash
npx prisma migrate deploy
```

5. Seed production data:

```bash
npx prisma db seed
```

6. Open the public Vercel URL for practice.
7. Open `/admin` and log in with `ADMIN_PASSWORD`.

## Notes

Question images are stored in `public/questions/` and are deployed as static assets.

The app records anonymous aggregate attempts only. It does not collect names, student IDs, emails, or accounts.
```

- [ ] **Step 3: Commit**

Run:

```bash
git add README.md docs/deployment-vercel.md
git commit -m "docs: add setup and deployment instructions"
```

Expected: commit succeeds.

## Task 11: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Run unit and component tests**

Run:

```bash
npm run test
```

Expected: all Vitest suites pass.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: Next.js production build succeeds.

- [ ] **Step 3: Verify PDF asset and seed counts**

Run:

```bash
find public/questions -name '*.png' | wc -l
node -e "const q=require('./data/questions.seed.json'); if(q.length!==48) process.exit(1); console.log(q.length)"
```

Expected: first command prints `48`; second command prints `48`.

- [ ] **Step 4: Run browser test**

Run:

```bash
npm run test:e2e
```

Expected: Playwright tests pass.

- [ ] **Step 5: Inspect git status**

Run:

```bash
git status --short
```

Expected: no unexpected uncommitted changes except environment files ignored by git.

