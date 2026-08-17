"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconChevronLeft,
  IconDotsHorizontal,
  IconUser,
  IconBookmark,
  IconClock,
  IconPlay,
  IconSettings,
} from "@/components/ui/Icons";
import { useBookmark } from "@/hooks/useBookmark";
import { useReadingHistory } from "@/hooks/useReadingHistory";
import { useAuthContext } from "@/context/AuthContext";

import {
  getSavedAvatar,
  getSavedBanner,
  getSavedDisplayName,
  syncUserProfileWithFirestore,
  saveUserAvatar,
} from "@/lib/userDefaults";

export default function ProfilePage() {
  const { bookmarks } = useBookmark();
  const { history } = useReadingHistory();
  const { user, logout } = useAuthContext();
  const router = useRouter();

  const userKey = user?.uid || "guest";

  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "bookmarks">("history");
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [customName, setCustomName] = useState<string | null>(null);

  useEffect(() => {
    const refreshProfile = () => {
      setBannerUrl(getSavedBanner(user?.uid));
      setAvatarUrl(getSavedAvatar(user?.uid, user?.photoURL));
      setCustomName(getSavedDisplayName(user?.uid, user?.displayName, user?.email));
    };

    refreshProfile();

    if (user?.uid) {
      syncUserProfileWithFirestore(user.uid).then(refreshProfile);
    }

    if (typeof window !== "undefined") {
      window.addEventListener("manga_user_profile_updated", refreshProfile);
      return () => window.removeEventListener("manga_user_profile_updated", refreshProfile);
    }
  }, [user]);

  // Direct Gallery Upload handler for Profile Picture (PP)
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

  const handleLogout = async () => {
    setShowSettingsMenu(false);
    await logout();
    router.push("/login");
  };

  const finalAvatar = avatarUrl || user?.photoURL;
  const finalBanner = bannerUrl;
  const finalName = customName || user?.displayName || user?.email?.split("@")[0] || "Guest Reader";

  return (
    <div className="max-w-xl mx-auto pt-2 pb-24 text-zinc-900 dark:text-zinc-100 font-sans">
      <div className="relative bg-white dark:bg-zinc-900/90 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden backdrop-blur-xl">
        {/* Cover Banner */}
        <div className="relative w-full h-44 sm:h-52 bg-gradient-to-r from-zinc-800 via-zinc-900 to-black overflow-hidden">
          {finalBanner ? (
            <Image
              src={finalBanner}
              alt="Profile Banner"
              fill
              priority
              className="object-cover brightness-90 transition-all duration-500"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-700/30 via-zinc-900 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 z-20 p-2.5 rounded-full bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 backdrop-blur-md shadow-md transition-all active:scale-95 border border-white/20 dark:border-zinc-700"
            aria-label="Back"
          >
            <IconChevronLeft className="w-5 h-5" />
          </button>

          {/* Three-Dots Menu */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => setShowSettingsMenu((p) => !p)}
              className="absolute top-0 right-0 p-2.5 rounded-full bg-white/80 dark:bg-zinc-900/80 hover:bg-white dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 backdrop-blur-md shadow-md transition-all active:scale-95 border border-white/20 dark:border-zinc-700"
              aria-label="Settings Menu"
            >
              <IconDotsHorizontal className="w-5 h-5" />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 mt-12 w-52 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-2 z-50 space-y-1">
                <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Profile Menu</p>
                  <p className="text-[11px] text-zinc-400 truncate">{user?.email || "Guest"}</p>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setShowSettingsMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <IconSettings className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  <span>Settings</span>
                </Link>

                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors text-left"
                  >
                    <IconUser className="w-4 h-4 text-red-500" />
                    <span>Log out</span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setShowSettingsMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <IconUser className="w-4 h-4" />
                    <span>Log in</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-4">
          {/* Direct Gallery Upload Trigger on PP Avatar Click */}
          <label
            htmlFor="profile-avatar-file-input"
            className="relative inline-block -mt-14 sm:-mt-16 mb-3 cursor-pointer group"
            title="Click PP to upload photo directly from gallery"
          >
            <input
              id="profile-avatar-file-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarFileChange}
              className="hidden"
            />
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white dark:border-zinc-900 shadow-xl bg-zinc-900 flex items-center justify-center transition-transform group-hover:scale-105">
              {finalAvatar ? (
                <Image src={finalAvatar} alt={finalName} fill className="object-cover" unoptimized />
              ) : (
                <IconUser className="w-12 h-12 text-white" />
              )}
              {/* Camera Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-[10px] font-black tracking-wider uppercase bg-black/60 px-2 py-0.5 rounded-full">
                  📷 Gallery
                </span>
              </div>
            </div>
            <span className="absolute bottom-1 right-1 w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 shadow-sm" />
          </label>

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
                {finalName}
              </h1>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                {user ? `@${user.email?.split("@")[0]}` : "@reader"}
              </p>
              {user?.email && <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{user.email}</p>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-zinc-200 dark:border-zinc-800 flex gap-6">
          {(["history", "bookmarks"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-extrabold transition-all relative capitalize ${
                activeTab === tab
                  ? "text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {tab === "history" ? `History Read (${history.length})` : `Bookmarks (${bookmarks.length})`}
              {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-zinc-100 rounded-full" />}
            </button>
          ))}
        </div>

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="p-6 space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-12">
                <IconClock className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No reading history yet</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Chapters you read will appear here.</p>
              </div>
            ) : (
              history.map((item, idx) => (
                <div
                  key={item.contentId ? `${item.contentId}-${idx}` : `hist-${idx}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/70 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative w-12 h-16 rounded-xl overflow-hidden bg-zinc-200 flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
                      <Image
                        src={item.cover || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80"}
                        alt={item.title || "Manga Cover"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-zinc-100 truncate">{item.title}</h3>
                      <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">{item.lastChapterRead || "Last Chapter"}</p>
                      <div className="w-32 sm:w-40 mt-1.5">
                        <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                          <div className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100" style={{ width: `${item.progress || 50}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/chapter/${item.lastChapterId}?mangaId=${item.contentId}&page=${item.currentPage || 1}`}
                    className="p-2.5 rounded-full bg-zinc-900 dark:bg-white hover:bg-black dark:hover:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm transition-transform hover:scale-105 flex-shrink-0 ml-2"
                  >
                    <IconPlay className="w-4 h-4 fill-current" />
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {/* Bookmarks Tab */}
        {activeTab === "bookmarks" && (
          <div className="p-6">
            {bookmarks.length === 0 ? (
              <div className="text-center py-12">
                <IconBookmark className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Bookmark list is empty</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Bookmark your favorite manga to view them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {bookmarks.map((item) => (
                  <Link key={item.contentId} href={`/manga/${item.contentId}`} className="group flex flex-col">
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 group-hover:border-zinc-400 transition-all">
                      <Image
                        src={item.cover || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80"}
                        alt={item.title || "Manga Cover"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    </div>
                    <h4 className="mt-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.title}</h4>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
