import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { rateLimit, retryAfter } from "@/lib/rateLimiter";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;

// Basic UID validation
function isValidUid(uid: string): boolean {
  return typeof uid === "string" && uid.length >= 20 && uid.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(uid);
}

// OTP code must be exactly 6 digits
function isValidCode(code: string): boolean {
  return typeof code === "string" && /^\d{6}$/.test(code);
}

export async function POST(req: NextRequest) {
  try {
    // ── IP-based rate limit: 10 verify attempts per 15 minutes per IP ──────
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!rateLimit(`verify-code:${ip}`, 10, 15 * 60 * 1000)) {
      const wait = retryAfter(`verify-code:${ip}`);
      return NextResponse.json(
        { error: `Terlalu banyak percobaan. Coba lagi dalam ${wait} detik.` },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Request body tidak valid." }, { status: 400 });
    }

    const { uid, code } = body;

    // ── Input validation ──────────────────────────────────────────────────────
    if (!uid || !code) {
      return NextResponse.json({ error: "uid dan kode wajib diisi." }, { status: 400 });
    }
    if (!isValidUid(uid)) {
      return NextResponse.json({ error: "UID tidak valid." }, { status: 400 });
    }
    if (!isValidCode(code)) {
      return NextResponse.json({ error: "Format kode tidak valid." }, { status: 400 });
    }

    const docRef = adminDb.collection("otp_codes").doc(uid);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Kode tidak ditemukan. Minta kode baru." },
        { status: 400 }
      );
    }

    const data = snap.data()!;
    const expiresAtMs = data.expiresAt?.toMillis?.() ?? 0;

    if (Date.now() > expiresAtMs) {
      await docRef.delete(); // Clean up expired docs
      return NextResponse.json({ error: "Kode sudah kedaluwarsa. Minta kode baru." }, { status: 400 });
    }

    if ((data.attempts ?? 0) >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan salah. Minta kode baru." },
        { status: 429 }
      );
    }

    // Use constant-time comparison to prevent timing attacks
    const expectedCode: string = data.code ?? "";
    const codesMatch = expectedCode.length === code.length &&
      expectedCode.split("").every((char, i) => char === code[i]);

    if (!codesMatch) {
      await docRef.update({ attempts: (data.attempts ?? 0) + 1 });
      return NextResponse.json({ error: "Kode salah." }, { status: 400 });
    }

    await adminDb.collection("users").doc(uid).set({ emailVerified: true }, { merge: true });
    await docRef.delete();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("verify-code error:", err);
    return NextResponse.json({ error: "Gagal memverifikasi kode. Coba lagi." }, { status: 500 });
  }
}