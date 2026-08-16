"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconChevronLeft,
  IconChevronRight,
  IconUser,
  IconSettings,
  IconClock,
} from "@/components/ui/Icons";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

// ─── Icons specific to settings ───────────────────────────────────────────────
function IconLock({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconBell({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconMoon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function IconInfo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function IconMessage({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconTrash({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

// ─── Reusable SettingRow ──────────────────────────────────────────────────────
function SettingRow({
  icon,
  label,
  iconColor = "text-zinc-600 dark:text-zinc-400",
  labelColor = "text-zinc-900 dark:text-zinc-100",
  rightElement,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  iconColor?: string;
  labelColor?: string;
  rightElement?: React.ReactNode;
  onClick?: () => void;
}) {
  const Component = rightElement !== undefined ? "div" : "button";
  return (
    <Component
      onClick={onClick}
      className="w-full flex items-center justify-between py-3.5 px-0 group transition-colors cursor-pointer select-none"
    >
      <div className="flex items-center gap-3.5">
        <span className={`${iconColor}`}>{icon}</span>
        <span className={`text-sm font-semibold ${labelColor}`}>{label}</span>
      </div>
      {rightElement !== undefined ? (
        rightElement
      ) : (
        <IconChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors" />
      )}
    </Component>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      aria-checked={checked}
      role="switch"
      className={`relative w-11 h-6 p-0.5 rounded-full transition-colors duration-300 flex-shrink-0 cursor-pointer ${
        checked ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
      }`}
    >
      <span
        className={`block w-5 h-5 rounded-full bg-white transition-transform duration-300 shadow-md ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── Password Sub-Page ────────────────────────────────────────────────────────
function PasswordPage({ onBack }: { onBack: () => void }) {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!currentPass) { setError("Enter your current password."); return; }
    if (newPass.length < 6) { setError("New password must be at least 6 characters."); return; }
    if (newPass !== confirmPass) { setError("New passwords do not match."); return; }
    setSuccess("Password updated successfully! ✓");
    setCurrentPass(""); setNewPass(""); setConfirmPass("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <IconChevronLeft className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
        </button>
        <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">Change Password</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-medium">{error}</div>}
        {success && <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs font-medium">{success}</div>}

        {[
          { label: "Current Password", value: currentPass, set: setCurrentPass, show: false, type: "password" },
          { label: "New Password", value: newPass, set: setNewPass, show: showNew, type: showNew ? "text" : "password" },
          { label: "Confirm New Password", value: confirmPass, set: setConfirmPass, show: showNew, type: showNew ? "text" : "password" },
        ].map(({ label, value, set, type }, i) => (
          <div key={i} className="rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 h-[56px] flex items-center justify-between">
            <div className="flex flex-col justify-center flex-1">
              <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{label}</label>
              <input
                type={type}
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm font-semibold text-zinc-900 dark:text-zinc-100 bg-transparent focus:outline-none placeholder-zinc-400"
              />
            </div>
            {i === 1 && (
              <button type="button" onClick={() => setShowNew(p => !p)} className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                {showNew ? "Hide" : "Show"}
              </button>
            )}
          </div>
        ))}

        <button
          type="submit"
          className="w-full h-[52px] rounded-full bg-zinc-900 dark:bg-white hover:bg-black dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold shadow-md transition-all mt-2"
        >
          Update Password
        </button>
      </form>
    </div>
  );
}

// ─── Notifications Sub-Page ───────────────────────────────────────────────────
function NotificationsPage({ onBack }: { onBack: () => void }) {
  const [newChapters, setNewChapters] = useState(true);
  const [updates, setUpdates] = useState(false);
  const [promotions, setPromotions] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <IconChevronLeft className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
        </button>
        <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">Notifications</h2>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
        {[
          { label: "New Chapter Releases", desc: "Get notified when bookmarked series update.", value: newChapters, set: setNewChapters },
          { label: "App Updates", desc: "Receive notifications about new features.", value: updates, set: setUpdates },
          { label: "Promotions & Tips", desc: "Helpful reading tips and seasonal content.", value: promotions, set: setPromotions },
        ].map(({ label, desc, value, set }) => (
          <div key={label} className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{desc}</p>
            </div>
            <Toggle checked={value} onChange={() => set(p => !p)} />
          </div>
        ))}
      </div>
    </div>
  );
}

import {
  getSavedAvatar,
  getSavedBanner,
  getSavedDisplayName,
  saveUserAvatar,
  saveUserBanner,
  saveUserName,
  syncUserProfileWithFirestore,
} from "@/lib/userDefaults";

// ─── Profile Details Sub-Page ─────────────────────────────────────────────────
function ProfileDetailsPage({ onBack }: { onBack: () => void }) {
  const { user } = useAuthContext();
  const userKey = user?.uid || "guest";

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      syncUserProfileWithFirestore(user.uid).then(() => {
        setBannerUrl(getSavedBanner(user?.uid));
        setAvatarUrl(getSavedAvatar(user?.uid, user?.photoURL));
        setDisplayName(getSavedDisplayName(user?.uid, user?.displayName, user?.email));
      });
    } else {
      setBannerUrl(getSavedBanner(user?.uid));
      setAvatarUrl(getSavedAvatar(user?.uid, user?.photoURL));
      setDisplayName(getSavedDisplayName(user?.uid, user?.displayName, user?.email));
    }
  }, [user]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result && userKey) {
          setAvatarUrl(result);
          saveUserAvatar(userKey, result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result && userKey) {
          setBannerUrl(result);
          saveUserBanner(userKey, result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (userKey && displayName.trim()) {
      saveUserName(userKey, displayName);
    }

    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  };

  const handleRemoveBanner = () => {
    setBannerUrl(null);
    if (userKey) saveUserBanner(userKey, null);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
    if (userKey) saveUserAvatar(userKey, null);
  };

  const finalAvatar = avatarUrl || user?.photoURL || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <IconChevronLeft className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
        </button>
        <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">Edit Banner & Display Name</h2>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
          Changes saved successfully! ✓
        </div>
      )}

      {/* UPLOAD COVER BANNER FROM GALLERY ONLY */}

      {/* 2. UPLOAD COVER BANNER FROM GALLERY ONLY */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
        <label className="block text-xs font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
          Header Banner Cover (Foto Banner)
        </label>

        {/* Banner Preview */}
        <div className="relative w-full h-28 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-900 flex items-center justify-center">
          {bannerUrl ? (
            <Image src={bannerUrl} alt="Banner Preview" fill className="object-cover" unoptimized />
          ) : (
            <span className="text-xs text-zinc-500">No custom banner uploaded</span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white hover:bg-black dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold shadow-sm cursor-pointer transition-all active:scale-95">
            <span>🖼️ Upload Banner from Gallery</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleBannerFileChange}
              className="hidden"
            />
          </label>

          {bannerUrl && (
            <button
              type="button"
              onClick={handleRemoveBanner}
              className="text-[11px] font-semibold text-red-500 hover:underline"
            >
              Remove banner
            </button>
          )}
        </div>
      </div>

      {/* 2. DISPLAY NAME & EMAIL */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 h-[56px] flex flex-col justify-center transition-colors focus-within:border-zinc-900 dark:focus-within:border-zinc-400">
          <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your Display Name"
            className="w-full text-sm font-semibold text-zinc-900 dark:text-zinc-100 bg-transparent focus:outline-none placeholder-zinc-400"
          />
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2.5 h-[56px] flex flex-col justify-center">
          <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Email Address</label>
          <input
            type="email"
            value={user?.email || ""}
            readOnly
            className="w-full text-sm font-semibold text-zinc-900 dark:text-zinc-100 bg-transparent focus:outline-none disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          className="w-full h-[52px] rounded-full bg-zinc-900 dark:bg-white hover:bg-black dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold shadow-md transition-all mt-2"
        >
          Save All Changes
        </button>
      </form>
    </div>
  );
}

// ─── About Sub-Page ──────────────────────────────────────────────────────────
function AboutPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <IconChevronLeft className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
        </button>
        <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">About Application</h2>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center shadow-sm">
            <span className="text-white dark:text-zinc-900 text-2xl font-black">M</span>
          </div>
          <div>
            <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">Mangafy</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Version 1.0.0</p>
          </div>
        </div>

        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-2">
          {[
            ["Developer", "Mangafy Team"],
            ["Platform", "Next.js 16 (App Router)"],
            ["Data Source", "MangaDex API"],
            ["License", "Private / All Rights Reserved"],
          ].map(([key, val]) => (
            <div key={key} className="flex justify-between">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{key}</span>
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Help / FAQ Sub-Page ──────────────────────────────────────────────────────
function HelpPage({ onBack }: { onBack: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = [
    { q: "How do I bookmark a manga?", a: "Open any manga detail page and tap the bookmark icon button next to the Read Now button." },
    { q: "Why are images not loading?", a: "This can happen due to network restrictions. The app uses mock data as fallback if MangaDex API is blocked by your ISP." },
    { q: "How do I continue reading?", a: "Check your Profile page under 'History Read' tab, or go to the Home page's 'Continue Reading' section." },
    { q: "Is Google Sign-in secure?", a: "Yes! We use Firebase Authentication with Google OAuth 2.0. We never store your Google password." },
    { q: "Can I change my profile photo?", a: "Your profile photo is synced from your Google Account. Change it directly in your Google account settings." },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <IconChevronLeft className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
        </button>
        <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">Help / FAQ</h2>
      </div>

      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <div key={i} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            >
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{faq.q}</span>
              <span className={`text-zinc-400 transition-transform duration-200 ${openIndex === i ? "rotate-90" : ""}`}>
                <IconChevronRight className="w-4 h-4" />
              </span>
            </button>
            {openIndex === i && (
              <div className="px-4 pb-4">
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
type SubPage = "main" | "profile-details" | "password" | "notifications" | "about" | "help";

export default function SettingsPage() {
  const { user, logout } = useAuthContext();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();

  const [subPage, setSubPage] = useState<SubPage>("main");
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [customName, setCustomName] = useState<string | null>(null);

  useEffect(() => {
    setAvatarUrl(getSavedAvatar(user?.uid, user?.photoURL));
    setCustomName(getSavedDisplayName(user?.uid, user?.displayName, user?.email));
  }, [user]);

  const handleDeactivate = async () => {
    await logout();
    router.push("/login");
  };

  const finalAvatar = avatarUrl || user?.photoURL;
  const finalName = customName || user?.displayName || user?.email?.split("@")[0] || "Guest Reader";

  // Sub-pages
  if (subPage === "profile-details") return (
    <div className="max-w-md mx-auto pt-2 pb-24">
      <ProfileDetailsPage onBack={() => setSubPage("main")} />
    </div>
  );
  if (subPage === "password") return (
    <div className="max-w-md mx-auto pt-2 pb-24">
      <PasswordPage onBack={() => setSubPage("main")} />
    </div>
  );
  if (subPage === "notifications") return (
    <div className="max-w-md mx-auto pt-2 pb-24">
      <NotificationsPage onBack={() => setSubPage("main")} />
    </div>
  );
  if (subPage === "about") return (
    <div className="max-w-md mx-auto pt-2 pb-24">
      <AboutPage onBack={() => setSubPage("main")} />
    </div>
  );
  if (subPage === "help") return (
    <div className="max-w-md mx-auto pt-2 pb-24">
      <HelpPage onBack={() => setSubPage("main")} />
    </div>
  );

  // ─── Main Settings List ───────────────────────────────────────────────────
  return (
    <div className="max-w-md mx-auto pt-2 pb-24 space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Back"
        >
          <IconChevronLeft className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
        </button>
        <h1 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Settings</h1>
      </div>

      {/* User Profile Card */}
      <Link
        href="/profile"
        className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
      >
        <div className="flex items-center gap-3.5">
          <div className="relative w-14 h-14 rounded-full overflow-hidden bg-zinc-900 dark:bg-zinc-700 flex items-center justify-center border-2 border-zinc-100 dark:border-zinc-800 flex-shrink-0">
            {finalAvatar ? (
              <Image src={finalAvatar} alt={finalName} fill className="object-cover" unoptimized />
            ) : (
              <IconUser className="w-7 h-7 text-white" />
            )}
          </div>
          <div>
            <p className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              {finalName}
            </p>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
              {user?.email || "Not logged in"}
            </p>
          </div>
        </div>
        <IconChevronRight className="w-5 h-5 text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors" />
      </Link>

      {/* Other Settings Section */}
      <div className="space-y-1.5">
        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider px-1">
          Other settings
        </p>

        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
          {/* Profile Details */}
          <div className="px-4">
            <SettingRow
              icon={<IconUser className="w-5 h-5" />}
              label="Profile details"
              onClick={() => setSubPage("profile-details")}
            />
          </div>

          {/* Password */}
          <div className="px-4">
            <SettingRow
              icon={<IconLock className="w-5 h-5" />}
              label="Password"
              onClick={() => setSubPage("password")}
            />
          </div>

          {/* Notifications */}
          <div className="px-4">
            <SettingRow
              icon={<IconBell className="w-5 h-5" />}
              label="Notifications"
              onClick={() => setSubPage("notifications")}
            />
          </div>

          {/* Dark Mode Toggle */}
          <div className="px-4">
            <SettingRow
              icon={<IconMoon className="w-5 h-5" />}
              label="Dark mode"
              rightElement={<Toggle checked={isDark} onChange={toggleTheme} />}
            />
          </div>
        </div>
      </div>

      {/* About / Help / Danger Section */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
        {/* About */}
        <div className="px-4">
          <SettingRow
            icon={<IconInfo className="w-5 h-5" />}
            label="About application"
            onClick={() => setSubPage("about")}
          />
        </div>

        {/* Help / FAQ */}
        <div className="px-4">
          <SettingRow
            icon={<IconMessage className="w-5 h-5" />}
            label="Help / FAQ"
            onClick={() => setSubPage("help")}
          />
        </div>

        {/* Deactivate Account */}
        <div className="px-4">
          <SettingRow
            icon={<IconTrash className="w-5 h-5 text-red-500" />}
            label="Deactivate my account"
            labelColor="text-red-500 dark:text-red-400"
            iconColor="text-red-500 dark:text-red-400"
            onClick={() => setShowDeactivateConfirm(true)}
          />
        </div>
      </div>

      {/* Deactivate Confirm Dialog */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center mx-auto">
                <IconTrash className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">Deactivate Account?</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                This will log you out and your local reading history and bookmarks will be cleared. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeactivateConfirm(false)}
                className="flex-1 py-3 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                className="flex-1 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-sm transition-all"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
