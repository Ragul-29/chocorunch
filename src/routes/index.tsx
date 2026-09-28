import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { LoginForm, OAUTH_REDIRECT_KEY } from "@/components/login-form";
import { useAuth, safeRedirect } from "@/lib/auth";
import logoAsset from "@/assets/chocorunch-logo.asset.json";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Log in — Chocorunch" },
      {
        name: "description",
        content: "Log in to Chocorunch to explore the menu, build your box and order handcrafted crunch chocolate.",
      },
      { property: "og:title", content: "Log in — Chocorunch" },
      {
        property: "og:description",
        content: "Log in to Chocorunch to explore the menu, build your box and order handcrafted crunch chocolate.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : undefined,
  }),
  component: LoginLanding,
});

function LoginLanding() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { user, loading } = useAuth();
  const dest = safeRedirect(search.redirect, "/home");

  // Never flash the login card for a signed-in user — go straight through.
  useEffect(() => {
    if (loading || !user) return;
    const stored = sessionStorage.getItem(OAUTH_REDIRECT_KEY);
    sessionStorage.removeItem(OAUTH_REDIRECT_KEY);
    navigate({ to: safeRedirect(stored ?? dest, "/home"), replace: true });
  }, [loading, user, dest, navigate]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        className="glow-pulse pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--mint)" }}
      />
      <div
        className="glow-pulse pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--pink)" }}
      />

      <div className="scene-3d relative w-full max-w-md">
        <div className="clay p-6 sm:p-9">
          <div className="mb-6 flex flex-col items-center gap-4 text-center">
            <div className="relative flex items-center justify-center">
              <span className="spin-slow absolute h-44 w-44 rounded-full border-4 border-dashed border-[var(--peach)]/70 sm:h-52 sm:w-52" />
              <span
                className="glow-pulse absolute h-40 w-40 rounded-full blur-2xl sm:h-48 sm:w-48"
                style={{ background: "var(--caramel)" }}
              />
              <img
                src={logoAsset.url}
                alt="Chocorunch"
                width={208}
                height={208}
                className="float-3d logo-3d relative h-40 w-40 rounded-full object-cover ring-4 ring-[var(--gold)]/70 sm:h-52 sm:w-52"
              />
            </div>
            <div>
              <p className="font-display text-3xl font-extrabold tracking-tight text-primary">Chocorunch</p>
              <p className="text-sm font-semibold text-[var(--pink)]">Dip &amp; Crunch, delivered!</p>
            </div>
          </div>

          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Log in to explore the menu and order your crunch.</p>

          <div className="mt-6">
            <LoginForm dest={dest} onSuccess={() => navigate({ to: dest, replace: true })} showSignupLink={false} />
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          New to Chocorunch?{" "}
          <Link to="/signup" search={{ redirect: search.redirect }} className="font-bold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
