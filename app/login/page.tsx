"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

type Mode = "signin" | "signup";

function authErrorMessage(err: unknown): string {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: unknown }).code)
      : "";
  switch (code) {
    case "auth/invalid-email":
      return "כתובת אימייל לא תקינה.";
    case "auth/email-already-in-use":
      return "כבר קיים חשבון עם האימייל הזה. נסה להתחבר.";
    case "auth/weak-password":
      return "הסיסמה חלשה מדי — לפחות 6 תווים.";
    case "auth/missing-password":
      return "יש להזין סיסמה.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "אימייל או סיסמה שגויים.";
    case "auth/too-many-requests":
      return "יותר מדי ניסיונות. נסה שוב בעוד כמה דקות.";
    case "auth/network-request-failed":
      return "בעיית רשת. בדוק את החיבור ונסה שוב.";
    default:
      return "אירעה שגיאה בהתחברות. נסה שוב.";
  }
}

export default function LoginPage() {
  const {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
  } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/chat");
    }
  }, [user, loading, router]);

  const handleGoogle = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("יש להזין כתובת אימייל.");
      return;
    }
    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(cleanEmail, password);
      } else {
        await signInWithEmail(cleanEmail, password);
      }
      // onAuthStateChanged → useEffect redirects to /chat.
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setNotice(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("הזן קודם את כתובת האימייל, ואז לחץ 'שכחתי סיסמה'.");
      return;
    }
    setBusy(true);
    try {
      await sendPasswordReset(cleanEmail);
      setNotice("שלחנו קישור לאיפוס סיסמה לאימייל שלך. בדוק גם בתיקיית הספאם.");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError(null);
    setNotice(null);
  };

  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted">טוען...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-md sm:p-8">
        <div className="mb-7 text-center">
          <div className="mb-4 flex justify-center">
            <svg viewBox="0 0 56 56" className="h-14 w-14" aria-hidden>
              <rect width="56" height="56" rx="16" fill="var(--accent)" />
              <path
                d="M16 21h24M28 21v18"
                stroke="#fff"
                strokeWidth="3.4"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-semibold">עוזר מיסוי לעסקים</h1>
          <p className="text-sm text-muted">
            {mode === "signup"
              ? "צור חשבון חדש כדי להתחיל"
              : "התחבר כדי להמשיך לצ'אט"}
          </p>
        </div>

        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">אימייל</span>
            <input
              type="email"
              dir="ltr"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="rounded-xl border border-border bg-white px-4 py-3 text-left outline-none transition-colors focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">סיסמה</span>
            <input
              type="password"
              dir="ltr"
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="לפחות 6 תווים"
              className="rounded-xl border border-border bg-white px-4 py-3 text-left outline-none transition-colors focus:border-accent"
            />
          </label>

          {mode === "signin" && (
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={busy}
              className="self-start text-xs text-accent hover:underline disabled:opacity-50"
            >
              שכחתי סיסמה
            </button>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 rounded-xl bg-accent px-4 py-3 font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {busy
              ? "רגע..."
              : mode === "signup"
                ? "הרשמה"
                : "התחברות"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-center text-sm text-red-600">{error}</p>
        )}
        {notice && (
          <p className="mt-4 text-center text-sm text-green-700">{notice}</p>
        )}

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted">או</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-white px-4 py-3.5 font-medium transition-colors hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-50"
        >
          <GoogleIcon />
          המשך עם Google
        </button>

        <p className="mt-6 text-center text-sm text-muted">
          {mode === "signup" ? "כבר יש לך חשבון?" : "אין לך חשבון עדיין?"}{" "}
          <button
            type="button"
            onClick={switchMode}
            className="font-medium text-accent hover:underline"
          >
            {mode === "signup" ? "התחברות" : "הרשמה"}
          </button>
        </p>

        <p className="mt-5 text-center text-xs leading-relaxed text-muted">
          בהתחברות אתה מסכים ל
          <Link href="/terms" className="text-accent hover:underline">
            תנאי השימוש
          </Link>{" "}
          ול
          <Link href="/privacy" className="text-accent hover:underline">
            מדיניות הפרטיות
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
