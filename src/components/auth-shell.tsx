import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import logoAsset from "@/assets/chocorunch-logo.asset.json";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full opacity-50 blur-3xl"
        style={{ background: "var(--mint)" }}
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full opacity-50 blur-3xl"
        style={{ background: "var(--pink)" }}
      />

      <div className="scene-3d relative w-full max-w-md">
        <div className="clay p-7 sm:p-9">
          <Link to="/" search={{}} className="mb-6 flex flex-col items-center gap-3 text-center">
            <img
              src={logoAsset.url}
              alt="Chocorunch"
              className="float-3d logo-3d h-24 w-24 rounded-full object-cover ring-4 ring-[var(--gold)]/70"
              width={96}
              height={96}
            />
            <span className="font-display text-2xl font-extrabold tracking-tight text-primary">
              Chocorunch
            </span>
          </Link>

          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

          <div className="mt-6">{children}</div>
        </div>
        {footer ? <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    </div>
  );
}
