"use client";

import React, { useState } from "react";

type Stats = {
  overall: { attempts: number; correct: number; correctRate: number };
  byQuestion: Record<string, { attempts: number; correct: number; correctRate: number }>;
  questionLabels?: Record<string, string>;
};

export function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [clearConfirmation, setClearConfirmation] = useState("");
  const [message, setMessage] = useState("");

  async function loadStats() {
    const response = await fetch("/api/admin/stats");
    if (response.ok) {
      setStats(await response.json());
      setMessage("");
    }
  }

  async function clearHistory() {
    if (clearConfirmation !== "CLEAR") {
      setMessage("Type CLEAR to confirm before clearing history.");
      return;
    }

    const response = await fetch("/api/admin/stats", { method: "DELETE" });
    if (response.ok) {
      setStats(await response.json());
      setClearConfirmation("");
      setMessage("Answer history cleared.");
    } else {
      setMessage("Clear failed.");
    }
  }

  return (
    <section className="admin-panel stats-panel">
      <h2>Anonymous statistics</h2>
      <button type="button" onClick={loadStats}>
        Load stats
      </button>
      <label>
        Type CLEAR to confirm
        <input
          aria-label="Type CLEAR to confirm"
          value={clearConfirmation}
          onChange={(event) => setClearConfirmation(event.target.value)}
        />
      </label>
      <button type="button" onClick={clearHistory}>
        Clear answer history
      </button>
      {message && <p>{message}</p>}
      {stats && (
        <>
          <p>Total attempts: {stats.overall.attempts}</p>
          <p>Overall correct rate: {(stats.overall.correctRate * 100).toFixed(1)}%</p>
          <table>
            <thead>
              <tr>
                <th>Question</th>
                <th>Attempts</th>
                <th>Correct</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.byQuestion).map(([questionId, stat]) => (
                <tr key={questionId}>
                  <td>{stats.questionLabels?.[questionId] ?? questionId}</td>
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
