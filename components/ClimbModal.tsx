"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, LoaderCircle, X } from "lucide-react";

type ClimbModalProps = {
  listingId: string;
  requiredAmount: number;
  disabled?: boolean;
};

type CheckoutOrder = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
};

type CheckoutResult = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  handler: (result: CheckoutResult) => void;
  modal: { ondismiss: () => void };
};

type RazorpayCheckout = {
  open: () => void;
  on: (event: "payment.failed", callback: (response: { error?: { description?: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayCheckout;
  }
}

let checkoutScriptPromise: Promise<void> | null = null;

function loadRazorpayCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (!checkoutScriptPromise) {
    checkoutScriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => window.Razorpay
        ? resolve()
        : reject(new Error("Razorpay Checkout could not be initialized."));
      script.onerror = () => reject(new Error("Razorpay Checkout could not be loaded."));
      document.body.appendChild(script);
    }).catch((error: unknown) => {
      checkoutScriptPromise = null;
      throw error;
    });
  }
  return checkoutScriptPromise;
}

async function readApiError(response: Response, fallback: string) {
  try {
    const body: { error?: unknown } = await response.json();
    if (typeof body.error === "string") return body.error;
  } catch {
    return fallback;
  }
  return fallback;
}

export default function ClimbModal({ listingId, requiredAmount, disabled = false }: ClimbModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentRequiredAmount, setCurrentRequiredAmount] = useState(requiredAmount);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  async function startPayment() {
    setIsPending(true);
    setError("");
    setSuccess("");

    try {
      const orderResponse = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (!orderResponse.ok) {
        throw new Error(await readApiError(orderResponse, "Could not create a payment order."));
      }
      const order = await orderResponse.json() as CheckoutOrder;
      if (
        typeof order.orderId !== "string" ||
        typeof order.keyId !== "string" ||
        !order.keyId.startsWith("rzp_test_") ||
        !Number.isSafeInteger(order.amount) ||
        order.amount <= 0 ||
        order.currency !== "INR"
      ) {
        throw new Error("The payment order details are invalid.");
      }
      setCurrentRequiredAmount(order.amount / 100);
      await loadRazorpayCheckout();
      if (!window.Razorpay) throw new Error("Razorpay Checkout is unavailable.");

      const checkout = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "Toplier",
        description: "Climb the leaderboard",
        handler: async (result) => {
          setIsPending(true);
          setError("");
          try {
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(result),
            });
            if (!verifyResponse.ok) {
              throw new Error(await readApiError(verifyResponse, "Could not verify the payment."));
            }
            setSuccess("Payment verified. Your climb is recorded.");
            router.refresh();
          } catch (verificationError) {
            setError(verificationError instanceof Error ? verificationError.message : "Could not verify the payment.");
          } finally {
            setIsPending(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsPending(false);
            setError("Payment was cancelled. No climb was recorded.");
          },
        },
      });
      checkout.on("payment.failed", (response) => {
        setIsPending(false);
        setError(response.error?.description || "Payment failed. No climb was recorded.");
      });
      checkout.open();
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : "Could not start the payment.");
      setIsPending(false);
    }
  }

  return (
    <>
      <button className="button" type="button" disabled={disabled} onClick={() => {
        setCurrentRequiredAmount(requiredAmount);
        setError("");
        setSuccess("");
        setIsOpen(true);
      }}>
        Climb the ranks <ArrowUpRight size={15} />
      </button>
      {isOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="climb-title">
            <div className="modal-head">
              <div>
                <h2 id="climb-title">Make your next move</h2>
                <p>Complete a secure Razorpay TEST payment to climb.</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setIsOpen(false)} aria-label="Close climb form"><X size={16} /></button>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            {success && <p className="form-success" role="status">{success}</p>}
            {!success && (
              <>
                <div className="field">
                  <p><strong>Required climb amount</strong></p>
                  <p className="field-hint">₹{currentRequiredAmount.toLocaleString("en-IN")} (calculated from the current #1 on the server)</p>
                </div>
                <div className="modal-actions">
                  <button className="button button-quiet" type="button" onClick={() => setIsOpen(false)}>Cancel</button>
                  <button className="button" type="button" onClick={startPayment} disabled={isPending}>
                    {isPending ? <><LoaderCircle size={14} className="spin" /> Processing…</> : <>Pay ₹{currentRequiredAmount.toLocaleString("en-IN")} in TEST mode <ArrowUpRight size={14} /></>}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
