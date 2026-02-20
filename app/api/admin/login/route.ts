import { NextResponse } from "next/server";
import { z } from "zod";
import { clearAdminSession, createAdminSession, validateAdminCredentials } from "@/lib/auth";

const authSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = authSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
    }

    const isValid = await validateAdminCredentials(parsed.data.username, parsed.data.password);
    if (!isValid) {
      return NextResponse.json({ error: "Ungültige Zugangsdaten" }, { status: 401 });
    }

    await createAdminSession();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
