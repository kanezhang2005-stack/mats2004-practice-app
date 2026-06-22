"use client";

import React, { useState } from "react";
import { AdminAiSettings } from "@/components/AdminAiSettings";
import { AdminQuestionEditor } from "@/components/AdminQuestionEditor";
import { AdminStats } from "@/components/AdminStats";

export function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
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
    <>
      <AdminAiSettings />
      <AdminQuestionEditor />
      <AdminStats />
    </>
  );
}
