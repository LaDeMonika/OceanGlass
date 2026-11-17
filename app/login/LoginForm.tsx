"use client";

import { startTransition, useActionState, useState } from "react";
import { login } from "@/app/actions";

export default function LoginForm({ labels }: { labels: { username: string; password: string; signIn: string } }) {
  const [state, action, pending] = useActionState(login, undefined);
  const [username, setUsername] = useState("");
  return (
    <form
      action={action}
      onSubmit={(e) => {
        // Submit manually so React does not clear the username after a wrong password.
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="field">
        <label htmlFor="username">{labels.username}</label>
        <input id="username" name="username" autoComplete="username" autoCapitalize="none" value={username}
          onChange={(e) => setUsername(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="password">{labels.password}</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state?.error && (
        <div className="notice error" role="alert">
          {state.error}
        </div>
      )}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {labels.signIn}
      </button>
    </form>
  );
}
