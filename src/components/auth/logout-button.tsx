"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/Button";
import { ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";

export function LogoutButton() {
  const { signOut } = useAuth();

  return (
    <Button
      variant="ghost"
      onClick={() => signOut()}
      className="w-full flex items-center justify-center gap-2 text-red-400 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:text-red-300"
    >
      <ArrowLeftOnRectangleIcon className="h-5 w-5" />
      Keluar dari Akun
    </Button>
  );
}
