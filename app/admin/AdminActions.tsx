"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(async () => {
          await fetch("/api/admin/login", { method: "DELETE" });
          router.push("/admin/login");
          router.refresh();
        });
      }}
      disabled={pending}
      className="secondary-button"
    >
      {pending ? "..." : "Logout"}
    </button>
  );
}

export function DeleteLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    setLoading(true);
    try {
      await fetch(`/api/admin/leads/${leadId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={onDelete} disabled={loading} className="secondary-button">
      {loading ? "Loesche..." : "Loeschen"}
    </button>
  );
}
