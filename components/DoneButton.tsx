"use client";

import { useTransition } from "react";
import { markConcept } from "@/app/actions";
import Icon from "./Icon";

export default function DoneButton({
  id,
  done,
  labels,
}: {
  id: string;
  done: boolean;
  labels: { mark: string; done: string; undo: string };
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={`btn ${done ? "btn-done" : "btn-ghost"}`}
      disabled={pending}
      title={done ? labels.undo : undefined}
      onClick={() => start(() => markConcept(id, done ? "new" : "done"))}
    >
      <Icon name="check" />
      {done ? labels.done : labels.mark}
    </button>
  );
}
