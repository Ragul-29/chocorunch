import { useMemo, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/products";
import { prizes, SPIN_MIN_SUBTOTAL, useReward, type Prize } from "@/lib/reward";

const SEG = 360 / prizes.length;

/** Conic gradient built from the prize colours. */
function useWheelBackground() {
  return useMemo(
    () =>
      `conic-gradient(${prizes
        .map((p, i) => `${p.color} ${i * SEG}deg ${(i + 1) * SEG}deg`)
        .join(", ")})`,
    [],
  );
}

export function SpinWheelCard() {
  const { subtotal } = useCart();
  const { prize, voucher, hasSpun, recordSpin } = useReward();
  const [open, setOpen] = useState(false);
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Prize | null>(null);
  const bg = useWheelBackground();

  const unlocked = subtotal >= SPIN_MIN_SUBTOTAL;
  const remaining = Math.max(0, SPIN_MIN_SUBTOTAL - subtotal);

  const spin = () => {
    if (spinning || hasSpun || !unlocked) return;
    setSpinning(true);
    setResult(null);
    const index = Math.floor(Math.random() * prizes.length);
    // Land the chosen segment's centre under the top pointer.
    const target = 360 * 6 + (360 - (index * SEG + SEG / 2));
    setAngle((a) => a + (target - (a % 360)));
    window.setTimeout(() => {
      const won = prizes[index]!;
      setResult(won);
      recordSpin(won);
      setSpinning(false);
      toast.success(`You won ${won.label}! 🎉`);
    }, 4200);
  };

  return (
    <section className="mb-12">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <h2 className="font-display text-2xl font-extrabold text-foreground">Spin &amp; Win</h2>
      </div>

      <div className="scene-3d">
        <div className="clay shine tilt-3d flex flex-col items-center gap-5 p-6 sm:flex-row sm:gap-8 sm:p-8">
          {/* Mini 3D wheel preview */}
          <div className="wheel-scene shrink-0">
            <div
              className="wheel-disc float-3d h-28 w-28 sm:h-36 sm:w-36"
              style={{ background: bg }}
            >
              <span className="wheel-hub text-xl">🎡</span>
            </div>
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h3 className="font-display text-xl font-extrabold text-primary sm:text-2xl">
              One free spin per order
            </h3>
            <p className="mt-1.5 font-medium text-muted-foreground">
              {prize
                ? `You already won ${prize.label} — it's applied to this order.`
                : unlocked
                  ? "Your cart qualifies! Spin the wheel for an instant reward."
                  : `Add ${formatINR(remaining)} more to unlock your spin (min ${formatINR(SPIN_MIN_SUBTOTAL)}).`}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
              {prizes.map((p) => (
                <span
                  key={p.id}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs font-bold text-foreground/80"
                  style={{ backgroundColor: p.color }}
                >
                  {p.emoji} {p.short}
                </span>
              ))}
            </div>
            {voucher && (
              <p className="mt-3 text-sm font-bold text-primary">
                🎟️ ₹40 voucher from your last order will be applied at checkout.
              </p>
            )}
            <Button
              className="btn-3d mt-5 w-full gap-2 rounded-full font-bold sm:w-auto"
              disabled={!unlocked || hasSpun}
              onClick={() => setOpen(true)}
            >
              {hasSpun ? (
                <>Spin used for this order</>
              ) : unlocked ? (
                <>
                  <Sparkles className="h-4 w-4" /> Spin the wheel
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Locked
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={(o) => !spinning && setOpen(o)}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-center text-2xl font-extrabold text-primary">
              Spin &amp; Win
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-5 pb-2">
            <div className="wheel-scene relative">
              <span className="wheel-pointer" aria-hidden />
              <div
                className="wheel-disc h-56 w-56 sm:h-64 sm:w-64"
                style={{
                  background: bg,
                  transform: `rotate(${angle}deg)`,
                  transition: "transform 4s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {prizes.map((p, i) => (
                  <span
                    key={p.id}
                    className="wheel-label font-extrabold uppercase tracking-tight text-center leading-tight"
                    style={{
                      transform: `rotate(${i * SEG + SEG / 2}deg) translateY(-36%)`,
                      fontSize: "0.7rem",
                      width: "5.5rem",
                      color: "#3a1f12",
                      textShadow: "0 1px 1px rgba(255,255,255,0.55)",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {p.emoji}
                    {"\n"}
                    {p.short}
                  </span>
                ))}
                <span className="wheel-hub text-2xl">🍫</span>
              </div>
            </div>

            {result ? (
              <div className="pop-in text-center">
                <p className="font-display text-lg font-extrabold text-foreground">
                  {result.emoji} You won {result.label}!
                </p>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  {result.id === "next40"
                    ? "Saved as a voucher for your next order."
                    : "Automatically applied to your cart."}
                </p>
                <Button
                  className="btn-3d mt-4 rounded-full font-bold"
                  onClick={() => setOpen(false)}
                >
                  Awesome, continue
                </Button>
              </div>
            ) : (
              <Button
                size="lg"
                className="btn-3d w-full rounded-full font-bold"
                onClick={spin}
                disabled={spinning || hasSpun}
              >
                {spinning ? "Spinning…" : "Spin now"}
              </Button>
            )}
            <p className="text-center text-xs text-muted-foreground">
              One spin per order · unlocked at {formatINR(SPIN_MIN_SUBTOTAL)}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
