import { Link } from "@tanstack/react-router";
import { Cake, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBirthday, BIRTHDAY_MIN_SUBTOTAL } from "@/lib/birthday";
import { formatINR } from "@/lib/products";

/** Birthday offer banner — shown on Home and Profile. */
export function BirthdayBanner() {
  const { hasDob, available, redeemed, isBirthdayMonth, loading } = useBirthday();

  if (loading) return null;

  if (!hasDob) {
    return (
      <div className="clay tilt-3d flex flex-wrap items-center gap-3 p-4">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-primary shadow-inner"
          style={{ backgroundColor: "var(--pink)" }}
        >
          <Cake className="h-5 w-5" />
        </span>
        <p className="min-w-0 flex-1 text-sm font-semibold text-foreground">
          Add your birthday to unlock a special offer.
        </p>
        <Button asChild size="sm" variant="secondary" className="rounded-full font-bold">
          <Link to="/profile">Add birthday</Link>
        </Button>
      </div>
    );
  }

  if (!isBirthdayMonth) return null;

  return (
    <div className="clay float-3d flex flex-wrap items-center gap-3 p-5">
      <span
        className="glow-pulse flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-primary shadow-inner"
        style={{ backgroundColor: "var(--caramel)" }}
      >
        <Gift className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-extrabold text-primary">
          🎉 Happy Birthday! Your Birthday Offer is Ready.
        </p>
        <p className="text-sm font-medium text-muted-foreground">
          {redeemed
            ? "You've already enjoyed this month's birthday treat — see you next year!"
            : `${formatINR(50)} OFF on orders above ${formatINR(BIRTHDAY_MIN_SUBTOTAL)} · one treat per birthday month.`}
        </p>
      </div>
      {available && (
        <Button asChild size="sm" className="btn-3d rounded-full font-bold">
          <Link to="/menu">Order now</Link>
        </Button>
      )}
    </div>
  );
}