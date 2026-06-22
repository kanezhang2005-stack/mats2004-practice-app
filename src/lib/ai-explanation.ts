import type { QuestionType } from "@/lib/answers";

type ExplainQuestion = {
  prompt: string;
  type: QuestionType;
  options: unknown;
  unit: string | null;
  status: "verified" | "needs_review";
};

type CreateExplanationInput = {
  apiKey: string;
  model: string;
  question: ExplainQuestion;
  submission: string | string[] | number;
  correctAnswer: unknown;
  fetcher?: typeof fetch;
};

function formatValue(value: unknown) {
  return Array.isArray(value) ? value.join(", ") : String(value ?? "");
}

export function buildExplanationPrompt({
  question,
  submission,
  correctAnswer
}: Pick<CreateExplanationInput, "question" | "submission" | "correctAnswer">) {
  const options = Array.isArray(question.options) && question.options.length ? question.options.map(String).join("\n") : "No options";
  const verificationNote = question.status === "needs_review" ? "This question may still need answer verification." : "";

  return [
    verificationNote,
    "You are explaining a MATS2004 mechanics practice question to a student who got it wrong.",
    "Do not ask follow-up questions. Do not invite the student to chat.",
    "Use concise, clear steps. If the question involves units, mention the unit handling.",
    "Structure the explanation with these headings: What the question is asking, Key idea, Step-by-step explanation, Common mistake, Final answer check.",
    "",
    `Question type: ${question.type}`,
    `Question prompt:\n${question.prompt}`,
    `Options:\n${options}`,
    `Student answer: ${formatValue(submission)}`,
    `Standard answer: ${formatValue(correctAnswer)}`,
    `Unit: ${question.unit ?? "Not specified"}`
  ]
    .filter(Boolean)
    .join("\n");
}

export function extractResponseText(data: unknown) {
  if (typeof data !== "object" || data === null) {
    return "";
  }

  const response = data as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ text?: unknown; type?: string }> }>;
  };

  if (typeof response.output_text === "string") {
    return response.output_text.trim();
  }

  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => (typeof content.text === "string" ? content.text : ""))
      .join("")
      .trim() ?? ""
  );
}

export async function createAiExplanation({
  apiKey,
  model,
  question,
  submission,
  correctAnswer,
  fetcher = fetch
}: CreateExplanationInput) {
  const response = await fetcher("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: buildExplanationPrompt({ question, submission, correctAnswer }),
      max_output_tokens: 700
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  const text = extractResponseText(await response.json());
  if (!text) {
    throw new Error("OpenAI returned an empty explanation.");
  }
  return text;
}
