import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — the login page now lives at "/". */
export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : undefined,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/", search: { redirect: search.redirect }, replace: true });
  },
});
