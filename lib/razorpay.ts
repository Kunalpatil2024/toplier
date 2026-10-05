import "server-only";

import Razorpay from "razorpay";

export function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  if (!keyId || !keySecret || !publicKeyId) {
    throw new Error("Razorpay TEST credentials are not configured.");
  }
  if (!keyId.startsWith("rzp_test_") || publicKeyId !== keyId) {
    throw new Error("Only matching Razorpay TEST credentials are supported.");
  }

  return { keyId, keySecret, publicKeyId };
}

export function getRazorpayClient() {
  const { keyId, keySecret } = getRazorpayConfig();
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}
