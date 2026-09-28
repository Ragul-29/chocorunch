import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, AlertCircle, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth-shell";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { safeRedirect } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — Chocorunch" },
      { name: "description", content: "Sign up for Chocorunch to order handcrafted crunch chocolate, save your details and track orders." },
      { property: "og:title", content: "Create your account — Chocorunch" },
      { property: "og:description", content: "Sign up for Chocorunch to order handcrafted crunch chocolate, save your details and track orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : undefined,
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const dest = safeRedirect(search.redirect, "/");

  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const validate = () => {
    if (fullName.trim().length < 2) return "Please enter your full name.";
    if (!/^[0-9]{10}$/.test(mobile.replace(/\D/g, ""))) return "Enter a valid 10-digit mobile number.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Enter a valid email address.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password !== confirm) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    setError(problem);
    if (problem) return;

    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim(), mobile: mobile.replace(/\D/g, ""), dob: dob || "" },
      },
    });
    setSubmitting(false);

    if (signUpError) {
      setError(
        signUpError.message.toLowerCase().includes("already registered")
          ? "That email already has an account. Try logging in instead."
          : signUpError.message,
      );
      return;
    }

    if (data.session) {
      toast.success("Account created. Welcome to Chocorunch!");
      navigate({ to: dest, replace: true });
      return;
    }

    setCheckEmail(true);
  };

  if (checkEmail) {
    return (
      <AuthShell
        title="Confirm your email"
        subtitle="One last crunchy step."
        footer={
          <Link to="/" search={{}} className="font-bold text-primary hover:underline">
            Back to log in
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-secondary/60 p-6 text-center">
          <MailCheck className="h-10 w-10 text-primary" />
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to <span className="font-semibold text-foreground">{email}</span>. Click it to
            activate your account, then log in.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Save your details, check out faster, track every order."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/" search={{ redirect: search.redirect }} className="font-bold text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" autoComplete="name" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobile">Mobile number</Label>
          <Input id="mobile" type="tel" inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dob">
            Date of birth <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id="dob" type="date" autoComplete="bday" value={dob} onChange={(e) => setDob(e.target.value)} />
          <p className="text-xs font-medium text-muted-foreground">🎂 Unlocks ₹50 OFF on orders above ₹299 in your birthday month.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput id="password" autoComplete="new-password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <PasswordInput id="confirm" autoComplete="new-password" placeholder="Re-enter password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
        </div>

        <Button type="submit" size="lg" disabled={submitting} className="btn-3d w-full rounded-full font-bold">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
