import type { Metadata } from "next";
import Link from "next/link";
import SignUpForm from "@/components/SignUpForm";

export const metadata: Metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <main className="page-main">
      <div className="container">
        <div className="page-heading">
          <div className="eyebrow"><span className="eyebrow-dot" /> Create your account</div>
          <h1 className="display">Join Toplier.</h1>
          <p>Enter your email and we&apos;ll send you a secure link to verify your address and sign in.</p>
        </div>
        <div className="form-layout">
          <div>
            <SignUpForm />
            <p className="field-hint" style={{ marginTop: 14 }}>
              Already have an account? <Link href="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
