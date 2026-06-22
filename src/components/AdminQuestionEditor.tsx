"use client";

import React, { useEffect, useState } from "react";

type AdminQuestion = {
  id: string;
  source: string;
  questionNumber: number;
  prompt: string;
  imageUrl: string;
  type: "single_choice" | "multi_choice" | "numeric" | "text";
  options: unknown;
  answer: unknown;
  tolerance: number | null;
  unit: string | null;
  explanation: string | null;
  aiExplanation: string | null;
  status: "verified" | "needs_review";
};

function parseJsonOrString(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function hasChoiceOptions(question: AdminQuestion) {
  return question.type === "single_choice" || question.type === "multi_choice";
}

function optionLines(options: unknown) {
  return Array.isArray(options) ? options.map(String).join("\n") : "";
}

function linesToOptions(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function AdminQuestionEditor() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [selected, setSelected] = useState<AdminQuestion | null>(null);
  const [optionsText, setOptionsText] = useState("");
  const [toleranceText, setToleranceText] = useState("");
  const [message, setMessage] = useState("");

  async function login() {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password })
    });
    setLoggedIn(response.ok);
    setMessage(response.ok ? "" : "Invalid password");
  }

  async function loadQuestions() {
    const response = await fetch("/api/admin/questions");
    if (response.ok) {
      const data = await response.json();
      setQuestions(data.questions);
      setSelected(data.questions[0] ?? null);
      setOptionsText(data.questions[0] ? optionLines(data.questions[0].options) : "");
      setToleranceText(data.questions[0]?.tolerance === null || data.questions[0]?.tolerance === undefined ? "" : String(data.questions[0].tolerance));
    }
  }

  async function saveQuestion() {
    if (!selected) return;
    const questionToSave = {
      ...selected,
      options: hasChoiceOptions(selected) ? linesToOptions(optionsText) : [],
      tolerance: toleranceText.trim() ? Number(toleranceText) : null
    };
    const response = await fetch(`/api/admin/questions/${selected.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(questionToSave)
    });
    setMessage(response.ok ? "Saved" : "Save failed");
    if (response.ok) {
      await loadQuestions();
    }
  }

  async function deleteQuestion() {
    if (!selected) return;
    const response = await fetch(`/api/admin/questions/${selected.id}`, { method: "DELETE" });
    setMessage(response.ok ? "Deleted" : "Delete failed");
    if (response.ok) {
      setSelected(null);
      await loadQuestions();
    }
  }

  async function clearAiExplanation() {
    if (!selected) return;
    const response = await fetch(`/api/admin/questions/${selected.id}/ai-explanation`, { method: "DELETE" });
    setMessage(response.ok ? "AI cache cleared" : "Clear AI cache failed");
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
        <input
          aria-label="Admin password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button className="primary-button" type="button" onClick={login}>
          Enter
        </button>
        {message && <p>{message}</p>}
      </section>
    );
  }

  return (
    <section className="admin-grid">
      <aside className="admin-list">
        {questions.map((question) => (
          <button
            key={question.id}
            type="button"
            onClick={() => {
              setSelected(question);
              setOptionsText(optionLines(question.options));
              setToleranceText(question.tolerance === null || question.tolerance === undefined ? "" : String(question.tolerance));
            }}
          >
            {question.source} Q{question.questionNumber} · {question.status}
          </button>
        ))}
      </aside>
      {selected && (
        <form
          className="admin-panel"
          onSubmit={(event) => {
            event.preventDefault();
            void saveQuestion();
          }}
        >
          <label>
            Prompt
            <textarea value={selected.prompt} onChange={(event) => setSelected({ ...selected, prompt: event.target.value })} />
          </label>
          <label>
            Image URL
            <input value={selected.imageUrl} onChange={(event) => setSelected({ ...selected, imageUrl: event.target.value })} />
          </label>
          <label>
            Type
            <select
              value={selected.type}
              onChange={(event) => {
                const nextType = event.target.value as AdminQuestion["type"];
                setSelected({ ...selected, type: nextType });
                if (nextType !== "single_choice" && nextType !== "multi_choice") {
                  setOptionsText("");
                }
              }}
            >
              <option value="single_choice">single_choice</option>
              <option value="multi_choice">multi_choice</option>
              <option value="numeric">numeric</option>
              <option value="text">text</option>
            </select>
          </label>
          {hasChoiceOptions(selected) && (
            <label>
              Options
              <textarea value={optionsText} onChange={(event) => setOptionsText(event.target.value)} />
            </label>
          )}
          {selected.type === "numeric" || selected.type === "text" ? (
            <label>
              Answer
              <input
                inputMode="decimal"
                value={selected.answer === null || selected.answer === undefined ? "" : String(selected.answer)}
                onChange={(event) => setSelected({ ...selected, answer: event.target.value })}
              />
            </label>
          ) : hasChoiceOptions(selected) ? (
            <label>
              Answer
              <input
                value={Array.isArray(selected.answer) ? selected.answer.join(",") : selected.answer === null || selected.answer === undefined ? "" : String(selected.answer)}
                onChange={(event) =>
                  setSelected({
                    ...selected,
                    answer: selected.type === "multi_choice" ? event.target.value.split(",").map((choice) => choice.trim()).filter(Boolean) : event.target.value
                  })
                }
              />
            </label>
          ) : (
            <label>
              Answer JSON
              <textarea value={JSON.stringify(selected.answer, null, 2)} onChange={(event) => setSelected({ ...selected, answer: parseJsonOrString(event.target.value) })} />
            </label>
          )}
          <label>
            Tolerance
            <input inputMode="decimal" value={toleranceText} onChange={(event) => setToleranceText(event.target.value)} />
          </label>
          <label>
            Unit
            <input value={selected.unit ?? ""} onChange={(event) => setSelected({ ...selected, unit: event.target.value || null })} />
          </label>
          <label>
            Explanation
            <textarea value={selected.explanation ?? ""} onChange={(event) => setSelected({ ...selected, explanation: event.target.value })} />
          </label>
          <section className="admin-cache-box">
            <strong>AI cache: {selected.aiExplanation ? "saved" : "empty"}</strong>
            {selected.aiExplanation && (
              <button type="button" onClick={clearAiExplanation}>
                Clear cached AI explanation
              </button>
            )}
          </section>
          <label>
            Status
            <select value={selected.status} onChange={(event) => setSelected({ ...selected, status: event.target.value as AdminQuestion["status"] })}>
              <option value="verified">verified</option>
              <option value="needs_review">needs_review</option>
            </select>
          </label>
          <div className="button-row">
            <button className="primary-button" type="submit">
              Save
            </button>
            <button type="button" onClick={deleteQuestion}>
              Delete
            </button>
          </div>
          {message && <p>{message}</p>}
        </form>
      )}
    </section>
  );
}
