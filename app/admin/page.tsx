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
    <main className="admin-shell">
      <header className="admin-header">
        <h1>Leads Dashboard</h1>
        <LogoutButton />
      </header>
      <div className="lead-grid">
        {leads.length === 0 ? (
          <article className="lead-card">
            <h2>Keine Leads vorhanden</h2>
            <p>Noch keine neuen Intake-Formulare eingegangen.</p>
          </article>
        ) : (
          leads.map((lead) => (
            <article key={lead.id} className="lead-card">
              <div className="lead-card-head">
                <h2>{lead.fullName}</h2>
                <DeleteLeadButton leadId={lead.id} />
              </div>
              <p>
                <strong>Email:</strong> {lead.email}
              </p>
              {lead.company && (
                <p>
                  <strong>Firma:</strong> {lead.company}
                </p>
              )}
              <p>
                <strong>Service:</strong> {lead.service}
              </p>
              {lead.budget && (
                <p>
                  <strong>Budget:</strong> {lead.budget}
                </p>
              )}
              <p className="lead-message">{lead.message}</p>
              <p className="lead-date">{new Date(lead.createdAt).toLocaleString("de-DE")}</p>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
