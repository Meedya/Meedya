import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const leadSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email().max(200),
  company: z.string().max(120).optional().or(z.literal("")),
  service: z.string().min(2).max(120),
  budget: z.string().max(100).optional().or(z.literal("")),
  message: z.string().min(15).max(1800)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
    }

    const lead = parsed.data;
    await prisma.lead.create({
      data: {
        fullName: lead.fullName,
        email: lead.email,
        company: lead.company || null,
        service: lead.service,
        budget: lead.budget || null,
        message: lead.message
      }
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
