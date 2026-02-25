import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DeleteLeadButton, LogoutButton } from "./AdminActions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <main className="min-h-screen bg-ink text-chalk">
      <div className="noise absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Meedya Admin</p>
            <h1 className="text-3xl font-semibold">Leads Dashboard</h1>
          </div>
          <div className="flex gap-3">
            <LogoutButton />
          </div>
        </header>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {leads.length === 0 ? (
            <article className="card p-6">
              <h2 className="text-lg font-semibold">Keine Leads vorhanden</h2>
              <p className="mt-2 text-sm text-white/60">Noch keine neuen Intake-Formulare eingegangen.</p>
            </article>
          ) : (
            leads.map((lead) => (
              <article key={lead.id} className="card space-y-3 p-6">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold">{lead.fullName}</h2>
                  <DeleteLeadButton leadId={lead.id} />
                </div>
                <p className="text-sm text-white/60">Email: {lead.email}</p>
                {lead.company && <p className="text-sm text-white/60">Firma: {lead.company}</p>}
                <p className="text-sm text-white/60">Service: {lead.service}</p>
                {lead.budget && <p className="text-sm text-white/60">Budget: {lead.budget}</p>}
                <p className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                  {lead.message}
                </p>
                <p className="text-xs text-white/40">
                  {new Date(lead.createdAt).toLocaleString("de-DE")}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
