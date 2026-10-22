import { createFileRoute } from "@tanstack/react-router";

/**
 * USSD demo endpoint (Africa's Talking style callback).
 * External gateways POST phoneNumber + text; we return a menu string.
 * This is a public route: it only echoes marketplace menus, never private data.
 */
export const Route = createFileRoute("/api/public/ussd")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.formData().catch(() => null);
        const text = String(body?.get("text") ?? "").trim();
        const steps = text === "" ? [] : text.split("*");

        let response = "";
        if (steps.length === 0) {
          response = [
            "CON Takathamani",
            "1. Register",
            "2. Sell Waste",
            "3. Buy Waste",
            "4. My Listings",
            "5. My Earnings",
            "6. Help",
          ].join("\n");
        } else if (steps[0] === "2") {
          if (steps.length === 1) {
            response = ["CON Select waste type:", "1. Maize Cobs", "2. Rice Husk", "3. Sugarcane Bagasse", "4. Other"].join("\n");
          } else if (steps.length === 2) {
            response = "CON Enter quantity in tons:";
          } else if (steps.length === 3) {
            response = "CON Enter location (e.g. Nakuru - Rongai):";
          } else if (steps.length === 4) {
            response = "CON Enter expected price per ton (KSh):";
          } else {
            response = "END Listing saved! Buyers will see it in the marketplace.";
          }
        } else if (steps[0] === "1") {
          response = "END Registration is available on the Takathamani app or website. Dial again with your registered number.";
        } else {
          response = "END Thank you for using Takathamani.";
        }

        return new Response(response, {
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      },
    },
  },
});
