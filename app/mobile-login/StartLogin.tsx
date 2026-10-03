"use client";
import { useEffect } from "react";
import { signIn } from "next-auth/react";

/** Immediately kicks off Google sign-in; when it finishes NextAuth lands on /api/mobile/token, which returns to the app. */
export default function StartLogin({ redirect }: { redirect: string }) {
  useEffect(() => {
    signIn("google", { callbackUrl: `/api/mobile/token?redirect=${encodeURIComponent(redirect)}` });
  }, [redirect]);
  return <p className="py-24 text-center text-black/50">Redirecting to Google…</p>;
}
