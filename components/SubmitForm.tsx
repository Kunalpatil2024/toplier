"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { createListingAction, type ActionState } from "@/app/actions";
import { CATEGORIES, MINIMUM_STARTING_VALUE } from "@/lib/constants";

const initialState: ActionState = {};

export default function SubmitForm() {
  const [state, formAction, pending] = useActionState(createListingAction, initialState);

  return (
    <form className="panel form-panel" action={formAction}>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <div className="form-grid">
        <div className="field">
          <label htmlFor="name">Product name</label>
          <input id="name" name="name" required minLength={2} maxLength={60} placeholder="e.g. SuperAI" autoComplete="organization" />
        </div>
        <div className="field">
          <label htmlFor="websiteUrl">Website URL</label>
          <input id="websiteUrl" name="websiteUrl" type="url" required placeholder="https://yourproduct.com" />
        </div>
        <div className="field field-full">
          <label htmlFor="description">Short description</label>
          <textarea id="description" name="description" required minLength={10} maxLength={280} placeholder="What does your product help people do?" />
          <span className="field-hint">10 to 280 characters</span>
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" required defaultValue="AI">
            {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="rankValue">Starting rank value</label>
          <input id="rankValue" name="rankValue" type="number" min={MINIMUM_STARTING_VALUE} max={1_000_000_000} step="1" defaultValue={MINIMUM_STARTING_VALUE} required />
          <span className="field-hint">Demo amount only. Minimum ₹{MINIMUM_STARTING_VALUE}.</span>
        </div>
        <div className="field">
          <label htmlFor="twitterUrl">X / Twitter URL <span>Optional</span></label>
          <input id="twitterUrl" name="twitterUrl" type="url" placeholder="https://x.com/yourproduct" />
        </div>
        <div className="field">
          <label htmlFor="logoUrl">Logo URL <span>Optional</span></label>
          <input id="logoUrl" name="logoUrl" type="url" placeholder="https://yourproduct.com/logo.png" />
        </div>
      </div>
      <div className="form-actions">
        <button className="button" type="submit" disabled={pending}>
          {pending ? <><LoaderCircle size={15} className="spin" /> Submitting…</> : <>Submit product <ArrowRight size={15} /></>}
        </button>
        <Link className="button button-quiet" href="/">Cancel</Link>
      </div>
    </form>
  );
}