import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Truck, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LoginForm } from "@/components/login-form";
import { BirthdayBanner } from "@/components/birthday-banner";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/chocorunch-logo.asset.json";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Chocorunch — Handcrafted Crunch Chocolate, Delivered" },
      {
        name: "description",
        content:
          "Explore the Chocorunch menu, build your own box and get handcrafted crunch chocolate delivered to your door.",
      },
      { property: "og:title", content: "Chocorunch — Handcrafted Crunch Chocolate, Delivered" },
      {
        property: "og:description",
        content: "Explore the Chocorunch menu, build your own box and get crunch chocolate delivered.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/** Explore Menu — verifies the live session, then opens the menu or the login popup. */
function ExploreMenuButton({ label = "Explore Menu" }: { label?: string }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const handleClick = async () => {
    setChecking(true);
    const { data, error } = await supabase.auth.getUser();
    setChecking(false);
    if (!error && data.user) {
      navigate({ to: "/menu" });
      return;
    }
    setLoginOpen(true);
  };

  return (
    <>
      <Button
        size="lg"
        onClick={handleClick}
        disabled={checking}
        className="btn-3d group rounded-full px-8 text-base font-bold"
      >
        {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {label}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Button>

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <img
              src={logoAsset.url}
              alt="Chocorunch"
              width={112}
              height={112}
              className="float-3d logo-3d h-28 w-28 rounded-full object-cover ring-4 ring-[var(--gold)]/70"
            />
            <DialogTitle className="font-display text-2xl font-extrabold">Log in to continue</DialogTitle>
            <DialogDescription>Sign in and we&apos;ll take you straight to the menu.</DialogDescription>
          </DialogHeader>
          <LoginForm
            dest="/menu"
            onSuccess={() => {
              setLoginOpen(false);
              navigate({ to: "/menu" });
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <BirthdayBanner />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20">
          <div className="scene-3d relative order-1 flex items-center justify-center">
            <div className="glow-pulse absolute h-72 w-72 rounded-full bg-[var(--sky)] blur-3xl sm:h-96 sm:w-96" />
            <div className="spin-slow absolute h-80 w-80 rounded-full border-4 border-dashed border-[var(--peach)]/60 sm:h-[26rem] sm:w-[26rem]" />
            <img
              src={logoAsset.url}
              alt="Chocorunch — Dip & Crunch"
              width={480}
              height={480}
              className="float-3d logo-3d relative w-full max-w-md rounded-full ring-4 ring-[var(--gold)]/70"
            />
          </div>

          <div className="order-2 flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--mint)] px-4 py-1.5 text-sm font-bold text-secondary-foreground shadow-sm">
              <Sparkles className="h-4 w-4" /> Dip &amp; Crunch, delivered!
            </span>
            <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-primary sm:text-6xl">
              The crunch you<br />
              <span className="text-[var(--pink)]">crave</span>, delivered.
            </h1>
            <p className="max-w-md text-lg font-medium text-muted-foreground">
              Chocorunch is chocolate with an irresistible crunch. Explore the
              menu, build your box, and we&apos;ll bounce it right to your door.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <ExploreMenuButton />
            </div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { icon: Truck, title: "Fast delivery", text: "Freshly packed and shipped to your doorstep.", bg: "var(--mint)" },
            { icon: ShieldCheck, title: "Secure checkout", text: "Pay online safely with a smooth checkout.", bg: "var(--sky)" },
            { icon: Sparkles, title: "Real ingredients", text: "Made with quality chocolate and crisp.", bg: "var(--caramel)" },
          ].map(({ icon: Icon, title, text, bg }) => (
            <div key={title} className="clay tilt-3d pop-in flex items-start gap-3 p-5">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-primary shadow-inner"
                style={{ backgroundColor: bg }}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-display text-lg font-bold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="clay relative overflow-hidden p-10 text-center sm:p-14">
          <h2 className="font-display text-3xl font-extrabold text-primary sm:text-4xl">
            Ready to taste the crunch?
          </h2>
          <p className="mx-auto mt-3 max-w-md font-medium text-muted-foreground">
            Browse our full menu and place your order in minutes.
          </p>
          <Button asChild size="lg" className="btn-3d mt-6 rounded-full px-8 text-base font-bold">
            <Link to="/menu">
              See the Menu <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="mt-6 border-t border-border/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-10 sm:px-6">
          <img
            src={logoAsset.url}
            alt="Chocorunch"
            className="logo-3d h-16 w-16 rounded-full ring-2 ring-[var(--gold)]/70"
            width={64}
            height={64}
          />
          <p className="text-sm font-medium text-muted-foreground">
            © {new Date().getFullYear()} Chocorunch · Dip &amp; Crunch!
          </p>
        </div>
      </footer>
    </div>
  );
}
