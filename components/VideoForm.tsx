"use client";

import { useActionState } from "react";
import { saveVideo } from "@/app/actions";

export default function VideoForm({ conceptId, current, saveLabel }: { conceptId: string; current: string; saveLabel: string }) {
  const [state, action, pending] = useActionState(saveVideo, undefined);
  return (
    <form action={action}>
      <input type="hidden" name="conceptId" value={conceptId} />
      <input name="url" defaultValue={current ? `https://youtu.be/${current}` : ""} placeholder="https://youtu.be/…" aria-label="YouTube link" />
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {saveLabel}
      </button>
      {state?.error && <span className="small" style={{ color: "var(--danger)" }}>{state.error}</span>}
      {state?.ok && <span className="small" style={{ color: "var(--done)" }}>{state.ok}</span>}
    </form>
  );
}
