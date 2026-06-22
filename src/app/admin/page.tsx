import { AdminDashboard } from "@/components/AdminDashboard";

export default function AdminPage() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>MATS2004 Question Manager</h1>
        </div>
      </header>
      <AdminDashboard />
    </main>
  );
}
