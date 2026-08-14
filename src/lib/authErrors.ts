/**
 * Maps Firebase Auth error codes to user-friendly Indonesian messages.
 * Usage: catch (err) { setError(getAuthErrorMessage(err)); }
 */

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Email tidak terdaftar atau password salah.",
  "auth/wrong-password": "Password yang Anda masukkan salah.",
  "auth/user-not-found": "Email belum terdaftar. Silakan buat akun baru.",
  "auth/invalid-email": "Format alamat email tidak valid.",
  "auth/email-already-in-use": "Email ini sudah terdaftar. Silakan gunakan menu Login.",
  "auth/weak-password": "Password terlalu lemah, minimal 6 karakter.",
  "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.",
  "auth/user-disabled": "Akun ini telah dinonaktifkan.",
  "auth/network-request-failed": "Koneksi bermasalah. Periksa internet Anda dan coba lagi.",
  "auth/popup-closed-by-user": "Login dibatalkan.",
  "auth/cancelled-popup-request": "Login dibatalkan.",
  "auth/account-exists-with-different-credential":
    "Email ini sudah terdaftar dengan metode login lain.",
};

const DEFAULT_MESSAGE = "Terjadi kesalahan. Silakan coba lagi.";

/**
 * Extracts the Firebase error code (e.g. "auth/wrong-password") from an
 * error object or message string, regardless of shape.
 */
function extractErrorCode(err: any): string | null {
  if (!err) return null;

  // Firebase SDK errors expose `.code` directly, e.g. "auth/wrong-password"
  if (typeof err.code === "string" && err.code.startsWith("auth/")) {
    return err.code;
  }

  // Fallback: some errors only have it embedded in the message,
  // e.g. "Firebase: Error (auth/wrong-password)."
  const match = typeof err.message === "string" ? err.message.match(/auth\/[a-z-]+/) : null;
  return match ? match[0] : null;
}

export function getAuthErrorMessage(err: any): string {
  const code = extractErrorCode(err);
  if (code && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code];
  }
  return DEFAULT_MESSAGE;
}