import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2, LogOut, User } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error("Login error:", error);
        if (error.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const handleCopyPrincipal = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!identity) return;
    const principal = identity.getPrincipal().toString();
    try {
      await navigator.clipboard.writeText(principal);
      setCopied(true);
      toast.success("Principal copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy principal.");
    }
  };

  if (isAuthenticated && identity) {
    const principal = identity.getPrincipal().toString();
    const truncated = `${principal.slice(0, 5)}…${principal.slice(-4)}`;

    return (
      <div className="flex flex-col items-end gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAuth}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
        <div className="flex items-center gap-1 group">
          <span
            className="text-[10px] font-mono text-muted-foreground/60 leading-none select-all cursor-default"
            title={principal}
          >
            {truncated}
          </span>
          <button
            type="button"
            onClick={handleCopyPrincipal}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-primary"
            title="Copy full principal"
          >
            {copied ? (
              <Check className="h-2.5 w-2.5 text-green-500" />
            ) : (
              <Copy className="h-2.5 w-2.5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleAuth}
      disabled={isLoggingIn}
      className="gap-2"
    >
      {isLoggingIn ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <User className="h-4 w-4" />
      )}
      {isLoggingIn ? "Logging in..." : "Login"}
    </Button>
  );
}
