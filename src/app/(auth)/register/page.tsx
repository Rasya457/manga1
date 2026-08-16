"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconChevronLeft, IconGoogle, IconSun, IconMoon } from "@/components/ui/Icons";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getAuthErrorMessage } from "@/lib/authErrors";
import { auth } from "@/lib/firebase/config";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, googleLogin } = useAuthContext();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();

  const validateEmail = (val: string) => {
    return /\S+@\S+\.\S+/.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      const currentUser = auth?.currentUser;
      if (currentUser?.uid) {
        try {
          await fetch("/api/auth/send-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: currentUser.uid, email: email.trim() }),
          });
        } catch (e) {
          console.error("Failed to trigger OTP email send", e);
        }
      }
      router.push("/verify");
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await googleLogin();
      router.push("/");
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    email.trim().length > 0 &&
    password.length >= 6 &&
    confirmPassword.length >= 6;

  return (
    <div className="min-h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between px-4 sm:px-6 py-6 font-sans transition-colors duration-300">
      {/* Top Header */}
      <header className="relative flex items-center justify-between w-full max-w-md mx-auto py-2">
        <button
          onClick={() => router.push("/")}
          className="p-2 -ml-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
          aria-label="Back to home"
        >
          <IconChevronLeft className="w-6 h-6" />
        </button>

        <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Create Account
        </h1>

        <button
          onClick={toggleTheme}
          className="p-2 -mr-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
          aria-label="Toggle theme"
        >
          {isDark ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Form Container */}
      <main className="w-full max-w-md mx-auto my-auto py-6 space-y-6">
        {/* Title Heading */}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
            Create an account to start reading
          </h2>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input Field */}
          <div className="relative rounded-2xl border border-zinc-300 dark:border-zinc-800 focus-within:border-zinc-900 dark:focus-within:border-zinc-100 focus-within:ring-1 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-100 px-4 py-2.5 transition-all bg-white dark:bg-zinc-900 shadow-sm h-[56px] flex flex-col justify-center">
            <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alexsmith.mobbin@gmail.com"
              className="w-full text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 bg-transparent focus:outline-none"
            />
          </div>

          {/* Password Input Field */}
          <div className="relative rounded-2xl border border-zinc-300 dark:border-zinc-800 focus-within:border-zinc-900 dark:focus-within:border-zinc-100 focus-within:ring-1 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-100 px-4 py-2.5 transition-all bg-white dark:bg-zinc-900 shadow-sm h-[56px] flex items-center justify-between">
            <div className="flex flex-col justify-center flex-1">
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 bg-transparent focus:outline-none pr-3"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:underline select-none ml-2"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Confirm Password Input Field */}
          <div className="relative rounded-2xl border border-zinc-300 dark:border-zinc-800 focus-within:border-zinc-900 dark:focus-within:border-zinc-100 focus-within:ring-1 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-100 px-4 py-2.5 transition-all bg-white dark:bg-zinc-900 shadow-sm h-[56px] flex flex-col justify-center">
            <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 bg-transparent focus:outline-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="w-full h-[52px] rounded-full bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-bold shadow-md transition-all duration-200 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />
            ) : (
              "Sign up"
            )}
          </button>
        </form>

        {/* Divider "or" */}
        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
          <span className="bg-white dark:bg-zinc-950 px-4 text-xs font-medium text-zinc-400 dark:text-zinc-500 absolute">
            or
          </span>
        </div>

        {/* Google Auth Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-[52px] rounded-full bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 text-sm font-semibold shadow-sm transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-3 px-4"
        >
          <IconGoogle className="w-5 h-5 flex-shrink-0" />
          <span>Continue with Google</span>
        </button>

        {/* Bottom Navigation Link */}
        <div className="text-center pt-4 text-xs text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-zinc-900 dark:text-zinc-100 hover:underline"
          >
            Log in
          </Link>
        </div>
      </main>

      <footer className="w-full max-w-md mx-auto py-2 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
        &copy; {new Date().getFullYear()} Manga Verse. All rights reserved.
      </footer>
    </div>
  );
}