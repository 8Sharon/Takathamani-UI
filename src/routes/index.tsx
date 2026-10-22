import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Phone,
  Lock,
  ChevronDown,
  User,
  Sparkles,
  TrendingUp,
  Boxes,
  Route as RouteIcon,
  Leaf,
  PhoneCall,
  Wallet,
  Inbox,
  Recycle,
  Sprout,
} from "lucide-react";
import heroImg from "@/assets/hero-farmer.jpg";
import { LeafLogo } from "@/components/leaf-logo";
import { signInWithPhone, signUpWithPhone } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Takathamani — From Farm Waste to a Greener Future" },
      {
        name: "description",
        content:
          "Takathamani links farmers directly with buyers of agricultural waste using smart technology and USSD access for everyone. Connect. Trade. Create impact.",
      },
      { property: "og:title", content: "Takathamani — From Farm Waste to a Greener Future" },
      {
        property: "og:description",
        content:
          "The inclusive agricultural-waste marketplace. Farmers list waste, buyers discover it, USSD access for every farmer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  { icon: Sparkles, title: "AI Waste-to-Value Matching", body: "Right material, right buyer, right price." },
  { icon: TrendingUp, title: "Predictive Analytics", body: "Uses crop calendars, weather & farm data to forecast waste availability." },
  { icon: Boxes, title: "Smart Aggregation", body: "Combines small quantities from many farmers for bigger buyers." },
  { icon: RouteIcon, title: "Optimized Collection Routes", body: "Reduces transport costs and carbon footprint." },
  { icon: Leaf, title: "Impact Tracking", body: "Measures waste recovered, CO₂ avoided and farmer earnings." },
  { icon: PhoneCall, title: "USSD + Voice Access", body: "In local languages for true inclusion." },
  { icon: Wallet, title: "Mobile Money", body: "Secure and fast payments." },
];

const TRUST = [
  { icon: Inbox, title: "More income", body: "for farmers" },
  { icon: Recycle, title: "Clean environment", body: "for a healthier planet" },
  { icon: Sprout, title: "A circular economy", body: "for a sustainable future" },
];

type Role = "farmer" | "buyer" | "admin";

function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-background">
      <HeroSection />
      <UniqueSection />
      <footer className="bg-forest py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 text-center">
          <div className="flex items-center gap-3">
            <LeafLogo className="h-10 w-10" />
            <div className="text-left">
              <p className="text-lg font-bold text-primary-foreground">Takathamani</p>
              <p className="text-xs text-primary-foreground/70">Inclusive Agricultural-Waste Marketplace</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-primary-foreground/60">
            © {new Date().getFullYear()} Takathamani • Inclusive Agritech
          </p>
        </div>
      </footer>
    </div>
  );
}

function HeroSection() {
  const [role, setRole] = useState<Role>("farmer");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [fullName, setFullName] = useState("");
  const [county, setCounty] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function handleLogin() {
    if (!phone || !pin) return toast.error("Enter your mobile number and PIN");
    setBusy(true);
    const { error } = await signInWithPhone(phone, pin);
    setBusy(false);
    if (error) return toast.error("Login failed", { description: "Check your mobile number and PIN." });
    toast.success("Karibu back, farmer!");
    navigate({ to: "/dashboard" });
  }

  async function handleRegister() {
    if (!fullName || !phone || !county || pin.length < 4)
      return toast.error("Fill in all fields and use a 4-digit PIN");
    setBusy(true);
    const { error } = await signUpWithPhone({ phone, pin, fullName, county, role });
    setBusy(false);
    if (error) return toast.error("Registration failed", { description: error.message });
    toast.success("Account created. Welcome to Takathamani!");
    navigate({ to: "/dashboard" });
  }

  return (
    <section className="relative overflow-hidden">
      <img
        src={heroImg}
        alt="Farmer holding maize harvest in a green field"
        className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-forest-deep/95 via-forest/70 to-forest/20" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-forest-deep/80 to-transparent" />

      <div className="relative mx-auto flex max-w-[1400px] flex-col gap-10 px-6 py-6 lg:flex-row lg:gap-8">
        {/* Top bar */}
        <div className="absolute left-6 top-6 flex items-center gap-3">
          <LeafLogo className="h-12 w-12" />
          <div>
            <p className="text-2xl font-extrabold leading-none text-white">Takathamani</p>
            <p className="mt-1 text-xs text-white/75">Inclusive Agricultural-Waste Marketplace</p>
          </div>
        </div>
        <div className="absolute right-6 top-6">
          <label className="flex items-center gap-1 rounded-full bg-forest/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
            EN
            <ChevronDown className="h-3 w-3" />
            <select
              aria-label="Language"
              className="absolute inset-0 cursor-pointer appearance-none opacity-0"
              defaultValue="en"
            >
              <option value="en">English</option>
              <option value="sw">Kiswahili</option>
            </select>
          </label>
        </div>

        {/* Left copy */}
        <div className="flex flex-1 flex-col justify-center pt-24 lg:pt-36">
          <h1 className="max-w-xl text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            From Farm Waste <br className="hidden sm:block" />
            to <span className="text-lime">a Greener Future</span>
          </h1>
          <p className="mt-3 text-lg font-semibold text-white">Connect. Trade. Create Impact.</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80">
            Takathamani links farmers directly with buyers of agricultural waste, using smart
            technology and USSD access for everyone.
          </p>
          <div className="mt-16 flex flex-wrap gap-4 lg:mt-24">
            {TRUST.map((t) => (
              <div key={t.title} className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lime">
                  <t.icon className="h-5 w-5" />
                </span>
                <div className="text-xs leading-snug">
                  <p className="font-semibold text-white">{t.title}</p>
                  <p className="text-white/70">{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Login / register card */}
        <div className="flex items-center lg:pt-16">
          <div className="w-full max-w-[400px] rounded-3xl bg-card p-7 shadow-2xl">
            {mode === "login" ? (
              <>
                <h2 className="text-xl font-bold text-card-foreground">Welcome Back!</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Log in to access your Takathamani account
                </p>
                <div className="mt-4 flex rounded-full bg-muted p-1">
                  {(["farmer", "buyer", "admin"] as Role[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`flex-1 rounded-full py-1.5 text-sm font-semibold capitalize transition-colors ${
                        role === r
                          ? "bg-forest text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="mt-5 space-y-3">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      inputMode="tel"
                      placeholder="Phone Number"
                      aria-label="Phone Number"
                      className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      type="password"
                      inputMode="numeric"
                      placeholder="Password / PIN"
                      aria-label="Password or PIN"
                      className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <button
                  onClick={handleLogin}
                  disabled={busy}
                  className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {busy ? "Logging in..." : "Login"}
                </button>
                <div className="mt-2 text-right">
                  <button className="text-xs font-semibold text-primary underline-offset-2 hover:underline">
                    Forgot PIN?
                  </button>
                </div>
                <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  Or continue with
                  <span className="h-px flex-1 bg-border" />
                </div>
                <button
                  onClick={() => toast.info("Dial *000# on your phone to use Takathamani without internet")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-input py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  <Phone className="h-4 w-4 text-primary" />
                  Use USSD *000#
                </button>
                <p className="mt-5 text-center text-xs text-muted-foreground">
                  New to Takathamani?{" "}
                  <button
                    onClick={() => setMode("register")}
                    className="font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    Register Now
                  </button>
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-card-foreground">Create Account</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Join as a <span className="font-semibold capitalize">{role}</span> — change the role
                  tab above
                </p>
                <div className="mt-4 space-y-3">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full name"
                    aria-label="Full name"
                    className="w-full rounded-xl border border-input bg-background py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    placeholder="Phone number (e.g. 0712345678)"
                    aria-label="Phone number"
                    className="w-full rounded-xl border border-input bg-background py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    placeholder="County (e.g. Nakuru)"
                    aria-label="County"
                    className="w-full rounded-xl border border-input bg-background py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    type="password"
                    inputMode="numeric"
                    placeholder="Create a 4-digit PIN"
                    aria-label="PIN"
                    className="w-full rounded-xl border border-input bg-background py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <button
                  onClick={handleRegister}
                  disabled={busy}
                  className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {busy ? "Creating account..." : "Create Account"}
                </button>
                <p className="mt-5 text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    Log in
                  </button>
                </p>
              </>
            )}
          </div>
        </div>

        {/* USSD panel */}
        <div className="hidden flex-1 items-start justify-end lg:flex lg:pt-16">
          <UssdPanel />
        </div>
      </div>
    </section>
  );
}

function UssdPanel() {
  return (
    <div className="flex max-w-md flex-col gap-4 rounded-3xl bg-forest-deep/60 p-6 backdrop-blur">
      <div>
        <h3 className="text-xl font-bold text-white">USSD Access for Every Farmer</h3>
        <p className="mt-1 text-sm text-white/75">
          No smartphone? No problem. Use your basic phone to buy and sell agricultural waste.
        </p>
      </div>
      <div className="flex gap-4">
        <div className="w-44 shrink-0 rounded-[1.8rem] border-4 border-neutral-900 bg-neutral-900 p-1 shadow-xl">
          <div className="overflow-hidden rounded-[1.3rem] bg-white">
            <div className="bg-primary py-1.5 text-center text-[10px] font-bold text-primary-foreground">
              Takathamani
            </div>
            <div className="space-y-0.5 p-2 text-[9px] leading-relaxed text-foreground">
              <p className="font-bold">1. Register</p>
              <p>2. Sell Waste</p>
              <p>3. Buy Waste</p>
              <p>4. My Listings</p>
              <p>5. My Earnings</p>
              <p>6. Help</p>
              <p className="pt-1 font-bold">* Back&nbsp;&nbsp;&nbsp;&nbsp;# Main</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 p-1.5">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((k) => (
              <span
                key={k}
                className="rounded-md bg-neutral-800 py-1 text-center text-[9px] font-bold text-neutral-200"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-2.5 self-center">
          {[
            { icon: Inbox, label: "Simple Menu" },
            { icon: PhoneCall, label: "Local Languages" },
            { icon: Sparkles, label: "SMS Updates" },
            { icon: Wallet, label: "Mobile Money Payments" },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2"
            >
              <f.icon className="h-4 w-4 text-lime" />
              <span className="text-xs font-medium text-white">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto flex items-center gap-2 rounded-full bg-primary px-4 py-2">
        <Leaf className="h-4 w-4 text-primary-foreground" />
        <span className="text-xs font-bold text-primary-foreground">Accessible. Inclusive. For All.</span>
      </div>
    </div>
  );
}

function UniqueSection() {
  return (
    <section className="bg-background py-12">
      <div className="mx-auto grid max-w-[1400px] gap-6 px-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground">What Makes Takathamani Unique?</h2>
          <div className="mt-5 grid gap-x-8 gap-y-6 rounded-3xl border border-border bg-card p-8 sm:grid-cols-2 xl:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <f.icon className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">{f.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-3xl bg-forest p-6 text-primary-foreground">
          <h3 className="text-2xl font-extrabold leading-snug">
            Healthy Farms. <br />
            Clean Environment. <br />
            Stronger Communities.
          </h3>
          <div className="mt-6 flex items-center gap-2 self-start rounded-full bg-primary px-4 py-2">
            <User className="h-4 w-4" />
            <span className="text-xs font-bold">Together for a Circular Economy</span>
          </div>
        </div>
      </div>
    </section>
  );
}
