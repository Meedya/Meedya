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
    <main className="min-h-screen bg-ink text-chalk">
      <div className="noise absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-screen max-w-lg items-center px-6">
        <form onSubmit={onSubmit} className="card w-full space-y-4 p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Meedya Admin</p>
          <h1 className="text-2xl font-semibold">Dashboard Login</h1>
          <input className="input" name="username" placeholder="Username" required />
          <input className="input" name="password" type="password" placeholder="Passwort" required />
          <button className="primary-button w-full" disabled={loading} type="submit">
            {loading ? "Pruefe..." : "Einloggen"}
          </button>
          {error && <p className="text-xs text-red-300">{error}</p>}
        </form>
      </div>
    </main>
  );
}
