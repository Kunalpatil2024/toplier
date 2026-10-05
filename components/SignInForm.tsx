"use client";

import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { sendSignInLinkAction, type ActionState } from "@/app/actions";

const initialState: ActionState = {};

export default function SignInForm() {
  const [state, formAction, pending] = useActionState(sendSignInLinkAction, initialState);

  return (
    <form className="panel form-panel" action={formAction}>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.message && <p className="form-success" role="status">{state.message}</p>}
      <div className="field">
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
      </div>
      <div className="form-actions">
        <button className="button" type="submit" disabled={pending}>
          {pending ? <><LoaderCircle size={15} className="spin" /> Sending…</> : <>Email me a sign-in link <ArrowRight size={15} /></>}
        </button>
      </div>
    </form>
  );
}
