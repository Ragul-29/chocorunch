import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const REMEMBER_KEY = "chocorunch:remember-email";
export const OAUTH_REDIRECT_KEY = "chocorunch:oauth-redirect";

/** The single Chocorunch login form — used by the /login page and the Explore Menu popup. */
export function LoginForm({
  dest,
  onSuccess,
  showSignupLink = true,
}: {
  dest: string;
  onSuccess?: () => void;
  showSignupLink?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);

    if (signInError) {
      setError(
        signInError.message.toLowerCase().includes("invalid login")
          ? "Wrong email or password. Please try again."
          : signInError.message,
      );
      return;
    }

    if (remember) localStorage.setItem(REMEMBER_KEY, email.trim());
    else localStorage.removeItem(REMEMBER_KEY);

    toast.success("Welcome back to Chocorunch!");
    onSuccess?.();
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    sessionStorage.setItem(OAUTH_REDIRECT_KEY, dest);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setGoogleLoading(false);
      setError(result.error.message || "Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
          Remember me
        </label>
        <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="btn-3d w-full rounded-full font-bold">
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in…
          </>
        ) : (
          "Log in"
        )}
      </Button>

      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="secondary"
        size="lg"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="w-full rounded-full font-bold"
      >
        {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Continue with Google
      </Button>

      {showSignupLink && (
        <p className="pt-1 text-center text-sm text-muted-foreground">
          New to Chocorunch?{" "}
          <Link to="/signup" search={{}} className="font-bold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      )}
    </form>
  );
}
