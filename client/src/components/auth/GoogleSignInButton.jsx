import React, { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

const loadGoogleScript = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google);
      return;
    }

    const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google), { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google sign-in"));
    document.head.appendChild(script);
  });

const GoogleSignInButton = ({ onCredential, onError, text = "continue_with" }) => {
  const buttonRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !buttonRef.current) {
      return undefined;
    }

    let isMounted = true;

    loadGoogleScript()
      .then((google) => {
        if (!isMounted || !google?.accounts?.id || !buttonRef.current) {
          return;
        }

        google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => {
            if (credential) {
              onCredential?.(credential);
            } else {
              onError?.("Google sign-in did not return a credential.");
            }
          },
        });

        buttonRef.current.innerHTML = "";
        google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          width: 320,
          text,
        });

        setIsReady(true);
      })
      .catch((error) => {
        onError?.(error.message || "Failed to load Google sign-in.");
      });

    return () => {
      isMounted = false;
    };
  }, [clientId, onCredential, onError, text]);

  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        className="w-full h-12 rounded-xl border border-slate-200 bg-slate-100 text-sm font-medium text-slate-500"
      >
        Google sign-in unavailable
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div ref={buttonRef} className="flex justify-center" />
      {!isReady ? (
        <div className="text-center text-xs text-slate-500">Loading Google sign-in...</div>
      ) : null}
    </div>
  );
};

export default GoogleSignInButton;
