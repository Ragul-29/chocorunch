import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useCart } from "./cart";
import { useBirthday, BIRTHDAY_MIN_SUBTOTAL, BIRTHDAY_OFFER_LABEL } from "./birthday";

export type Prize = {
  id: string;
  label: string;
  short: string;
  emoji: string;
  color: string;
};

/** Wheel prizes — order defines the wheel segments. */
export const prizes: Prize[] = [
  { id: "pct20", label: "20% discount", short: "20% OFF", emoji: "🎉", color: "var(--peach)" },
  { id: "flat30", label: "₹30 instant discount", short: "₹30 OFF", emoji: "💸", color: "var(--mint)" },
  { id: "dip", label: "Free extra dip", short: "FREE DIP", emoji: "🍫", color: "var(--sky)" },
  { id: "dip2", label: "Free Dip", short: "FREE DIP", emoji: "🍫", color: "var(--pink)" },
  { id: "next40", label: "₹40 off next purchase", short: "₹40 NEXT", emoji: "🎁", color: "var(--caramel)" },
];

export const SPIN_MIN_SUBTOTAL = 200;
export const DELIVERY_FEE = 49;

const SPIN_KEY = "chocorunch-spin";
const VOUCHER_KEY = "chocorunch-voucher";

type SpinRecord = { prizeId: string; at: number };

type RewardContextValue = {
  /** Prize won for the current (unplaced) order, if any. */
  prize: Prize | null;
  /** ₹40 voucher earned from a previous order, redeemable now. */
  voucher: boolean;
  hasSpun: boolean;
  recordSpin: (prize: Prize) => void;
  /** Called after an order is placed — resets the one-spin-per-order lock. */
  consumeForOrder: () => void;
  /** Discount for a given subtotal from the current prize + voucher. */
  discountFor: (subtotal: number) => number;
  /** Human-readable reward lines for the order message. */
  rewardLines: (subtotal: number) => string[];
};

const RewardContext = createContext<RewardContextValue | null>(null);

export function RewardProvider({ children }: { children: ReactNode }) {
  const [spin, setSpin] = useState<SpinRecord | null>(null);
  const [voucher, setVoucher] = useState(false);
  const [ready, setReady] = useState(false);
  const { items } = useCart();
  const wasFilled = useRef(false);

  // Reset the spin lock when the cart is fully cleared (never on first load).
  useEffect(() => {
    if (!ready) return;
    if (items.length > 0) {
      wasFilled.current = true;
    } else if (wasFilled.current) {
      wasFilled.current = false;
      setSpin(null);
    }
  }, [items.length, ready]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SPIN_KEY);
      if (raw) setSpin(JSON.parse(raw));
      setVoucher(localStorage.getItem(VOUCHER_KEY) === "1");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      if (spin) localStorage.setItem(SPIN_KEY, JSON.stringify(spin));
      else localStorage.removeItem(SPIN_KEY);
      if (voucher) localStorage.setItem(VOUCHER_KEY, "1");
      else localStorage.removeItem(VOUCHER_KEY);
    } catch {
      /* ignore */
    }
  }, [spin, voucher, ready]);

  const recordSpin = useCallback((p: Prize) => {
    setSpin({ prizeId: p.id, at: Date.now() });
  }, []);

  const consumeForOrder = useCallback(() => {
    setSpin((prev) => {
      if (prev?.prizeId === "next40") setVoucher(true);
      else setVoucher(false);
      return null;
    });
  }, []);

  const value = useMemo<RewardContextValue>(() => {
    const prize = spin ? prizes.find((p) => p.id === spin.prizeId) ?? null : null;

    const discountFor = (subtotal: number) => {
      // Rewards pause below the unlock threshold and restore automatically above it.
      if (subtotal < SPIN_MIN_SUBTOTAL) return 0;
      let d = 0;
      if (prize?.id === "pct20") d += Math.round(subtotal * 0.2);
      if (prize?.id === "flat30") d += 30;
      if (voucher) d += 40;
      return Math.min(d, subtotal);
    };

    const rewardLines = (subtotal: number) => {
      const lines: string[] = [];
      if (subtotal < SPIN_MIN_SUBTOTAL) return lines;
      if (prize) {
        if (prize.id === "pct20") lines.push(`🎡 Spin & Win: 20% discount (−₹${Math.round(subtotal * 0.2)})`);
        else if (prize.id === "flat30") lines.push("🎡 Spin & Win: ₹30 instant discount");
        else if (prize.id === "next40") lines.push("🎡 Spin & Win: ₹40 off next purchase (voucher saved)");
        else lines.push(`🎡 Spin & Win: ${prize.label} (add free)`);
      }
      if (voucher) lines.push("🎟️ Voucher redeemed: ₹40 off");
      return lines;
    };

    return {
      prize,
      voucher,
      hasSpun: !!spin,
      recordSpin,
      consumeForOrder,
      discountFor,
      rewardLines,
    };
  }, [spin, voucher, recordSpin, consumeForOrder]);

  return <RewardContext.Provider value={value}>{children}</RewardContext.Provider>;
}

export function useReward() {
  const ctx = useContext(RewardContext);
  if (!ctx) throw new Error("useReward must be used within RewardProvider");
  return ctx;
}

export type Bill = {
  subtotal: number;
  /** True when a prize exists and the subtotal still qualifies. */
  rewardActive: boolean;
  /** Label of the active reward ("20% discount" etc.), or null. */
  rewardLabel: string | null;
  /** Free item earned from the wheel, added to the bill at ₹0. */
  freeItem: { emoji: string; label: string } | null;
  discount: number;
  delivery: number;
  total: number;
  /** True when a prize is on hold because the subtotal dropped below ₹200. */
  rewardPaused: boolean;
  /** Birthday coupon discount included in `discount`. */
  birthdayDiscount: number;
  /** Label shown when the birthday coupon is applied. */
  birthdayLabel: string | null;
  /** True when the coupon is available but the subtotal is still below ₹299. */
  birthdayShort: number;
};

/** Single source of truth for the bill shown in cart, checkout, UPI and WhatsApp. */
export function useBill(): Bill {
  const { items, subtotal } = useCart();
  const { prize, voucher, discountFor } = useReward();
  const birthday = useBirthday();

  const qualifies = subtotal >= SPIN_MIN_SUBTOTAL;
  const rewardActive = !!prize && qualifies;
  const birthdayDiscount = birthday.discountFor(subtotal);
  const spinDiscount = discountFor(subtotal);
  const discount = Math.min(spinDiscount + birthdayDiscount, subtotal);
  const delivery = items.length ? DELIVERY_FEE : 0;
  const freeItem =
    rewardActive && (prize!.id === "dip" || prize!.id === "dip2")
      ? { emoji: prize!.emoji, label: prize!.label }
      : null;

  return {
    subtotal,
    rewardActive,
    rewardLabel: rewardActive ? prize!.label : voucher && qualifies ? "₹40 voucher" : null,
    freeItem,
    discount,
    delivery,
    total: Math.max(0, subtotal - discount) + delivery,
    rewardPaused: !!prize && !qualifies,
    birthdayDiscount,
    birthdayLabel: birthdayDiscount > 0 ? BIRTHDAY_OFFER_LABEL : null,
    birthdayShort:
      birthday.available && birthday.applied && subtotal > 0 && subtotal < BIRTHDAY_MIN_SUBTOTAL
        ? BIRTHDAY_MIN_SUBTOTAL - subtotal
        : 0,
  };
}
