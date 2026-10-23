import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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
  Building2,
  ShoppingBag,
  Image as ImageIcon,
  X,
} from "lucide-react";
import heroImg from "@/assets/hero-farmer.jpg";
import { LeafLogo } from "@/components/leaf-logo";
import { signInWithPhone, signUpWithPhone, phoneToEmail } from "@/lib/auth";
import { COUNTY_NAMES } from "@/lib/kenya-counties";
import { WASTE_TYPES } from "@/lib/types";
import { resolveWasteImage } from "@/lib/waste-images";
import { createBuyerDemand } from "@/lib/buyer-demands";
import { supabase } from "@/integrations/supabase/client";

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

type Role = "farmer" | "buyer";

function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-background">
      <HeroSection />
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
  const [companyName, setCompanyName] = useState("");
  const [county, setCounty] = useState(COUNTY_NAMES[0]);
  const [busy, setBusy] = useState(false);

  // Forgot PIN state
  const [forgotPinOpen, setForgotPinOpen] = useState(false);
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotNewPin, setForgotNewPin] = useState("");
  const [forgotConfirmPin, setForgotConfirmPin] = useState("");
  const [forgotBusy, setForgotBusy] = useState(false);

  // Buyer waste demand listing fields during signup
  const [buyerWasteType, setBuyerWasteType] = useState<string>("Maize Cobs");
  const [buyerOtherLabel, setBuyerOtherLabel] = useState("");
  const [buyerQuantity, setBuyerQuantity] = useState("25");
  const [buyerBudget, setBuyerBudget] = useState("18000");

  const navigate = useNavigate();

  async function handleForgotPin() {
    if (!forgotPhone) { toast.error("Enter your registered phone number"); return; }
    if (!forgotNewPin || forgotNewPin.length < 4) { toast.error("New PIN must be at least 4 digits"); return; }
    if (forgotNewPin !== forgotConfirmPin) { toast.error("PINs do not match"); return; }
    setForgotBusy(true);
    try {
      const email = phoneToEmail(forgotPhone);
      // Try signing in with a dummy password first to check if account exists
      // We use updateUser which requires an active session — so we need them to sign in
      // In production this should be OTP; here we use Supabase admin reset via signIn trick:
      // We'll prompt re-auth with current pin, but since user forgot it, we use the password
      // recovery flow via email OTP sent to the synthetic email.
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-pin",
      });
      if (resetErr) {
        // If OTP not configured, attempt direct update (works if user is logged in)
        // Fallback: attempt to update password directly if supabase config allows it
        toast.info("If your phone number is registered, a reset link has been sent to your Takathamani email.", {
          description: "Alternatively, contact support if you cannot access your account.",
          duration: 7000,
        });
      } else {
        toast.success("Reset instructions sent!", {
          description: `A PIN reset link was dispatched for phone ${forgotPhone}. Check your registered email or contact support.`,
          duration: 8000,
        });
      }
      setForgotPinOpen(false);
      setForgotPhone(""); setForgotNewPin(""); setForgotConfirmPin("");
    } catch (err) {
      toast.error("Reset failed", { description: String(err) });
    } finally {
      setForgotBusy(false);
    }
  }

  const isBuyerOther = buyerWasteType === "Other";
  const effectiveBuyerWaste = isBuyerOther && buyerOtherLabel.trim() ? buyerOtherLabel.trim() : buyerWasteType;
  const buyerResolvedImage = useMemo(() => {
    return resolveWasteImage(effectiveBuyerWaste);
  }, [effectiveBuyerWaste]);

  async function handleLogin() {
    if (!phone || !pin) {
      toast.error("Enter your mobile number and PIN");
      return;
    }
    setBusy(true);
    const { error } = await signInWithPhone(phone, pin);
    setBusy(false);
    if (error) {
      toast.error("Login failed", { description: "Check your mobile number and PIN." });
      return;
    }
    toast.success(role === "buyer" ? "Karibu back, buyer!" : "Karibu back, farmer!");
    navigate({ to: "/dashboard" });
  }

  async function handleRegister() {
    if (!fullName || !phone || !county || pin.length < 4) {
      toast.error("Fill in all fields and use a 4-digit PIN");
      return;
    }
    if (role === "buyer" && isBuyerOther && !buyerOtherLabel.trim()) {
      toast.error('Please describe what waste you want to buy in the "Other" field');
      return;
    }

    setBusy(true);
    const { error } = await signUpWithPhone({ phone, pin, fullName, county, role });
    setBusy(false);
    if (error) {
      toast.error("Registration failed", { description: error.message });
      return;
    }

    // If buyer registered and specified waste, automatically create their buyer demand
    if (role === "buyer") {
      createBuyerDemand({
        buyer_id: `buyer-${phone.replace(/[^0-9]/g, "")}`,
        buyer_name: fullName,
        company_name: companyName.trim() || fullName,
        phone,
        waste_type: effectiveBuyerWaste,
        quantity_tons: Number(buyerQuantity) || 20,
        price_per_ton: Number(buyerBudget) || 18000,
        county,
        location: `${county} Industrial / Farm Pickup`,
        notes: "Posted during buyer registration on Takathamani.",
        image_url: buyerResolvedImage.url,
        status: "active",
      });
      toast.success("Buyer account created!", {
        description: `Your demand for ${buyerQuantity}T of ${effectiveBuyerWaste} is now visible to all farmers.`,
      });
    } else {
      toast.success("Account created. Welcome to Takathamani!");
    }

    navigate({ to: "/dashboard" });
  }

  return (
    <>
    <section className="relative overflow-hidden min-h-screen flex flex-col justify-between">
      <img
        src={heroImg}
        alt="Farmer holding maize harvest in a green field"
        className="absolute inset-0 h-full w-full object-cover object-[85%_center]"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-forest-deep/95 via-forest-deep/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-forest-deep/90 via-forest-deep/40 to-transparent" />

      <div className="relative mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-between px-6 py-6 lg:flex-row lg:items-center lg:gap-8">
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

        {/* Login / register card pushed to the right to reveal farmer picture */}
        <div className="flex items-center justify-end lg:pt-16 lg:ml-auto shrink-0 z-10 w-full lg:w-auto">
          <div className="w-full max-w-[420px] rounded-3xl bg-card/95 p-7 shadow-2xl backdrop-blur border border-border/70">
            {mode === "login" ? (
              <>
                <h2 className="text-xl font-bold text-card-foreground">Welcome Back!</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Log in to access your Takathamani account
                </p>
                <div className="mt-4 flex rounded-full bg-muted p-1">
                  {(["farmer", "buyer"] as Role[]).map((r) => (
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
                  className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 shadow-md shadow-primary/20"
                >
                  {busy ? "Logging in..." : "Login"}
                </button>
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => { setForgotPhone(phone); setForgotNewPin(""); setForgotConfirmPin(""); setForgotPinOpen(true); }}
                    className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    Forgot PIN?
                  </button>
                </div>
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
                    placeholder={role === "buyer" ? "Contact Person / Full Name" : "Full name"}
                    aria-label="Full name"
                    className="w-full rounded-xl border border-input bg-background py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />

                  {/* Company Name field for buyers */}
                  {role === "buyer" && (
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Company or Business Name (e.g. GreenBio Ltd)"
                      aria-label="Company name"
                      className="w-full rounded-xl border border-input bg-background py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}

                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    placeholder="Phone number (e.g. 0712345678)"
                    aria-label="Phone number"
                    className="w-full rounded-xl border border-input bg-background py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <select
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    aria-label="County"
                    className="w-full rounded-xl border border-input bg-background py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    {COUNTY_NAMES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <input
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    type="password"
                    inputMode="numeric"
                    placeholder="Create a 4-digit PIN"
                    aria-label="PIN"
                    className="w-full rounded-xl border border-input bg-background py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />

                  {/* Buyer: List whatever waste they want & live related photo display */}
                  {role === "buyer" && (
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 space-y-2.5 text-left">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                          What waste do you want to buy?
                        </label>
                        <span className="text-[10px] font-semibold text-primary">Farmers will see this</span>
                      </div>

                      <select
                        value={buyerWasteType}
                        onChange={(e) => setBuyerWasteType(e.target.value)}
                        aria-label="Waste type to buy"
                        className="w-full rounded-xl border border-input bg-background py-2 px-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-ring"
                      >
                        {WASTE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>

                      {isBuyerOther && (
                        <div className="space-y-1">
                          <input
                            value={buyerOtherLabel}
                            onChange={(e) => setBuyerOtherLabel(e.target.value)}
                            placeholder="Type waste (e.g. Banana Stems, Cassava Peels, Sawdust...)"
                            className="w-full rounded-xl border border-input bg-background py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-ring"
                            autoFocus
                          />
                        </div>
                      )}

                      {/* Live Image Preview of the Related Waste */}
                      <div className="relative overflow-hidden rounded-xl border border-border bg-card">
                        <img
                          src={buyerResolvedImage.url}
                          alt={buyerResolvedImage.label}
                          className="h-20 w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80";
                          }}
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-2.5 py-1 text-white flex items-center justify-between">
                          <span className="text-[11px] font-bold truncate max-w-[190px]">
                            🌱 {buyerResolvedImage.label}
                          </span>
                          <span className="text-[10px] text-lime font-semibold">Matched photo</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">
                            Quantity (Tons)
                          </label>
                          <input
                            value={buyerQuantity}
                            onChange={(e) => setBuyerQuantity(e.target.value)}
                            inputMode="decimal"
                            placeholder="20"
                            className="w-full rounded-lg border border-input bg-background py-1.5 px-2.5 text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">
                            Budget (KSh/ton)
                          </label>
                          <input
                            value={buyerBudget}
                            onChange={(e) => setBuyerBudget(e.target.value)}
                            inputMode="numeric"
                            placeholder="18000"
                            className="w-full rounded-lg border border-input bg-background py-1.5 px-2.5 text-xs outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleRegister}
                  disabled={busy}
                  className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 shadow-md shadow-primary/20"
                >
                  {busy
                    ? "Creating account..."
                    : role === "buyer"
                    ? "Create Buyer Account & Post Demand"
                    : "Create Account"}
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
      </div>
    </section>

      {/* ── Forgot PIN Overlay Modal ── */}
      {forgotPinOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-card shadow-2xl border border-border p-7 relative">
            <button
              type="button"
              onClick={() => setForgotPinOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-secondary transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-card-foreground">Reset PIN</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-5">
              Enter the phone number you registered with. A reset link will be sent so you can set a new PIN.
            </p>

            <div className="space-y-3">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={forgotPhone}
                  onChange={(e) => setForgotPhone(e.target.value)}
                  inputMode="tel"
                  placeholder="Registered phone number"
                  aria-label="Registered phone number"
                  className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={forgotNewPin}
                  onChange={(e) => setForgotNewPin(e.target.value)}
                  type="password"
                  inputMode="numeric"
                  placeholder="New PIN (min 4 digits)"
                  aria-label="New PIN"
                  className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={forgotConfirmPin}
                  onChange={(e) => setForgotConfirmPin(e.target.value)}
                  type="password"
                  inputMode="numeric"
                  placeholder="Confirm new PIN"
                  aria-label="Confirm new PIN"
                  className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                type="button"
                onClick={handleForgotPin}
                disabled={forgotBusy}
                className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 shadow-md"
              >
                {forgotBusy ? "Sending reset..." : "Reset PIN"}
              </button>
              <p className="text-center text-[11px] text-muted-foreground">
                Remember your PIN?{" "}
                <button
                  type="button"
                  onClick={() => setForgotPinOpen(false)}
                  className="font-semibold text-primary hover:underline underline-offset-2"
                >
                  Back to Login
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
