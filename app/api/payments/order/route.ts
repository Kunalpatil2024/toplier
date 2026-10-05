import { randomUUID } from "node:crypto";
import { getRazorpayClient, getRazorpayConfig } from "@/lib/razorpay";
import { getSupabaseAdminClient, getSupabaseServerClient, isUuid } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return Response.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    return Response.json({ error: "Could not verify your sign-in." }, { status: 401 });
  }
  if (!user) {
    return Response.json({ error: "Sign in to climb your listing." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid order request." }, { status: 400 });
  }
  const listingId =
    body && typeof body === "object" && "listingId" in body && typeof body.listingId === "string"
      ? body.listingId
      : "";
  if (!isUuid(listingId)) {
    return Response.json({ error: "This listing cannot be climbed." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return Response.json({ error: "Server payment configuration is incomplete." }, { status: 503 });
  }

  const { data: listing, error: listingError } = await admin
    .from("listings")
    .select("id, rank_value, owner_id")
    .eq("id", listingId)
    .maybeSingle();
  if (listingError) {
    return Response.json({ error: "Could not load this listing." }, { status: 500 });
  }
  if (!listing) return Response.json({ error: "Listing not found." }, { status: 404 });
  if (listing.owner_id !== user.id) {
    return Response.json({ error: "You can only climb a listing you own." }, { status: 403 });
  }

  const { data: leader, error: leaderError } = await admin
    .from("listings")
    .select("id, rank_value")
    .order("rank_value", { ascending: false })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (leaderError) {
    return Response.json({ error: "Could not load the current leaderboard." }, { status: 500 });
  }
  if (!leader) return Response.json({ error: "There are no listings to climb." }, { status: 409 });
  if (leader.id === listing.id) {
    return Response.json({ error: "This listing is already #1." }, { status: 409 });
  }

  const { data: settings, error: settingsError } = await admin
    .from("leaderboard_settings")
    .select("minimum_increment")
    .eq("id", true)
    .maybeSingle();
  if (settingsError || !settings) {
    return Response.json({ error: "Could not load the current climb requirements." }, { status: 500 });
  }

  const targetRankValue = leader.rank_value + settings.minimum_increment;
  if (!Number.isSafeInteger(targetRankValue) || targetRankValue > 1_000_000_000) {
    return Response.json({ error: "The required climb value is outside the supported range." }, { status: 409 });
  }

  let razorpay: ReturnType<typeof getRazorpayClient>;
  let publicKeyId: string;
  try {
    razorpay = getRazorpayClient();
    ({ publicKeyId } = getRazorpayConfig());
  } catch {
    return Response.json({ error: "Server payment configuration is incomplete." }, { status: 503 });
  }

  try {
    const order = await razorpay.orders.create({
      amount: targetRankValue * 100,
      currency: "INR",
      receipt: `climb_${randomUUID().replaceAll("-", "")}`,
      notes: {
        listing_id: listing.id,
        user_id: user.id,
        target_rank_value: String(targetRankValue),
      },
    });

    return Response.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: publicKeyId,
    });
  } catch {
    return Response.json({ error: "Could not create a test payment order. Please try again." }, { status: 502 });
  }
}
