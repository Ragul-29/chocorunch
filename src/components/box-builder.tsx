import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import {
  dips,
  mainItems,
  miniBoxItems,
  formatINR,
  type Choice,
  type MainItem,
  type Product,
} from "@/lib/products";

export type BuilderConfig = {
  id: string;
  title: string;
  emoji: string;
  basePrice: number;
  /** Number of main items to choose. 0 = a fixed main item (single product). */
  mainCount: number;
  /** For single products: the pre-selected main item id. */
  fixedMainId?: string;
};

type StepKind = "mains" | "dip" | "review";

function toggle<T extends { id: string }>(list: T[], item: T, max: number): T[] {
  const exists = list.some((x) => x.id === item.id);
  if (exists) return list.filter((x) => x.id !== item.id);
  if (list.length >= max) return list;
  return [...list, item];
}

export function BoxBuilder({
  config,
  open,
  onOpenChange,
}: {
  config: BuilderConfig | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { add } = useCart();
  const [step, setStep] = useState(0);
  const [mains, setMains] = useState<MainItem[]>([]);
  const [dip, setDip] = useState<Choice | null>(null);

  const steps = useMemo<StepKind[]>(() => {
    if (!config) return [];
    const s: StepKind[] = [];
    if (config.mainCount > 0) s.push("mains");
    s.push("dip");
    s.push("review");
    return s;
  }, [config]);

  if (!config) return null;

  const reset = () => {
    setStep(0);
    setMains([]);
    setDip(null);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const total = config.basePrice;

  const canAdvance = (() => {
    switch (current) {
      case "mains":
        return mains.length === config.mainCount;
      case "dip":
        return dip !== null;
      default:
        return true;
    }
  })();

  const finish = () => {
    const mainList = config.mainCount > 0 ? mains.map((m) => m.name) : [];
    const parts = [
      ...(mainList.length ? [`Items: ${mainList.join(", ")}`] : []),
      dip ? `Dip: ${dip.name}` : "",
    ].filter(Boolean);

    const product: Product = {
      id: `${config.id}-${Date.now()}`,
      name: config.title,
      description: parts.join(" · "),
      price: total,
      emoji: config.emoji,
    };
    add(product);
    toast.success(`${config.title} added to cart 🎉`);
    handleOpenChange(false);
  };

  const stepTitle: Record<StepKind, string> = {
    mains: `Choose any ${config.mainCount} main items`,
    dip: "Choose 1 chocolate dip",
    review: "Review your creation",
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            <span className="mr-2 text-3xl">{config.emoji}</span>
            {config.title}
          </DialogTitle>
          <DialogDescription>{stepTitle[current]}</DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        <div className="mb-2 flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                      ? "bg-[var(--pink)] text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              {i < steps.length - 1 && (
                <span className={`h-1 flex-1 rounded-full ${i < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step body — re-keyed so the 3D flip replays each step */}
        <div key={step} className="step-flip scene-3d min-h-[16rem] py-2">
          {current === "mains" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[...mainItems.filter((m) => m.inBox !== false), ...miniBoxItems].map((m) => {
                const active = mains.some((x) => x.id === m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMains((prev) => toggle(prev, m, config.mainCount))}
                    className={`chip-3d relative flex flex-col items-center gap-1 rounded-2xl p-3 text-center ${
                      active ? "ring-2 ring-primary" : ""
                    }`}
                    style={{ backgroundColor: m.color }}
                  >
                    {active && (
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <span className="text-3xl">{m.emoji}</span>
                    <span className="text-xs font-bold leading-tight text-primary">{m.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {current === "dip" && (
            <div className="grid grid-cols-3 gap-3">
              {dips.map((d) => {
                const active = dip?.id === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDip(d)}
                    className={`chip-3d relative flex flex-col items-center gap-1.5 rounded-2xl p-4 ${
                      active ? "ring-2 ring-primary" : ""
                    }`}
                    style={{ backgroundColor: d.color }}
                  >
                    {active && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <span className="text-4xl">{d.emoji}</span>
                    <span className="text-sm font-bold text-primary">{d.name}</span>
                  </button>
                );
              })}
            </div>
          )}


          {current === "review" && (
            <div className="clay tilt-3d mx-auto max-w-md space-y-4 p-6">
              <div className="flex items-center justify-center gap-3 text-5xl">
                {config.emoji}
                {mains.slice(0, 4).map((m) => (
                  <span key={m.id} className="text-3xl">{m.emoji}</span>
                ))}
              </div>
              {config.mainCount > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Main items</p>
                  <p className="font-medium">{mains.map((m) => m.name).join(", ")}</p>
                </div>
              )}
              {dip && (
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Dip</p>
                  <p className="font-medium">{dip.emoji} {dip.name}</p>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="font-display text-lg font-bold">Total</span>
                <span className="font-display text-2xl font-extrabold text-primary">
                  {formatINR(total)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="mt-2 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            className="rounded-full font-bold"
            onClick={() => (step === 0 ? handleOpenChange(false) : setStep((s) => s - 1))}
          >
            <ChevronLeft className="h-4 w-4" /> {step === 0 ? "Cancel" : "Back"}
          </Button>
          {isLast ? (
            <Button className="btn-3d rounded-full font-bold" onClick={finish}>
              <Sparkles className="h-4 w-4" /> Add to cart · {formatINR(total)}
            </Button>
          ) : (
            <Button
              className="btn-3d rounded-full font-bold"
              disabled={!canAdvance}
              onClick={() => setStep((s) => s + 1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}