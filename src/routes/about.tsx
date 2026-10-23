import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ClipboardList,
  Sparkles,
  Wallet,
  TrendingUp,
  Boxes,
  Route as RouteIcon,
  Leaf,
  PhoneCall,
  Inbox,
  Users,
  HeartHandshake,
  Sprout,
  Recycle,
} from "lucide-react";
import heroImg from "@/assets/hero-farmer.jpg";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { LeafLogo } from "@/components/leaf-logo";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Takathamani" },
      {
        name: "description",
        content:
          "Takathamani is the inclusive agricultural-waste marketplace: healthy farms, clean environment, stronger communities. Learn our mission, how it works and USSD access for every farmer.",
      },
      { property: "og:title", content: "About Us — Takathamani" },
      {
        property: "og:description",
        content:
          "Healthy Farms. Clean Environment. Stronger Communities. Together for a Circular Economy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Waste-to-Value Matching",
    body: "Right material, right buyer, right price.",
  },
  {
    icon: TrendingUp,
    title: "Predictive Analytics",
    body: "Uses crop calendars, weather & farm data to forecast waste availability.",
  },
  {
    icon: Boxes,
    title: "Smart Aggregation",
    body: "Combines small quantities from many farmers for bigger buyers.",
  },
  {
    icon: RouteIcon,
    title: "Optimized Collection Routes",
    body: "Reduces transport costs and carbon footprint.",
  },
  {
    icon: Leaf,
    title: "Impact Tracking",
    body: "Measures waste recovered, CO₂ avoided and farmer earnings.",
  },
  { icon: PhoneCall, title: "USSD + Voice Access", body: "In local languages for true inclusion." },
  { icon: Wallet, title: "Mobile Money", body: "Secure and fast payments." },
];

const STEPS = [
  {
    icon: ClipboardList,
    title: "List Your Waste",
    body: "Add your maize cobs, rice husk, bagasse or other farm waste — quantity, location and price. No smartphone needed, dial *000# instead.",
  },
  {
    icon: Sparkles,
    title: "Get Smart Matches",
    body: "Our AI matches your waste with verified buyers by type, quantity, location, price and quality — then optimizes the collection route.",
  },
  {
    icon: Wallet,
    title: "Get Paid",
    body: "Buyers confirm delivery and payment lands straight in your mobile money wallet. Track every shilling under Transactions.",
  },
];

const TRUST = [
  { icon: Inbox, title: "More income", body: "for farmers" },
  { icon: Recycle, title: "Clean environment", body: "for a healthier planet" },
  { icon: Sprout, title: "A circular economy", body: "for a sustainable future" },
];

const VALUES = [
  {
    icon: Users,
    title: "Inclusion first",
    body: "Every farmer trades on Takathamani — smartphone or not, in the language they speak.",
  },
  {
    icon: HeartHandshake,
    title: "Fair deals",
    body: "Transparent prices and verified buyers mean farmers keep more of the value they create.",
  },
  {
    icon: Leaf,
    title: "Planet-positive",
    body: "Every ton recovered keeps fields clean and carbon out of the atmosphere.",
  },
];

function AboutPage() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!cancelled) setSignedIn(!!data.user);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const content = <AboutContent signedIn={signedIn} />;
  // Signed-in visitors keep the app sidebar so they never have to go "back home".
  if (signedIn) return <AppShell>{content}</AppShell>;
  return content;
}

function AboutContent({ signedIn }: { signedIn: boolean }) {
  return (
    <div className={signedIn ? "w-full" : "min-h-screen w-full bg-background"}>
      {/* Header — only on the public page; the signed-in view uses the app topbar */}
      {!signedIn && (
        <header className="absolute inset-x-0 top-0 z-20">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <Link to="/" className="flex items-center gap-3">
              <LeafLogo className="h-10 w-10" />
              <div>
                <p className="text-lg font-extrabold leading-none text-white">Takathamani</p>
                <p className="mt-0.5 text-[11px] text-white/75">
                  Inclusive Agricultural-Waste Marketplace
                </p>
              </div>
            </Link>
            <Link
              to="/"
              className="rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white backdrop-blur transition-colors hover:bg-white/25"
            >
              Back to Home
            </Link>
          </div>
        </header>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={heroImg}
          alt="Farmer holding maize harvest in a green field"
          className="absolute inset-0 h-full w-full object-cover object-[60%_center]"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-deep/95 via-forest/70 to-forest-deep/50" />
        <div
          className={`relative mx-auto max-w-6xl px-6 pb-16 sm:pb-20 ${
            signedIn ? "pt-12 sm:pt-14" : "pt-32 sm:pt-40"
          }`}
        >
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            Healthy Farms. <br />
            Clean Environment. <br />
            <span className="text-lime">Stronger Communities.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
            Takathamani is an inclusive agricultural-waste marketplace. We link farmers directly
            with verified buyers of maize cobs, rice husk, bagasse and more — turning what used to
            be burned or dumped into income, clean energy and a circular economy for Kenya.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            {TRUST.map((t) => (
              <div key={t.title} className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lime">
                  <t.icon className="h-5 w-5" />
                </span>
                <div className="text-xs leading-snug">
                  <p className="font-semibold text-white">{t.title}</p>
                  <p className="text-white/80">{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-background py-14">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-extrabold text-foreground">How Takathamani Works</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Three simple steps from farm waste to mobile-money income.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="text-3xl font-extrabold text-muted/80">{i + 1}</span>
                </div>
                <p className="mt-4 text-base font-bold text-foreground">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Unique features */}
      <section className="bg-secondary/40 py-14">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-extrabold text-foreground">
            What Makes Takathamani Unique?
          </h2>
          <div className="mt-6 grid gap-x-8 gap-y-6 rounded-3xl border border-border bg-card p-8 sm:grid-cols-2 xl:grid-cols-4">
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
      </section>

      {/* USSD access */}
      <section className="bg-forest-deep py-14">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold text-white">USSD Access for Every Farmer</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">
              No smartphone? No problem. Use your basic phone to buy and sell agricultural waste —
              register, list waste, view earnings and get SMS updates in your local language.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                "Works on any basic phone — no internet required",
                "Simple numbered menus in English & Kiswahili",
                "SMS notifications for offers and payments",
                "Mobile money payouts straight to your phone",
              ].map((li) => (
                <li key={li} className="flex items-center gap-2.5 text-sm text-white/90">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Leaf className="h-3.5 w-3.5" />
                  </span>
                  {li}
                </li>
              ))}
            </ul>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">
              <PhoneCall className="h-4 w-4" />
              Dial *000# to get started
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm rounded-3xl bg-white/5 p-6 backdrop-blur">
            <div className="mx-auto w-44 rounded-[1.8rem] border-4 border-neutral-900 bg-neutral-900 p-1 shadow-xl">
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
            <p className="mt-4 text-center text-xs font-bold text-white">
              Accessible. Inclusive. For All.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-background py-14">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-extrabold text-foreground">What We Stand For</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <v.icon className="h-5 w-5" />
                </span>
                <p className="mt-4 text-base font-bold text-foreground">{v.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision CTA */}
      <section className="bg-forest py-14">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 sm:flex-row sm:items-center">
          <h2 className="max-w-md text-3xl font-extrabold leading-snug text-primary-foreground">
            Together for a Circular Economy
          </h2>
          <div className="flex flex-col items-start gap-4">
            <p className="text-sm text-primary-foreground/80">
              Join thousands of farmers turning waste into value.
            </p>
            <Link
              to={signedIn ? "/dashboard" : "/"}
              className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {signedIn ? "Go to Dashboard" : "Get Started"}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-forest-deep py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 text-center">
          <div className="flex items-center gap-3">
            <LeafLogo className="h-10 w-10" />
            <div className="text-left">
              <p className="text-lg font-bold text-primary-foreground">Takathamani</p>
              <p className="text-xs text-primary-foreground/70">
                Inclusive Agricultural-Waste Marketplace
              </p>
            </div>
          </div>
          <p className="text-xs text-primary-foreground/60">
            © {new Date().getFullYear()} Takathamani • Inclusive Agritech
          </p>
        </div>
      </footer>
    </div>
  );
}
