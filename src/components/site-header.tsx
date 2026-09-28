import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Minus, Plus, Trash2, User, LogOut, Receipt, Cake } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/products";
import { useBill, SPIN_MIN_SUBTOTAL } from "@/lib/reward";
import { useAuth } from "@/lib/auth";
import logoAsset from "@/assets/chocorunch-logo.asset.json";

export function SiteHeader() {
  const { items, count, subtotal, setQty, remove } = useCart();
  const { discount, delivery, total, freeItem, rewardLabel, rewardPaused, birthdayDiscount, birthdayLabel, birthdayShort } =
    useBill();
  const { user, displayName, initials, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/home" className="flex items-center gap-2.5">
          <img
            src={logoAsset.url}
            alt="Chocorunch"
            className="logo-3d h-13 w-13 rounded-full object-cover ring-2 ring-[var(--gold)]/70"
            width={52}
            height={52}
          />
          <span className="font-display text-2xl font-extrabold tracking-tight text-primary">
            Chocorunch
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium sm:flex">
          <Link to="/home" activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }} className="text-muted-foreground transition-colors hover:text-primary">
            Home
          </Link>
          <Link to="/menu" activeProps={{ className: "text-primary" }} className="text-muted-foreground transition-colors hover:text-primary">
            Menu
          </Link>
        </nav>

        <div className="flex items-center gap-2">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Account menu"
                className="flex items-center gap-2 rounded-full border border-border/60 bg-card py-1 pl-1 pr-3 shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {initials}
                </span>
                <span className="hidden max-w-24 truncate text-sm font-semibold sm:inline">{displayName}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="truncate">{displayName || user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                <User className="mr-2 h-4 w-4" /> My profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/orders" })}>
                <Receipt className="mr-2 h-4 w-4" /> My orders
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/", search: {}, replace: true });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild size="sm" variant="secondary" className="gap-1.5 rounded-full font-bold">
            <Link to="/" search={{}}>
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Log in</span>
            </Link>
          </Button>
        )}

        <Sheet>
          <SheetTrigger asChild>
            <Button size="sm" className="btn-3d relative gap-2 rounded-full font-bold">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {count > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--pink)] px-1 text-[11px] font-bold text-primary shadow">
                  {count}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="flex w-full flex-col sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="font-display text-2xl">Your cart</SheetTitle>
            </SheetHeader>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Your cart is empty.</p>
                <SheetClose asChild>
                  <Button asChild variant="secondary" className="rounded-full">
                    <Link to="/menu">Browse the menu</Link>
                  </Button>
                </SheetClose>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto py-2 pr-1">
                  {items.map(({ product, qty }) => (
                    <div key={product.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-2xl">
                        {product.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{formatINR(product.price)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setQty(product.id, qty - 1)}>
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-5 text-center text-sm font-medium">{qty}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setQty(product.id, qty + 1)}>
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => remove(product.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <SheetFooter className="mt-auto gap-3 border-t border-border/60 pt-4 sm:flex-col sm:space-x-0">
                  <div className="w-full space-y-1.5 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{formatINR(subtotal)}</span>
                    </div>
                    {rewardLabel && (
                      <div className="flex items-center justify-between font-semibold text-primary">
                        <span>Spin reward</span>
                        <span>{rewardLabel}</span>
                      </div>
                    )}
                    {freeItem && (
                      <div className="flex items-center justify-between font-semibold text-primary">
                        <span>{freeItem.emoji} {freeItem.label}</span>
                        <span>₹0</span>
                      </div>
                    )}
                    {rewardPaused && (
                      <p className="text-xs font-medium text-muted-foreground">
                        Reward paused — add {formatINR(SPIN_MIN_SUBTOTAL - subtotal)} more to restore it.
                      </p>
                    )}
                    {birthdayDiscount > 0 && (
                      <div className="flex items-center justify-between font-semibold text-primary">
                        <span className="flex items-center gap-1.5">
                          <Cake className="h-3.5 w-3.5" /> {birthdayLabel}
                        </span>
                        <span>-{formatINR(birthdayDiscount)}</span>
                      </div>
                    )}
                    {birthdayShort > 0 && (
                      <p className="text-xs font-medium text-muted-foreground">
                        🎂 Add {formatINR(birthdayShort)} more to use your birthday offer.
                      </p>
                    )}
                    {discount > 0 && (
                      <div className="flex items-center justify-between font-semibold text-primary">
                        <span>Discount</span>
                        <span>-{formatINR(discount)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Delivery charge</span>
                      <span>{formatINR(delivery)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/60 pt-1.5 text-base font-semibold text-foreground">
                      <span>Final amount</span>
                      <span>{formatINR(total)}</span>
                    </div>
                  </div>
                  <SheetClose asChild>
                    <Button asChild size="lg" className="btn-3d w-full rounded-full font-bold">
                      <Link to="/checkout">Checkout</Link>
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </>
            )}
          </SheetContent>
        </Sheet>
        </div>
      </div>
    </header>
  );
}