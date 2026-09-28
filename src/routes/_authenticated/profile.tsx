import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Cake, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { BirthdayBanner } from "@/components/birthday-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useBirthday } from "@/lib/birthday";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My profile — Chocorunch" },
      { name: "description", content: "Manage your Chocorunch details and add your birthday to unlock a special offer." },
      { property: "og:title", content: "My profile — Chocorunch" },
      { property: "og:description", content: "Manage your Chocorunch details and unlock your birthday offer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, displayName } = useAuth();
  const { dob, saveDob } = useBirthday();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(dob ?? "");
  }, [dob]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await saveDob(value || null);
    setSaving(false);
    if (error) toast.error(error);
    else toast.success(value ? "Birthday saved — your offer unlocks in your birthday month!" : "Birthday removed.");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-12 sm:px-6">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-primary">My profile</h1>

        <BirthdayBanner />

        <section className="clay relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-xl">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-foreground/10 blur-2xl" />
          <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-primary-foreground/10 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/20 shadow-inner">
              <Star className="h-7 w-7 fill-yellow-300 text-yellow-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-foreground/80">Your Choco Points</p>
              <p className="font-display text-3xl font-extrabold tracking-tight">🍫 {profile?.choco_points ?? 0}</p>
            </div>
          </div>
          <p className="relative mt-3 text-xs font-medium text-primary-foreground/70">
            Earn more points with every order and redeem them on future treats.
          </p>
        </section>

        <section className="clay space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={displayName} readOnly className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label>Mobile</Label>
              <Input value={profile?.mobile ?? ""} readOnly className="bg-secondary/50" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} readOnly className="bg-secondary/50" />
            </div>
          </div>
        </section>

        <section className="clay space-y-4 p-6">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <Cake className="h-5 w-5 text-primary" /> Birthday
          </h2>
          <p className="text-sm text-muted-foreground">
            Optional. During your birthday month you unlock ₹50 OFF on orders above ₹299 — one treat per birthday month.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-40 flex-1 space-y-2">
              <Label htmlFor="dob">Date of birth</Label>
              <Input id="dob" type="date" value={value} max="2020-12-31" onChange={(e) => setValue(e.target.value)} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="btn-3d rounded-full font-bold">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save birthday
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}