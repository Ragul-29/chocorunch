import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";

/** Birthday offer rules — ₹50 off on orders above ₹299, once per birthday month. */
export const BIRTHDAY_MIN_SUBTOTAL = 299;
export const BIRTHDAY_DISCOUNT = 50;
export const BIRTHDAY_OFFER_LABEL = "₹50 OFF birthday treat";

const APPLIED_KEY = "chocorunch-birthday-applied";

function monthPeriod(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

type BirthdayValue = {
  dob: string | null;
  hasDob: boolean;
  /** Current birthday-month period key, e.g. "2026-08" — null outside the birthday month. */
  period: string | null;
  isBirthdayMonth: boolean;
  /** Already used this birthday month. */
  redeemed: boolean;
  /** Coupon available to use (birthday month + not yet redeemed). */
  available: boolean;
  /** User has switched the coupon on for this order. */
  applied: boolean;
  loading: boolean;
  setApplied: (next: boolean) => void;
  /** Discount value for a subtotal (0 when not eligible). */
  discountFor: (subtotal: number) => number;
  /** Persist DOB on the profile. */
  saveDob: (dob: string | null) => Promise<{ error: string | null }>;
  /** Lock the coupon for this birthday month after an order is placed. */
  markRedeemed: (orderCode: string, amount: number) => Promise<void>;
};

const BirthdayContext = createContext<BirthdayValue | null>(null);

export function BirthdayProvider({ children }: { children: ReactNode }) {
  const { user, profile, refreshProfile } = useAuth();
  const dob = profile?.dob ?? null;

  const [redeemed, setRedeemed] = useState(false);
  const [applied, setAppliedState] = useState(true);
  const [loading, setLoading] = useState(false);

  const period = useMemo(() => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return null;
    const now = new Date();
    if (birth.getMonth() !== now.getMonth()) return null;
    return monthPeriod(now);
  }, [dob]);

  // Load the redemption record so a refresh or re-login can't reuse the coupon.
  useEffect(() => {
    if (!user || !period) {
      setRedeemed(false);
      return;
    }
    let active = true;
    setLoading(true);
    supabase
      .from("birthday_redemptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("period", period)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setRedeemed(!!data);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, period]);

  // Remember the on/off toggle per user + birthday month.
  const storageKey = user && period ? `${APPLIED_KEY}:${user.id}:${period}` : null;
  useEffect(() => {
    if (!storageKey) return;
    try {
      setAppliedState(localStorage.getItem(storageKey) !== "0");
    } catch {
      setAppliedState(true);
    }
  }, [storageKey]);

  const setApplied = useCallback(
    (next: boolean) => {
      setAppliedState(next);
      if (!storageKey) return;
      try {
        localStorage.setItem(storageKey, next ? "1" : "0");
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  const saveDob = useCallback(
    async (next: string | null) => {
      if (!user) return { error: "Please log in first." };
      const { error } = await supabase.from("profiles").update({ dob: next }).eq("id", user.id);
      if (error) return { error: error.message };
      await refreshProfile();
      return { error: null };
    },
    [user, refreshProfile],
  );

  const markRedeemed = useCallback(
    async (orderCode: string, amount: number) => {
      if (!user || !period) return;
      setRedeemed(true);
      const { error } = await supabase
        .from("birthday_redemptions")
        .insert({ user_id: user.id, period, order_code: orderCode, amount });
      if (error) console.error("Could not record birthday coupon", error);
    },
    [user, period],
  );

  const value = useMemo<BirthdayValue>(() => {
    const available = !!period && !redeemed;
    return {
      dob,
      hasDob: !!dob,
      period,
      isBirthdayMonth: !!period,
      redeemed,
      available,
      applied: available && applied,
      loading,
      setApplied,
      discountFor: (subtotal: number) =>
        available && applied && subtotal >= BIRTHDAY_MIN_SUBTOTAL ? BIRTHDAY_DISCOUNT : 0,
      saveDob,
      markRedeemed,
    };
  }, [dob, period, redeemed, applied, loading, setApplied, saveDob, markRedeemed]);

  return <BirthdayContext.Provider value={value}>{children}</BirthdayContext.Provider>;
}

export function useBirthday(): BirthdayValue {
  const ctx = useContext(BirthdayContext);
  if (!ctx) throw new Error("useBirthday must be used within BirthdayProvider");
  return ctx;
}