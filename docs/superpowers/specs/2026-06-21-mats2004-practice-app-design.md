# MATS2004 Practice App Design

Date: 2026-06-21

## Goal

Build a small public web practice app for the four MATS2004 tutorial PDFs in this folder. Students can open a public link, receive questions in a randomized exam-practice format, answer without seeing the solution first, and use a Check button to see whether their answer is correct.

The owner can open an admin page protected by a local administrator password to edit answers, explanations, question metadata, images, and add or remove questions.

## Confirmed Product Decisions

- Deployment target: public Vercel link.
- Framework direction: Next.js on Vercel.
- Data storage: server-side database, preferably Vercel Postgres or Neon.
- Public users: no login.
- Admin access: password-protected `/admin` page.
- Statistics: anonymous aggregate attempts and correctness only.
- Backups: no import/export backup feature in the app.
- Question images: each question must show its corresponding PDF-derived image.
- Answers: solve and enter answers where reliable; mark uncertain answers as `needs_review`.

## Source Materials

The current folder contains four PDFs:

- `MATS2004 Mechanical Properties of Materials  Term 2 2025 TUTORIAL 1.pdf` - 12 pages
- `MATS2004 Mechanical Properties of Materials  Term 2 2025 TUTORIAL 2 (1).pdf` - 10 pages
- `MATS2004 Mechanical Properties of Materials  Term 2 2025 TUTORIAL 3 (1).pdf` - 10 pages
- `MATS2004 Mechanical Properties of Materials  Term 2 2025 TUTORIAL 4.pdf` - 16 pages

Initial inspection shows one question per page. The first implementation should export one image per PDF page and attach that image to the matching question. If a later review finds multiple questions on one page, the admin can replace the image for that question with a cropped version.

## Data Model

Each question is a database record with:

- `id`: unique identifier.
- `source`: tutorial source, such as `tutorial_1`.
- `questionNumber`: original question number from the PDF.
- `prompt`: question text extracted from the PDF and cleaned where needed.
- `imageUrl`: path to the question image.
- `type`: one of `single_choice`, `multi_choice`, `numeric`, or `text`.
- `options`: choices for choice questions, otherwise empty.
- `answer`: standard answer.
- `tolerance`: optional numeric tolerance for numeric questions.
- `unit`: optional answer unit.
- `explanation`: solution explanation or calculation notes.
- `status`: `verified` or `needs_review`.
- `createdAt`: creation timestamp.
- `updatedAt`: last edit timestamp.

Anonymous attempt records contain:

- `id`: unique identifier.
- `questionId`: linked question.
- `isCorrect`: whether the submitted answer was correct.
- `createdAt`: attempt timestamp.

No name, student ID, email, or account information is collected.

## Public Practice Flow

The public app opens directly to practice mode.

The page shows:

- Course title.
- Current session progress.
- Optional tutorial filter for Tutorial 1, 2, 3, or 4.
- Question prompt.
- Question image.
- Answer input appropriate to the question type.
- Check button beside or below the answer input.

Answer behavior:

- The correct answer is hidden before Check is pressed.
- Single-choice questions use selectable options.
- Multi-choice questions use checkboxes.
- Numeric questions use a text or number input and compare within tolerance.
- Text questions compare normalized text by trimming whitespace and ignoring case.
- After Check, the app shows correct or incorrect, the standard answer, and the explanation if present.
- If a question is marked `needs_review`, the result view shows that the answer is pending verification.

Question ordering:

- Default ordering is randomized.
- The app does not show questions in fixed PDF order by default.
- Recently answered questions are pushed later in the current browser session.
- Current-browser wrong-answer practice can be supported locally without collecting identity.

## Admin Flow

The admin page is `/admin`. If the public site is:

```text
https://mats2004-practice.vercel.app
```

then the admin page is:

```text
https://mats2004-practice.vercel.app/admin
```

The admin page first asks for the administrator password. The password is stored in a server-side environment variable named `ADMIN_PASSWORD`, not in frontend code.

After login, the admin can:

- View all questions.
- Filter by tutorial.
- Filter by question type.
- Filter by `verified` or `needs_review`.
- Search prompt text.
- Edit prompt text.
- Edit question type.
- Edit answer options.
- Edit standard answer.
- Edit numeric tolerance.
- Edit unit.
- Edit explanation.
- Edit verification status.
- Replace the question image.
- Add a new question.
- Delete an existing question.
- View anonymous aggregate statistics.

Admin statistics show:

- Attempts per question.
- Correct attempts per question.
- Correct rate per question.
- Total attempts.
- Overall correct rate.

The admin area does not include JSON import/export backup features.

## Security

The public API can:

- Read published questions.
- Submit anonymous attempts.

The admin API can:

- Create questions.
- Update questions.
- Delete questions.
- View aggregate statistics.
- Replace image references.

All admin APIs must verify an authenticated admin session before changing data or returning admin-only data.

The password-only admin design is intentionally simple. It is acceptable for this study tool, but it should not be treated as high-security account infrastructure.

## Image Processing

The implementation should render every PDF page to a PNG or WebP image and store it under:

```text
public/questions/
```

The generated path should be stable and descriptive, for example:

```text
public/questions/tutorial-1-q01.png
```

Each question record references its image path, for example:

```text
/questions/tutorial-1-q01.png
```

The app should preserve enough image width and zoom behavior for formulas, units, and engineering diagrams to remain readable.

## Answer Handling

The initial seed data should include:

- Prompt text extracted from PDFs.
- Original question image.
- Question type inferred from the prompt and options.
- Options for choice questions.
- Calculated or selected answer where reliable.
- Explanation where practical.
- `verified` only when the answer is confidently correct.
- `needs_review` for answers that depend on ambiguous image interpretation or require manual confirmation.

The app must not pretend uncertain answers are verified.

## Testing Strategy

Core answer-checking tests:

- Single-choice answers match exactly after normalization.
- Multi-choice answers are correct regardless of selection order.
- Numeric answers pass within tolerance and fail outside tolerance.
- Text answers ignore leading/trailing whitespace and case.

API tests:

- Public users can fetch practice questions.
- Public users can submit anonymous attempts.
- Public users cannot create, update, or delete questions.
- Admin users can create, update, and delete questions.
- Anonymous attempt aggregation returns correct totals and rates.

Frontend behavior tests:

- Answer is hidden before Check.
- Check reveals result and answer.
- `needs_review` status is visible after Check.
- Randomized order is not the fixed PDF order.
- Tutorial filters restrict the question pool.

PDF processing checks:

- All four PDFs are processed.
- Question counts match the PDF page counts unless manual splitting changes the count.
- Each generated question has an image path.
- Rendered images are readable.

## Open Implementation Notes

- Exact database provider can be Vercel Postgres or Neon; both work with Vercel.
- Initial development can use a local SQLite or local Postgres setup, then switch to the hosted database for deployment.
- The admin session can be implemented with a signed HTTP-only cookie.
- If image replacement uploads are too large for Vercel serverless limits, the initial admin can edit the `imageUrl` path and replacement files can be added through the project before redeploying.

