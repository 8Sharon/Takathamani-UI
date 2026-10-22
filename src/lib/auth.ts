import { supabase } from "@/integrations/supabase/client";

/**
 * Farmers sign in with a mobile number + 4-digit PIN (as shown on the login
 * card). Auth credentials need an email, so we derive a deterministic
 * synthetic address from the digits: <digits>@takathamani.app. The phone
 * number stays display-only profile data — it is never a credential lookup.
 */
export function phoneToEmail(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  return `${digits}@takathamani.app`;
}

export async function signInWithPhone(phone: string, pin: string) {
  return supabase.auth.signInWithPassword({
    email: phoneToEmail(phone),
    password: pin,
  });
}

export interface SignUpInput {
  phone: string;
  pin: string;
  fullName: string;
  county: string;
  role: "farmer" | "buyer" | "admin";
}

export async function signUpWithPhone(input: SignUpInput) {
  return supabase.auth.signUp({
    email: phoneToEmail(input.phone),
    password: input.pin,
    options: {
      data: {
        full_name: input.fullName,
        county: input.county,
        phone: input.phone,
        role: input.role,
      },
    },
  });
}

export async function signOut() {
  await supabase.auth.signOut();
}
