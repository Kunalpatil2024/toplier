import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getRazorpayClient, getRazorpayConfig } from "@/lib/razorpay";
import { getSupabaseAdminClient, getSupabaseServerClient, isUuid } from "@/lib/supabase";

export const runtime = "nodejs";

type VerificationRequest = {
  razorpay_order_id?: unknown;
  razorpay_payment_id?: unknown;
  razorpay_signature?: unknown;
};

function hasValidSignature(orderId: string, paymentId: string, signature: string, secret: string) {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest();
  const provided = Buffer.from(signature, "hex");
  return provided.length === expected.length && timingSafeEqual(expected, provided);
}

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
    return Response.json({ error: "Sign in to verify this payment." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid payment verification request." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid payment verification request." }, { status: 400 });
  }
  const verification = body as VerificationRequest;
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = verification;
  if (
    typeof orderId !== "string" || !/^order_[A-Za-z0-9]+$/.test(orderId) ||
    typeof paymentId !== "string" || !/^pay_[A-Za-z0-9]+$/.test(paymentId) ||
    typeof signature !== "string"
  ) {
    return Response.json({ error: "Invalid Razorpay payment details." }, { status: 400 });
  }

  let razorpay: ReturnType<typeof getRazorpayClient>;
  let keySecret: string;
  try {
    razorpay = getRazorpayClient();
    ({ keySecret } = getRazorpayConfig());
  } catch {
    return Response.json({ error: "Server payment configuration is incomplete." }, { status: 503 });
  }
  if (!hasValidSignature(orderId, paymentId, signature, keySecret)) {
    return Response.json({ error: "The Razorpay payment signature is invalid." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return Response.json({ error: "Server payment configuration is incomplete." }, { status: 503 });
  }

  const { data: existingPayment, error: duplicateCheckError } = await admin
    .from("climb_events")
    .select("id")
    .eq("razorpay_payment_id", paymentId)
    .maybeSingle();
  if (duplicateCheckError) {
    return Response.json({ error: "Could not verify this payment. Please try again." }, { status: 500 });
  }
  if (existingPayment) {
    return Response.json({ error: "This payment has already been processed." }, { status: 409 });
  }

  try {
    const [order, payment] = await Promise.all([
      razorpay.orders.fetch(orderId),
      razorpay.payments.fetch(paymentId),
    ]);
    const notes = order.notes;
    const listingId = typeof notes?.listing_id === "string" ? notes.listing_id : "";
    const orderUserId = typeof notes?.user_id === "string" ? notes.user_id : "";
    const targetRankValue = Number(notes?.target_rank_value);

    if (
      order.id !== orderId ||
      !isUuid(listingId) ||
      orderUserId !== user.id ||
      !Number.isSafeInteger(targetRankValue) ||
      targetRankValue <= 0 ||
      order.amount !== targetRankValue * 100 ||
      order.currency !== "INR"
    ) {
      return Response.json({ error: "The order amount or listing details are invalid." }, { status: 400 });
    }
    if (
      payment.id !== paymentId ||
      payment.order_id !== orderId ||
      payment.amount !== order.amount ||
      payment.currency !== order.currency
    ) {
      return Response.json({ error: "The payment amount or order details are invalid." }, { status: 400 });
    }
    if (order.status !== "paid" || payment.status !== "captured" || !payment.captured) {
      return Response.json({ error: "Razorpay has not captured this payment." }, { status: 409 });
    }

    const { data, error } = await admin.rpc("complete_paid_climb", {
      p_listing_id: listingId,
      p_user_id: user.id,
      p_new_rank_value: targetRankValue,
      p_razorpay_payment_id: paymentId,
      p_razorpay_order_id: orderId,
    });
    if (error) {
      if (error.code === "23505") {
        return Response.json({ error: "This payment has already been processed." }, { status: 409 });
      }
      if (["22023", "42501", "P0002"].includes(error.code ?? "")) {
        return Response.json({
          error: "The leaderboard changed before verification. Your rank was not updated; please contact support about this payment.",
        }, { status: 409 });
      }
      return Response.json({ error: "Payment verified, but the climb could not be recorded. Please contact support." }, { status: 500 });
    }
    if (!data?.length) {
      return Response.json({ error: "Payment verified, but the climb could not be recorded. Please contact support." }, { status: 500 });
    }

    revalidatePath("/");
    revalidatePath(`/listing/${listingId}`);
    revalidatePath("/categories");
    revalidatePath("/admin");
    return Response.json({ success: true, newRankValue: data[0].new_rank_value });
  } catch {
    return Response.json({ error: "Could not verify this payment with Razorpay. Please try again." }, { status: 502 });
  }
}
