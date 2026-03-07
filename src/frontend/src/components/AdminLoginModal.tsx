import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface AdminLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminLoginModal({
  open,
  onOpenChange,
}: AdminLoginModalProps) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminAuth();
  const { identity, login: iiLogin, isLoggingIn } = useInternetIdentity();
  const navigate = useNavigate();

  const isIILoggedIn = !!identity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (passcode.length !== 8) {
      setError("Passcode must be 8 digits");
      return;
    }

    if (!isIILoggedIn) {
      setError(
        "You must also sign in with Internet Identity to perform admin actions (like adding or deleting products).",
      );
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(passcode);
      if (success) {
        onOpenChange(false);
        setPasscode("");
        navigate({ to: "/admin-dashboard" });
      } else {
        setError("Invalid passcode");
      }
    } catch (err: any) {
      console.error("Admin login error:", err);
      setError(err.message || "Failed to authenticate as admin");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Admin Login</DialogTitle>
          <DialogDescription>
            Sign in with Internet Identity and enter your admin passcode
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Internet Identity */}
          <div className="space-y-2">
            <Label>Step 1: Sign in with Internet Identity</Label>
            {isIILoggedIn ? (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                <span>Signed in with Internet Identity</span>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={iiLogin}
                disabled={isLoggingIn}
                data-ocid="admin_login.ii_login.button"
              >
                {isLoggingIn && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Sign in with Internet Identity
              </Button>
            )}
          </div>

          {/* Step 2: Passcode */}
          <div className="space-y-2">
            <Label htmlFor="passcode">Step 2: Admin Passcode</Label>
            <Input
              id="passcode"
              type="password"
              placeholder="Enter 8-digit passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              maxLength={8}
              disabled={isLoading}
              autoFocus={isIILoggedIn}
              data-ocid="admin_login.passcode.input"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setPasscode("");
                setError("");
              }}
              disabled={isLoading}
              data-ocid="admin_login.cancel.button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || passcode.length !== 8 || !isIILoggedIn}
              data-ocid="admin_login.submit.button"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
