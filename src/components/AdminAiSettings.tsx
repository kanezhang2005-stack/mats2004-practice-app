"use client";

import React, { useEffect, useState } from "react";

export function AdminAiSettings() {
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/settings/ai");
      if (response.ok) {
        const data = await response.json();
        setEnabled(Boolean(data.aiExplanationsEnabled));
      }
      setLoaded(true);
    }

    void load();
  }, []);

  async function updateEnabled(nextEnabled: boolean) {
    setEnabled(nextEnabled);
    setMessage("Saving");
    const response = await fetch("/api/admin/settings/ai", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ aiExplanationsEnabled: nextEnabled })
    });
    if (response.ok) {
      const data = await response.json();
      setEnabled(Boolean(data.aiExplanationsEnabled));
      setMessage("Saved");
    } else {
      setEnabled(!nextEnabled);
      setMessage("Save failed");
    }
  }

  return (
    <section className="admin-panel">
      <h2>AI settings</h2>
      <label className="checkbox-row">
        <input
          aria-label="Enable AI explanations"
          type="checkbox"
          checked={enabled}
          disabled={!loaded}
          onChange={(event) => void updateEnabled(event.target.checked)}
        />
        Enable AI explanations
      </label>
      {message && <p>{message}</p>}
    </section>
  );
}
