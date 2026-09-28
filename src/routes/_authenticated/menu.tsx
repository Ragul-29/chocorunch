import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Award, Gift } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BoxBuilder, type BuilderConfig } from "@/components/box-builder";
import { SpinWheelCard } from "@/components/spin-wheel";
import { dips, mainItems, boxTiers, formatINR } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/menu")({
  head: () => ({
    meta: [
      { title: "Menu — Chocorunch" },
      {
        name: "description",
        content: "Browse the Chocorunch menu and add your favourite crunch chocolate to your cart.",
      },
      { property: "og:title", content: "Menu — Chocorunch" },
      { property: "og:description", content: "Browse the Chocorunch menu and order online." },
    ],
  }),
  component: Menu,
});

function Menu() {
  const [config, setConfig] = useState<BuilderConfig | null>(null);
  const [open, setOpen] = useState(false);

  const launch = (c: BuilderConfig) => {
    setConfig(c);
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="mb-10 max-w-xl">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
            Our Menu
          </h1>
          <p className="mt-3 font-medium text-muted-foreground">
            Tap any product on the right to build it step by step — pick your dip
            and drop it in the cart.
          </p>
        </div>

        {/* ---- Main Products ---- */}
        <SpinWheelCard />

        <section className="mb-12">
          <div className="mb-4 flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <h2 className="font-display text-2xl font-extrabold text-foreground">Main Products</h2>
          </div>
          <div className="scene-3d grid gap-4 sm:grid-cols-2">
            {mainItems.filter((m) => m.inMenu !== false).map((m) => (
              <article
                key={m.id}
                className="clay tilt-3d pop-in flex items-center gap-4 p-5"
              >
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl shadow-inner"
                  style={{ backgroundColor: m.color }}
                >
                  {m.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-bold text-foreground">{m.name}</h3>
                    {m.tag && (
                      <Badge className="rounded-full bg-[var(--mint)] font-bold text-secondary-foreground hover:bg-[var(--mint)]">
                        {m.tag}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {dips.map((d) => (
                      <span
                        key={d.id}
                        className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-semibold text-muted-foreground"
                      >
                        {d.emoji} {d.name}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 font-display text-lg font-extrabold text-primary">
                    {formatINR(m.price)}
                  </p>
                </div>
                <Button
                  className="btn-3d shrink-0 gap-1 rounded-full font-bold"
                  onClick={() =>
                    launch({
                      id: m.id,
                      title: m.name,
                      emoji: m.emoji,
                      basePrice: m.price,
                      mainCount: 0,
                      fixedMainId: m.id,
                    })
                  }
                >
                  Choose 1 Dip
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </article>
            ))}
          </div>
        </section>

        {/* ---- Build Your Own Box ---- */}
        <section className="mb-12">
          <div className="mb-4 flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            <h2 className="font-display text-2xl font-extrabold text-foreground">Build Your Own Box</h2>
          </div>
          <div className="scene-3d grid gap-5 md:grid-cols-3">
            {boxTiers.map((b) => (
              <article
                key={b.id}
                className="clay tilt-3d pop-in flex flex-col p-6"
                style={{ backgroundColor: b.color }}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h3 className="font-display text-xl font-extrabold text-primary">
                    <span className="mr-1.5 text-2xl">{b.emoji}</span>
                    {b.name}
                  </h3>
                </div>
                <Badge className="mb-4 w-fit rounded-full bg-card font-bold text-foreground hover:bg-card">
                  {b.badge}
                </Badge>
                <ul className="mb-4 space-y-1.5 text-sm font-medium text-primary">
                  <li>✓ Choose any {b.mainCount} main items</li>
                  <li>✓ Choose 1 chocolate dip</li>
                </ul>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="font-display text-2xl font-extrabold text-primary">
                    {formatINR(b.price)}
                  </span>
                  <Button
                    className="btn-3d gap-1 rounded-full font-bold"
                    onClick={() =>
                      launch({
                        id: b.id,
                        title: b.name,
                        emoji: b.emoji,
                        basePrice: b.price,
                        mainCount: b.mainCount,
                      })
                    }
                  >
                    Build <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

      </main>

      <BoxBuilder config={config} open={open} onOpenChange={setOpen} />
    </div>
  );
}