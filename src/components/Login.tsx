import { useState, useEffect, useCallback } from "react";
import { Timer, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openLogin } from "@/lib/ipc";

interface LoginProps {
  onAuthenticated: () => void;
}

export function Login({ onAuthenticated }: LoginProps) {
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    const cleanup = window.electronAPI.onAuthChange((session) => {
      if (session) {
        onAuthenticated();
      }
    });
    return cleanup;
  }, [onAuthenticated]);

  const handleSignIn = useCallback(async () => {
    setWaiting(true);
    await openLogin();
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center bg-background px-6">
      <div className="flex w-full max-w-xs flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-500 text-white shadow-lg shadow-primary/20">
            <Timer size={32} strokeWidth={2} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Welcome to Clockify
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to start tracking your time
            </p>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full gap-2"
          onClick={handleSignIn}
          disabled={waiting}
        >
          {waiting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Waiting for sign in...
            </>
          ) : (
            <>
              <LogIn size={18} />
              Sign In
            </>
          )}
        </Button>

        {waiting && (
          <p className="text-center text-xs text-muted-foreground">
            Complete sign in in the login window. This page will update
            automatically.
          </p>
        )}
      </div>
    </div>
  );
}
