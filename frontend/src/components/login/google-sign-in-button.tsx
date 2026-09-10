import { useEffect, useRef, useState } from "react";
import { continueWithGoogle } from "@/lib/api.js";

type GoogleCredentialResponse = { credential?: string };

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
      renderButton: (element: HTMLElement, options: Record<string, string | number>) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

function isAdminUser(user: { roles?: string[] }) {
  return user.roles?.some((role) => ["admin", "super_admin", "inventory_manager", "order_manager"].includes(role));
}

export function GoogleSignInButton({ registration = false }: { registration?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !containerRef.current) return;

    const renderGoogleButton = () => {
      if (!window.google || !containerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          if (!credential) return;
          try {
            setError("");
            const user = await continueWithGoogle(credential);
            window.location.href = isAdminUser(user) ? "/admin" : "/account";
          }
          catch (googleError) {
            setError(googleError instanceof Error ? googleError.message : "Google sign-in failed. Please try again.");
          }
        },
      });
      containerRef.current.replaceChildren();
      window.google.accounts.id.renderButton(containerRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: registration ? "signup_with" : "signin_with",
        shape: "pill",
        logo_alignment: "left",
        width: Math.min(containerRef.current.clientWidth, 400),
      });
    };

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (window.google) {
      renderGoogleButton();
      return;
    }
    if (existingScript) {
      existingScript.addEventListener("load", renderGoogleButton, { once: true });
      return () => existingScript.removeEventListener("load", renderGoogleButton);
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => setError("Google sign-in could not be loaded. Please check your connection.");
    document.head.appendChild(script);
  }, [clientId, registration]);

  if (!clientId) {
    return <p className="rounded-xl bg-[#fbfaf6] px-4 py-3 text-center text-sm text-[var(--muted)]">Google sign-in will appear after the Google Client ID is configured.</p>;
  }

  return (
    <div>
      <div ref={containerRef} className="flex min-h-11 justify-center" />
      {error ? <p className="mt-3 text-center text-sm font-bold text-red-700">{error}</p> : null}
    </div>
  );
}
