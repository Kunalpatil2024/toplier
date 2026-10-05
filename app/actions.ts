"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase";
import { validateListingInput } from "@/lib/validations";

export type ActionState = {
  error?: string;
  success?: string;
  message?: string;
};

function getFriendlyAuthError(message: string, mode: "sign-in" | "sign-up"): string {
  const normalized = message.toLowerCase();

  if (/rate limit|too many requests|email rate limit/.test(normalized)) {
    return mode === "sign-in"
      ? "Too many sign-in emails were sent to this address. Please wait a few minutes and try again."
      : "Too many sign-up emails were sent to this address. Please wait a few minutes and try again.";
  }

  if (/user not found|no user|sign in disabled|signup.*disabled/.test(normalized)) {
    return mode === "sign-in"
      ? "We couldn't find an account for that email. Try signing up first."
      : "We couldn't create an account right now. Please try again.";
  }

  return mode === "sign-in"
    ? "Could not send a sign-in link. Please try again."
    : "Could not send a sign-up link. Please try again.";
}

export async function sendSignInLinkAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const requestHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  let redirectTo: string;

  try {
    const originUrl = new URL(origin ?? `http://${requestHost}`);
    if (!requestHost || originUrl.host !== requestHost || !["http:", "https:"].includes(originUrl.protocol)) {
      return { error: "Could not verify this sign-in request. Reload the page and try again." };
    }
    redirectTo = new URL("/auth/callback", originUrl).toString();
  } catch {
    return { error: "Could not determine the sign-in callback URL." };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
  });

  if (error) return { error: getFriendlyAuthError(error.message, "sign-in") };
  return { message: "If this email belongs to an account, a sign-in link is on its way." };
}

export async function sendSignUpLinkAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured." };

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const requestHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  let redirectTo: string;

  try {
    const originUrl = new URL(origin ?? `http://${requestHost}`);
    if (!requestHost || originUrl.host !== requestHost || !["http:", "https:"].includes(originUrl.protocol)) {
      return { error: "Could not verify this sign-up request. Reload the page and try again." };
    }
    redirectTo = new URL("/auth/callback", originUrl).toString();
  } catch {
    return { error: "Could not determine the sign-up callback URL." };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
  });

  if (error) return { error: getFriendlyAuthError(error.message, "sign-up") };
  return { message: "If you can sign up with this email, a verification link is on its way." };
}

export async function signOutAction() {
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(`Could not sign out: ${error.message}`);
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function createListingAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const validation = validateListingInput(formData);
  if (!validation.ok) return { error: validation.error };
  const input = validation.data;

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return { error: "Supabase is not configured." };
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) return { error: `Could not verify your sign-in: ${authError.message}` };
  if (!user) return { error: "Sign in before submitting a listing." };

  const { data, error } = await supabase.rpc("create_listing", {
    p_name: input.name,
    p_description: input.description,
    p_website_url: input.websiteUrl,
    p_category: input.category,
    p_twitter_url: input.twitterUrl,
    p_logo_url: input.logoUrl,
    p_rank_value: input.rankValue,
  });

  if (error || !data) {
    return { error: error?.message ?? "The listing could not be saved. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/categories");
  revalidatePath("/admin");
  redirect(`/listing/${data}?created=1`);
}
