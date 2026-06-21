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
  status: "verified" | "needs_review";
};

function parseJsonOrString(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function AdminQuestionEditor() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [selected, setSelected] = useState<AdminQuestion | null>(null);
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
    }
  }

  async function saveQuestion() {
    if (!selected) return;
    const response = await fetch(`/api/admin/questions/${selected.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(selected)
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
          <button key={question.id} type="button" onClick={() => setSelected(question)}>
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
            <select value={selected.type} onChange={(event) => setSelected({ ...selected, type: event.target.value as AdminQuestion["type"] })}>
              <option value="single_choice">single_choice</option>
              <option value="multi_choice">multi_choice</option>
              <option value="numeric">numeric</option>
              <option value="text">text</option>
            </select>
          </label>
          <label>
            Options JSON
            <textarea value={JSON.stringify(selected.options, null, 2)} onChange={(event) => setSelected({ ...selected, options: parseJsonOrString(event.target.value) })} />
          </label>
          <label>
            Answer JSON
            <textarea value={JSON.stringify(selected.answer, null, 2)} onChange={(event) => setSelected({ ...selected, answer: parseJsonOrString(event.target.value) })} />
          </label>
          <label>
            Tolerance
            <input value={selected.tolerance ?? ""} onChange={(event) => setSelected({ ...selected, tolerance: event.target.value ? Number(event.target.value) : null })} />
          </label>
          <label>
            Unit
            <input value={selected.unit ?? ""} onChange={(event) => setSelected({ ...selected, unit: event.target.value || null })} />
          </label>
          <label>
            Explanation
            <textarea value={selected.explanation ?? ""} onChange={(event) => setSelected({ ...selected, explanation: event.target.value })} />
          </label>
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
