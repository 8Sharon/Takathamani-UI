import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  UserPen,
  Landmark,
  Bell,
  Globe,
  HelpCircle,
  LogOut,
  BadgeCheck,
  ChevronRight,
} from "lucide-react";
import { getDashboard, updateProfile } from "@/lib/marketplace.functions";
import { signOut } from "@/lib/auth";
import { roleLabel } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "User Profile & Settings — Takathamani" },
      { name: "description", content: "Manage your Takathamani account and preferences." },
      { property: "og:title", content: "User Profile & Settings — Takathamani" },
      { property: "og:description", content: "Manage your account and preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const getDash = useServerFn(getDashboard);
  const saveProfile = useServerFn(updateProfile);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDash() });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [county, setCounty] = useState("");
  const [language, setLanguage] = useState("English");
  const [pushOn, setPushOn] = useState(true);
  const [smsOn, setSmsOn] = useState(true);

  if (isLoading || !data) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Loading profile...</p>;
  }

  function openEdit() {
    setName(data!.profile.full_name);
    setPhone(data!.profile.phone);
    setCounty(data!.profile.county);
    setEditOpen(true);
  }

  async function save() {
    try {
      await saveProfile({ data: { full_name: name, phone, county } });
      toast.success("Profile updated");
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err) {
      toast.error("Could not save", { description: String(err) });
    }
  }

  async function handleLogout() {
    await signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">User Profile & Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences.</p>
      </div>

      <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-secondary text-2xl font-bold text-primary">
          {data.profile.full_name.slice(0, 1)}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-lg font-extrabold text-foreground">{data.profile.full_name}</p>
            {data.profile.verified && <BadgeCheck className="h-5 w-5 text-primary" />}
          </div>
          <p className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary">
            {roleLabel(data.role)}
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">{data.profile.phone}</p>
          <p className="text-sm text-muted-foreground">{data.profile.county}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <MenuRow Icon={UserPen} label="Edit Profile" onClick={openEdit} />
        <MenuRow
          Icon={Landmark}
          label="Bank & Mobile Money"
          onClick={() =>
            toast.info("Mobile money wallet", {
              description: "Payouts go to the phone number on your profile.",
            })
          }
        />
        <MenuRow
          Icon={Bell}
          label="Notifications"
          right={
            <span className="flex items-center gap-3 text-xs text-muted-foreground">
              Push
              <button
                role="switch"
                aria-checked={pushOn}
                onClick={() => setPushOn(!pushOn)}
                className={`h-5 w-9 rounded-full transition-colors ${pushOn ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`block h-4 w-4 translate-y-[2px] rounded-full bg-white shadow transition-transform ${
                    pushOn ? "translate-x-[18px]" : "translate-x-[2px]"
                  }`}
                />
              </button>
              SMS
              <button
                role="switch"
                aria-checked={smsOn}
                onClick={() => setSmsOn(!smsOn)}
                className={`h-5 w-9 rounded-full transition-colors ${smsOn ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`block h-4 w-4 translate-y-[2px] rounded-full bg-white shadow transition-transform ${
                    smsOn ? "translate-x-[18px]" : "translate-x-[2px]"
                  }`}
                />
              </button>
            </span>
          }
        />
        <MenuRow
          Icon={Globe}
          label="Language"
          right={
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Language"
              className="cursor-pointer rounded-lg border border-input bg-background px-2 py-1 text-xs"
            >
              <option>English</option>
              <option>Kiswahili</option>
            </select>
          }
        />
        <MenuRow Icon={HelpCircle} label="Help & Support" to="/support" />
        <MenuRow Icon={LogOut} label="Log Out" onClick={handleLogout} danger />
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your account details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              aria-label="Full name"
              className="w-full rounded-xl border border-input bg-background py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              aria-label="Phone number"
              className="w-full rounded-xl border border-input bg-background py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              placeholder="County"
              aria-label="County"
              className="w-full rounded-xl border border-input bg-background py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={save}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              Save Changes
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MenuRow({
  Icon,
  label,
  onClick,
  to,
  right,
  danger,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  to?: "/support";
  right?: React.ReactNode;
  danger?: boolean;
}) {
  const inner = (
    <>
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          danger ? "bg-destructive/10 text-destructive" : "bg-secondary text-primary"
        }`}
      >
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span
        className={`flex-1 text-sm font-semibold ${danger ? "text-destructive" : "text-foreground"}`}
      >
        {label}
      </span>
      {right ?? <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </>
  );

  const cls = "flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-secondary/60";

  if (to) {
    return (
      <div className="border-b border-border last:border-0">
        <Link to={to} className={cls}>
          {inner}
        </Link>
      </div>
    );
  }
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={onClick} className={cls}>
        {inner}
      </button>
    </div>
  );
}
