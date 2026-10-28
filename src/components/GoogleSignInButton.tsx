import { useEffect, useRef } from "react";
import { GoogleSignIn } from "@capawesome/capacitor-google-sign-in";
import { isNativeApp } from "../lib/native";

// Configured via frontend env: VITE_GOOGLE_CLIENT_ID (the OAuth 2.0 Web client
// id from Google Cloud Console). When it's absent, we render a disabled
// placeholder so the layout is preserved but no broken flow is offered.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as
  | string
  | undefined;
const GSI_SRC = "https://accounts.google.com/gsi/client";

let gsiScriptPromise: Promise<void> | null = null;
let nativeGoogleInitPromise: Promise<void> | null = null;

function initializeNativeGoogle(): Promise<void> {
  if (!GOOGLE_CLIENT_ID) return Promise.reject(new Error("Google sign-in is not configured"));
  if (!nativeGoogleInitPromise) {
    nativeGoogleInitPromise = GoogleSignIn.initialize({ clientId: GOOGLE_CLIENT_ID });
  }
  return nativeGoogleInitPromise;
}

function loadGsiScript(): Promise<void> {
  if ((window as any).google?.accounts?.id) return Promise.resolve();
  if (gsiScriptPromise) return gsiScriptPromise;

  gsiScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${GSI_SRC}"]`,
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google script")),
      );
      return;
    }
    const s = document.createElement("script");
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(s);
  });
  return gsiScriptPromise;
}

/**
 * Renders Google's official "Continue with Google" button (Google Identity
 * Services). On success it hands the ID token (credential) back to the caller,
 * which exchanges it with our backend. Using GIS's rendered button keeps us on
 * the secure ID-token flow with no extra dependency.
 */
export function GoogleSignInButton({
  onCredential,
  onError,
  text = "continue_with",
}: {
  onCredential: (credential: string) => void;
  onError?: (message: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}) {
  const divRef = useRef<HTMLDivElement>(null);

  // Hold the latest callbacks in refs so the init effect can run ONCE — the
  // parent (LoginPage) re-renders periodically (slide timer), which would
  // otherwise re-initialize GIS and re-render the button on every tick.
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  onCredentialRef.current = onCredential;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || isNativeApp()) return;
    let cancelled = false;

    loadGsiScript()
      .then(() => {
        if (cancelled || !divRef.current) return;
        const g = (window as any).google;
        g.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp: any) => {
            if (resp?.credential) onCredentialRef.current(resp.credential);
          },
        });
        const width = Math.min(
          400,
          Math.max(240, divRef.current.offsetWidth || 320),
        );
        g.accounts.id.renderButton(divRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text,
          shape: "pill",
          logo_alignment: "center",
          width,
        });
      })
      .catch(() =>
        onErrorRef.current?.("Could not load Google Sign-In. Please try again."),
      );

    return () => {
      cancelled = true;
    };
  }, [text]);

  if (isNativeApp() && GOOGLE_CLIENT_ID) {
    const label = text === "signin_with" ? "Sign in with Google" : text === "signup_with" ? "Sign up with Google" : "Continue with Google";
    return (
      <button
        type="button"
        onClick={async () => {
          try {
            await initializeNativeGoogle();
            const result = await GoogleSignIn.signIn();
            if (!result.idToken) throw new Error("Google did not return an identity token");
            onCredentialRef.current(result.idToken);
          } catch (error) {
            const message = error instanceof Error ? error.message : "Google sign-in failed. Please try again.";
            if (!/cancel/i.test(message)) onErrorRef.current?.(message);
          }
        }}
        className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 active:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:active:bg-zinc-800"
      >
        <img src="/google-g.svg" className="h-5 w-5" alt="" />
        {label}
      </button>
    );
  }

  if (!GOOGLE_CLIENT_ID) {
    const label =
      text === "signin_with"
        ? "Sign in with Google"
        : text === "signup_with"
          ? "Sign up with Google"
          : "Continue with Google";
    return (
      <button
        type="button"
        disabled
        title="Google sign-in is not configured"
        className="w-full py-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-600 font-bold rounded-full flex items-center justify-center gap-3 opacity-60 cursor-not-allowed"
      >
        <img
          src="/google-g.svg"
          className="w-5 h-5 grayscale"
          alt="Google"
        />
        {label}
      </button>
    );
  }

  return <div ref={divRef} className="flex justify-center" />;
}
