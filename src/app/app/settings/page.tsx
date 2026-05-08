"use client";

import * as React from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/app/AppShell";

export default function SettingsPage() {
  const { push } = useToast();
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [profile, setProfile] = React.useState({
    full_name: "", email: "", phone: "", city: "",
  });

  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          email: data.email || user.email || "",
          phone: data.phone || "",
          city: data.city || "",
        });
      }
      setLoading(false);
    })();
  }, [supabase]);

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles").update({
        full_name: profile.full_name,
        phone: profile.phone,
        city: profile.city,
      }).eq("id", user.id);
    setSaving(false);
    if (error) push({ title: "Save failed", body: error.message });
    else push({ title: "Saved", body: "Profile updated" });
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your profile." />
      {loading ? (
        <div className="text-sm text-faint">Loading…</div>
      ) : (
        <form onSubmit={onSave} className="max-w-xl rounded-3xl border border-white/[0.08] bg-ink/40 p-6 sm:p-7 space-y-4">
          <div>
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" value={profile.full_name}
              onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email} disabled />
            <p className="text-[11px] text-faint mt-1">Email is managed by your auth provider.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={profile.city}
                onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))} />
            </div>
          </div>
          <Button type="submit" disabled={saving}>
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      )}
    </>
  );
}
