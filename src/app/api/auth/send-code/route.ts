import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { resend } from "@/lib/resend";
import { rateLimit, retryAfter } from "@/lib/rateLimiter";

export const dynamic = "force-dynamic";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

// Basic email format validation (no library dependency)
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Basic UID validation — Firebase UIDs are 28 chars, alphanumeric
function isValidUid(uid: string): boolean {
  return typeof uid === "string" && uid.length >= 20 && uid.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(uid);
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    // ── IP-based rate limit: 5 send-code requests per 15 minutes per IP ──
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!rateLimit(`send-code:${ip}`, 5, 15 * 60 * 1000)) {
      const wait = retryAfter(`send-code:${ip}`);
      return NextResponse.json(
        { error: `Terlalu banyak permintaan. Coba lagi dalam ${wait} detik.` },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Request body tidak valid." }, { status: 400 });
    }

    const { uid, email } = body;

    // ── Input validation ──────────────────────────────────────────────────────
    if (!uid || !email) {
      return NextResponse.json({ error: "uid dan email wajib diisi." }, { status: 400 });
    }
    if (!isValidUid(uid)) {
      return NextResponse.json({ error: "UID tidak valid." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is missing from environment variables.");
      return NextResponse.json(
        { error: "Server configuration error. Hubungi admin." },
        { status: 500 }
      );
    }

    const docRef = adminDb.collection("otp_codes").doc(uid);
    const existing = await docRef.get();

    if (existing.exists) {
      const data = existing.data()!;
      const createdAtMs = data.createdAt?.toMillis?.() ?? 0;
      if (Date.now() - createdAtMs < RESEND_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - createdAtMs)) / 1000);
        return NextResponse.json(
          { error: `Tunggu ${waitSeconds} detik sebelum minta kode baru.` },
          { status: 429 }
        );
      }
    }

    const code = generateCode();
    const now = Date.now();

    // Only log OTP in development — never in production
    if (process.env.NODE_ENV === "development") {
      console.log("\n==========================================");
      console.log(`🔑 [DEV OTP CODE]: ${code}`);
      console.log(`📧 Email: ${email}`);
      console.log("==========================================\n");
    }

    await docRef.set({
      code,
      email,
      attempts: 0,
      createdAt: new Date(now),
      expiresAt: new Date(now + CODE_TTL_MS),
    });

    const { data: sendData, error: sendError } = await resend.emails.send({
      from: "AnimeSya <onboarding@resend.dev>",
      to: email,
      subject: "Kode verifikasi AnimeSya",
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
          <h2 style="color: #18181b;">Verifikasi Email Kamu</h2>
          <p style="color: #52525b; font-size: 14px;">Masukkan kode berikut untuk verifikasi akun AnimeSya kamu:</p>
          <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #18181b; margin: 24px 0; text-align: center;">
            ${code}
          </div>
          <p style="color: #a1a1aa; font-size: 12px;">Kode ini berlaku selama 10 menit. Jangan bagikan kode ini ke siapa pun.</p>
        </div>
      `,
    });

    if (sendError) {
      console.error("Resend send-code error:", sendError);
      return NextResponse.json(
        { error: "Gagal mengirim kode ke email. Coba lagi." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, id: sendData?.id ?? null });
  } catch (err) {
    console.error("send-code error:", err);
    return NextResponse.json({ error: "Gagal mengirim kode. Coba lagi." }, { status: 500 });
  }
}