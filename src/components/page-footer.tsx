import { Leaf } from "lucide-react";

export function PageFooter() {
  return (
    <footer className="w-full bg-[#061d10] border-t border-emerald-900/40 text-white py-6 px-4 mt-auto">
      <div className="mx-auto max-w-5xl flex flex-col items-center justify-center text-center space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 shadow-sm">
            <Leaf className="h-4.5 w-4.5 fill-emerald-500/30 text-emerald-400" />
          </div>
          <div className="text-left">
            <h3 className="text-base font-extrabold tracking-tight text-white leading-tight">
              Takathamani
            </h3>
            <p className="text-xs text-emerald-200/80 font-medium">
              Inclusive Agricultural-Waste Marketplace
            </p>
          </div>
        </div>

        <p className="text-[11px] text-emerald-300/60 font-medium tracking-wide">
          © 2026 Takathamani • Inclusive Agritech
        </p>
      </div>
    </footer>
  );
}
