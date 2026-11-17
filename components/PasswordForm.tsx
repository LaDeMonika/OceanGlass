"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/actions";

export default function PasswordForm({ labels }: { labels: { current: string; next: string; save: string } }) {
  const [state, action, pending] = useActionState(changePassword, undefined);
  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="field">
        <label htmlFor="current">{labels.current}</label>
        <input id="current" name="current" type="password" autoComplete="current-password" required />
      </div>
      <div className="field">
        <label htmlFor="next">{labels.next}</label>
        <input id="next" name="next" type="password" autoComplete="new-password" minLength={10} required />
      </div>
      {state?.error && <div className="notice error" role="alert">{state.error}</div>}
      {state?.ok && <div className="notice ok" role="status">{state.ok}</div>}
      <div>
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {labels.save}
        </button>
      </div>
    </form>
  );
}
