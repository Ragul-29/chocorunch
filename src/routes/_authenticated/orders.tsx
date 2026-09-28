import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PackageOpen, Receipt } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/products";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "My orders — Chocorunch" },
      { name: "description", content: "See every Chocorunch order you've placed, with items, rewards and totals." },
      { property: "og:title", content: "My orders — Chocorunch" },
      { property: "og:description", content: "See every Chocorunch order you've placed, with items, rewards and totals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrdersPage,
});

type OrderItem = { name: string; emoji?: string; qty: number; price: number };

function OrdersPage() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="mb-8 font-display text-4xl font-extrabold tracking-tight text-primary">My orders</h1>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your orders…
          </div>
        ) : error ? (
          <p className="text-sm font-medium text-destructive">Couldn&apos;t load your orders. Please refresh.</p>
        ) : !data || data.length === 0 ? (
          <div className="clay flex flex-col items-center gap-4 p-10 text-center">
            <PackageOpen className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No orders yet — your first crunch is waiting.</p>
            <Button asChild className="btn-3d rounded-full font-bold">
              <Link to="/menu">Browse the menu</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((order) => {
              const items = (order.items as unknown as OrderItem[]) ?? [];
              return (
                <article key={order.id} className="clay p-6">
                  <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-display text-lg font-bold text-primary">
                      <Receipt className="h-4 w-4" /> {order.order_code}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </header>
                  <ul className="space-y-1.5 text-sm">
                    {items.map((item, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span className="truncate">
                          {item.emoji} {item.name} <span className="text-muted-foreground">× {item.qty}</span>
                        </span>
                        <span className="shrink-0 font-medium">{formatINR(item.price * item.qty)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 space-y-1 border-t border-border/60 pt-3 text-sm">
                    {order.reward_label && (
                      <div className="flex justify-between font-semibold text-primary">
                        <span>Spin reward</span>
                        <span>{order.reward_label}</span>
                      </div>
                    )}
                    {Number(order.discount) > 0 && (
                      <div className="flex justify-between font-semibold text-primary">
                        <span>Discount</span>
                        <span>-{formatINR(Number(order.discount))}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery</span>
                      <span>{formatINR(Number(order.delivery))}</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold">
                      <span>Total paid</span>
                      <span>{formatINR(Number(order.total))}</span>
                    </div>
                    <p className="pt-1 text-xs uppercase tracking-wide text-muted-foreground">
                      {order.payment_method}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
