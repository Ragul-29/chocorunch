import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ShoppingBag, Check, Smartphone, CreditCard, Wallet, Cake } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/products";
import { useBill, useReward, DELIVERY_FEE, SPIN_MIN_SUBTOTAL } from "@/lib/reward";
import { useBirthday, BIRTHDAY_MIN_SUBTOTAL, BIRTHDAY_OFFER_LABEL } from "@/lib/birthday";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Chocorunch" },
      { name: "description", content: "Enter your delivery details and place your Chocorunch order." },
      { property: "og:title", content: "Checkout — Chocorunch" },
      { property: "og:description", content: "Enter your delivery details and place your Chocorunch order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checkout,
});

// Owner order-desk details — edit these to change where orders land.
const BUSINESS_WHATSAPP = "918610270207"; // country code + number, no "+"
const BUSINESS_UPI = "8610270207@upi"; // UPI ID that receives GPay/UPI payments
const BUSINESS_NAME = "Chocorunch";

type PayMethod = "gpay" | "card" | "cod";

const PAY_METHODS: { id: PayMethod; label: string; hint: string; icon: typeof Smartphone; bg: string }[] = [
  { id: "gpay", label: "GPay / UPI", hint: "Pay instantly via any UPI app", icon: Smartphone, bg: "var(--mint)" },
  { id: "card", label: "Card", hint: "Debit / credit card", icon: CreditCard, bg: "var(--sky)" },
  { id: "cod", label: "Cash on delivery", hint: "Pay when it arrives", icon: Wallet, bg: "var(--caramel)" },
];

function Checkout() {
  const { items, subtotal, count, clear } = useCart();
  const { rewardLines, consumeForOrder } = useReward();
  const { discount, delivery, total, freeItem, rewardLabel, rewardPaused, birthdayDiscount, birthdayShort } = useBill();
  const birthday = useBirthday();
  const { user, profile, displayName, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState<PayMethod>("gpay");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (items.length === 0) return;
    const form = e.currentTarget;
    const get = (id: string) =>
      (form.elements.namedItem(id) as HTMLInputElement | HTMLTextAreaElement | null)?.value.trim() ?? "";

    const name = get("name");
    const phone = get("phone");
    const email = get("email");
    const address = get("address");
    const city = get("city");
    const pincode = get("pincode");
    const notes = get("notes");

    setSubmitting(true);

    const methodLabel = PAY_METHODS.find((m) => m.id === method)?.label ?? method;
    const lines = items.map(
      ({ product, qty }) =>
        `• ${product.name} × ${qty} — ${formatINR(product.price * qty)}` +
        (product.description ? `\n   ↳ ${product.description}` : ""),
    );

    const orderId = `CR${Date.now().toString().slice(-6)}`;
    const rewards = rewardLines(subtotal);

    // Choco Points: ₹100 of eligible product spend = 10 points. Delivery is excluded.
    const eligibleAmount = Math.max(0, total - delivery);
    const expectedPoints = Math.floor(eligibleAmount / 100) * 10;
    let earnedPoints = 0;

    // Lock the birthday coupon for this birthday month so a refresh or re-login can't reuse it.
    if (birthdayDiscount > 0) {
      await birthday.markRedeemed(orderId, birthdayDiscount);
    }

    // Save to the signed-in customer's order history (best-effort).
    if (user) {
      const { error: saveError } = await supabase.from("orders").insert({
        user_id: user.id,
        order_code: orderId,
        items: items.map(({ product, qty }) => ({
          name: product.name,
          emoji: product.emoji,
          qty,
          price: product.price,
        })),
        subtotal,
        discount,
        delivery,
        total,
        payment_method: methodLabel,
        reward_label: rewardLabel ?? null,
        customer_name: name,
        customer_phone: phone,
        address: `${address}, ${city} - ${pincode}`,
      });
      if (saveError) console.error("Could not save order history", saveError);

      // Award points once per order — the database guards against double credit.
      if (!saveError && expectedPoints > 0) {
        const { data: awarded, error: pointsError } = await supabase.rpc("award_choco_points", {
          _order_code: orderId,
          _eligible_amount: eligibleAmount,
        });
        if (pointsError) console.error("Could not award Choco Points", pointsError);
        else earnedPoints = awarded ?? 0;
      }
    }

    const message =
      `🍫 *New ${BUSINESS_NAME} Order* (${orderId})\n\n` +
      `*Items:*\n${lines.join("\n")}\n\n` +
      `Subtotal: ${formatINR(subtotal)}\n` +
      (rewardLabel ? `Spin reward: ${rewardLabel}\n` : "") +
      (freeItem ? `Free item: ${freeItem.emoji} ${freeItem.label} — ₹0\n` : "") +
      (birthdayDiscount ? `🎂 Birthday offer: -${formatINR(birthdayDiscount)}\n` : "") +
      (discount ? `Reward discount: -${formatINR(discount)}\n` : "") +
      `Delivery: ${formatINR(delivery)}\n` +
      `*Total: ${formatINR(total)}*\n\n` +
      (earnedPoints > 0 ? `🍫 Choco Points earned: ${earnedPoints}\n\n` : "") +
      (rewards.length ? `*Rewards:*\n${rewards.join("\n")}\n\n` : "") +
      `*Payment:* ${methodLabel}\n\n` +
      `*Customer:*\n${name}\n${phone}\n${email}\n\n` +
      `*Deliver to:*\n${address}\n${city} - ${pincode}` +
      (notes ? `\n\nNotes: ${notes}` : "");

    const waUrl = `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(message)}`;

    // For GPay / UPI, kick off the UPI payment intent first.
    if (method === "gpay") {
      const upiUrl =
        `upi://pay?pa=${encodeURIComponent(BUSINESS_UPI)}` +
        `&pn=${encodeURIComponent(BUSINESS_NAME)}` +
        `&am=${total}&cu=INR&tn=${encodeURIComponent(`${BUSINESS_NAME} order ${orderId}`)}`;
      window.location.href = upiUrl;
    }

    // Send the order straight to the business WhatsApp.
    setTimeout(() => {
      window.open(waUrl, "_blank", "noopener,noreferrer");
      setSubmitting(false);
      toast.success("Order sent! Confirm it in WhatsApp to complete.");
      if (earnedPoints > 0) {
        toast.success(`🎉 You earned ${earnedPoints} Choco Points!`);
        void refreshProfile();
      }
      consumeForOrder();
      clear();
      navigate({ to: "/home" });
    }, method === "gpay" ? 1200 : 400);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
          <h1 className="font-display text-2xl font-bold text-primary">Your cart is empty</h1>
          <p className="text-muted-foreground">Add some crunch before checking out.</p>
          <Button asChild className="btn-3d rounded-full font-bold">
            <Link to="/menu">Browse the menu</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <button
          onClick={() => navigate({ to: "/menu" })}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to menu
        </button>
        <h1 className="mb-8 font-display text-4xl font-extrabold tracking-tight text-primary">Checkout</h1>

        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Delivery form */}
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
            <section className="clay p-6">
              <h2 className="mb-4 font-display text-xl font-bold">Contact</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" required placeholder="Your name" defaultValue={displayName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" required placeholder="10-digit mobile" defaultValue={profile?.mobile ?? ""} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required placeholder="you@example.com" defaultValue={user?.email ?? ""} />
                </div>
              </div>
            </section>

            <section className="clay p-6">
              <h2 className="mb-4 font-display text-xl font-bold">Delivery address</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" required placeholder="House / flat, street, area" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" required placeholder="City" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" required placeholder="Pincode" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="notes">Delivery notes (optional)</Label>
                  <Textarea id="notes" placeholder="Landmark, delivery instructions…" />
                </div>
              </div>
            </section>

            <section className="clay p-6">
              <h2 className="mb-1 font-display text-xl font-bold">Payment method</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Choose how you&apos;d like to pay. Your order is sent straight to us on WhatsApp.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {PAY_METHODS.map(({ id, label, hint, icon: Icon, bg }) => {
                  const active = method === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setMethod(id)}
                      aria-pressed={active}
                      className={`clay tilt-3d relative flex flex-col items-start gap-2 p-4 text-left ${
                        active ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      {active && (
                        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-primary shadow-inner"
                        style={{ backgroundColor: bg }}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-display font-bold text-foreground">{label}</span>
                      <span className="text-xs text-muted-foreground">{hint}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </form>

          {/* Order summary */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="clay p-6">
              <h2 className="mb-4 font-display text-xl font-bold">Order summary</h2>
              <div className="space-y-3">
                {items.map(({ product, qty }) => (
                  <div key={product.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="text-lg">{product.emoji}</span>
                      <span className="truncate">
                        {product.name} <span className="text-muted-foreground">× {qty}</span>
                      </span>
                    </span>
                    <span className="shrink-0 font-medium">{formatINR(product.price * qty)}</span>
                  </div>
                ))}
              </div>
              <div className="my-4 h-px bg-border" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({count} items)</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                {rewardLabel && (
                  <div className="flex justify-between font-semibold text-primary">
                    <span>Spin &amp; Win reward</span>
                    <span>{rewardLabel}</span>
                  </div>
                )}
                {rewardPaused && (
                  <p className="text-xs font-medium text-muted-foreground">
                    Reward paused — add {formatINR(SPIN_MIN_SUBTOTAL - subtotal)} more to restore it.
                  </p>
                )}
                {birthday.available && (
                  <div className="clay flex flex-wrap items-center gap-2 p-3">
                    <Cake className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 text-xs font-semibold text-foreground">
                      Birthday offer · ₹50 OFF above {formatINR(BIRTHDAY_MIN_SUBTOTAL)}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant={birthday.applied ? "secondary" : "default"}
                      className="rounded-full text-xs font-bold"
                      onClick={() => birthday.setApplied(!birthday.applied)}
                    >
                      {birthday.applied ? "Applied" : "Apply Birthday Offer"}
                    </Button>
                  </div>
                )}
                {birthdayDiscount > 0 && (
                  <div className="flex justify-between font-semibold text-primary">
                    <span>🎂 {BIRTHDAY_OFFER_LABEL}</span>
                    <span>-{formatINR(birthdayDiscount)}</span>
                  </div>
                )}
                {birthdayShort > 0 && (
                  <p className="text-xs font-medium text-muted-foreground">
                    Add {formatINR(birthdayShort)} more to use your birthday offer.
                  </p>
                )}
                {discount > 0 && (
                  <div className="flex justify-between font-semibold text-primary">
                    <span>Discount</span>
                    <span>-{formatINR(discount)}</span>
                  </div>
                )}
                {freeItem && (
                  <div className="flex justify-between font-semibold text-primary">
                    <span>{freeItem.emoji} {freeItem.label}</span>
                    <span>₹0</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery charge</span>
                  <span>{formatINR(delivery)}</span>
                </div>
                <div className="flex justify-between pt-2 text-base font-semibold text-foreground">
                  <span>Final amount</span>
                  <span>{formatINR(total)}</span>
                </div>
              </div>
              <Button
                type="submit"
                form="checkout-form"
                size="lg"
                className="btn-3d mt-6 w-full rounded-full font-bold"
                disabled={submitting}
              >
                {submitting
                  ? "Sending order…"
                  : method === "gpay"
                    ? `Pay ${formatINR(total)} with GPay / UPI`
                    : method === "card"
                      ? `Pay ${formatINR(total)}`
                      : `Place order · ${formatINR(total)}`}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Order confirmed instantly on WhatsApp
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}