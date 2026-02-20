"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: String(formData.get("username") || ""),
        password: String(formData.get("password") || "")
      })
    });

    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? "Login fehlgeschlagen");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="admin-login-shell">
      <form onSubmit={onSubmit} className="admin-login-card">
        <p className="eyebrow">Meedya Admin</p>
        <h1>Dashboard Login</h1>
        <label>
          Username
          <input name="username" required />
        </label>
        <label>
          Passwort
          <input name="password" type="password" required />
        </label>
        <button disabled={loading} type="submit">
          {loading ? "Prüfe..." : "Einloggen"}
        </button>
        {error && <p className="form-error">{error}</p>}
      </form>
    </main>
  );
}
