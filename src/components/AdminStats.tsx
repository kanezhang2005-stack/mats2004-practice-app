"use client";

import React, { useState } from "react";

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
    <section className="admin-panel stats-panel">
      <h2>Anonymous statistics</h2>
      <button type="button" onClick={loadStats}>
        Load stats
      </button>
      {stats && (
        <>
          <p>Total attempts: {stats.overall.attempts}</p>
          <p>Overall correct rate: {(stats.overall.correctRate * 100).toFixed(1)}%</p>
          <table>
            <thead>
              <tr>
                <th>Question ID</th>
                <th>Attempts</th>
                <th>Correct</th>
                <th>Rate</th>
              </tr>
            </thead>
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
