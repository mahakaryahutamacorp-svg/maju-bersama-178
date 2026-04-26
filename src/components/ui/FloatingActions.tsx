"use client";

import { useState, useEffect } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function FloatingActions() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const { user, isOwner, likelySeedStaffEmail } = useAuth();
  
  // Logic to detect if we should show the Owner FAB offset
  const showOwnerFab = !!user && (isOwner || likelySeedStaffEmail);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Update UI notify the user they can install the PWA
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setCanInstall(false);
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  // Stack above the bottom navigation (approx 4.5rem)
  // If owner FAB is present (which is also at 4.5rem and is h-14), 
  // we push our buttons higher (approx 8.5rem).
  const bottomClass = showOwnerFab 
    ? "bottom-[calc(8.5rem+env(safe-area-inset-bottom))]" 
    : "bottom-[calc(4.5rem+env(safe-area-inset-bottom))]";

  return (
    <div className={`fixed ${bottomClass} right-3 z-[70] flex flex-col gap-3 items-end pointer-events-none`}>
      {/* Install Button */}
      {canInstall && (
        <button
          onClick={handleInstallClick}
          className="group pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-amber-500/30 bg-gradient-to-br from-amber-500/90 to-yellow-600/90 text-zinc-950 shadow-[0_4px_12px_rgba(245,158,11,0.3)] backdrop-blur-md transition-all hover:scale-110 hover:brightness-110 active:scale-95"
          aria-label="Install Aplikasi"
        >
          <ArrowDownTrayIcon className="h-5 w-5 stroke-[2.5]" />
          <span className="absolute right-full mr-3 whitespace-nowrap rounded-lg bg-zinc-900/90 px-2 py-1 text-[10px] font-bold tracking-wider text-amber-400 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 border border-amber-500/20 uppercase">
            Install App
          </span>
        </button>
      )}

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/6281211172228"
        target="_blank"
        rel="noopener noreferrer"
        className="group pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-emerald-500/30 bg-gradient-to-br from-emerald-500/90 to-green-600/90 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] backdrop-blur-md transition-all hover:scale-110 hover:brightness-110 active:scale-95"
        aria-label="Chat WhatsApp Admin"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 fill-current"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
        <span className="absolute right-full mr-3 whitespace-nowrap rounded-lg bg-zinc-900/90 px-2 py-1 text-[10px] font-bold tracking-wider text-emerald-400 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 border border-emerald-500/20 uppercase">
          WhatsApp Admin
        </span>
      </a>
    </div>
  );
}
