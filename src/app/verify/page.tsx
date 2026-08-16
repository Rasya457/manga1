"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconChevronLeft, IconSun, IconMoon } from "@/components/ui/Icons";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

function VerifyForm() {
  const { user, loading: authLoading, logout } = useAuthContext();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmailFailed = searchParams.get("emailFailed") === "1";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (initialEmailFailed) {
      setResendCooldown(0);
      setError("Kode verifikasi pertama gagal terkirim. Klik \"resend the code\" di bawah untuk coba lagi.");
    }
  }, [initialEmailFailed]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || code.length !== 6 || loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, code }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (e) {}

      if (!res.ok) {
        setError(data.error || "Gagal memverifikasi kode");
      } else {
        setSuccessMsg("Verifikasi berhasil! Mengalihkan...");
        setTimeout(() => {
          router.push("/");
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memverifikasi kode");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!user?.email || resendCooldown > 0 || resending) return;

    setError(null);
    setSuccessMsg(null);
    setResending(true);

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, email: user.email }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (e) {}

      if (!res.ok) {
        setError(data.error || "Gagal mengirim ulang kode. Periksa koneksi atau API key.");
      } else {
        setSuccessMsg("Kode verifikasi baru telah dikirim ke email Anda!");
        setResendCooldown(60);
      }
    } catch (err: any) {
      setError(err.message || "Gagal mengirim ulang kode");
    } finally {
      setResending(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="fixed inset-0 z-[100] bg-white dark:bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 font-sans">
        <div className="w-8 h-8 border-3 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  const maskedEmail = user.email
    ? user.email.replace(/(.{2})(.*)(?=@)/, (_gp1, gp2, gp3) => gp2 + "*".repeat(gp3.length))
    : "email Anda";

  return (
    <div className="min-h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between px-4 sm:px-6 py-6 font-sans transition-colors duration-300">
      {/* Header */}
      <header className="relative flex items-center justify-between w-full max-w-md mx-auto py-2">
        <button
          onClick={async () => {
            try {
              await logout();
            } catch (e) {}
            router.push("/login");
          }}
          className="p-2 -ml-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
          aria-label="Back to login"
        >
          <IconChevronLeft className="w-6 h-6" />
        </button>

        <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Verifikasi Email
        </h1>

        <button
          onClick={toggleTheme}
          className="p-2 -mr-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md mx-auto my-auto py-6 space-y-6">
        <div className="space-y-2 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
            Verification Code
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-normal leading-relaxed">
            Please enter the 6-digit code sent to{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{maskedEmail}</span>.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="relative rounded-2xl border border-zinc-300 dark:border-zinc-800 focus-within:border-zinc-900 dark:focus-within:border-zinc-100 focus-within:ring-1 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-100 px-4 py-3 transition-all bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-center">
            <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              6-Digit Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="w-full text-2xl font-black tracking-[10px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-700 bg-transparent focus:outline-none text-center"
            />
          </div>

          <button
            type="submit"
            disabled={code.length !== 6 || loading}
            className="w-full h-[52px] rounded-full bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-bold shadow-md transition-all duration-200 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />
            ) : (
              "Submit"
            )}
          </button>
        </form>

        {/* Resend Link */}
        <div className="text-center pt-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Didn&apos;t receive code?{" "}
            {resendCooldown > 0 ? (
              <span className="text-zinc-400 dark:text-zinc-500">
                Resend in {resendCooldown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending}
                className="font-bold text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer disabled:opacity-50"
              >
                {resending ? "Sending..." : "resend the code"}
              </button>
            )}
          </p>
        </div>
      </main>

      <footer className="w-full max-w-md mx-auto py-2 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
        &copy; {new Date().getFullYear()} Manga Verse. All rights reserved.
      </footer>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-white dark:bg-zinc-950" />}>
      <VerifyForm />
    </Suspense>
  );
}