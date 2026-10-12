"use client";

import { createContext, startTransition, useActionState, useContext, useRef } from "react";
import type { ActionState } from "@/lib/admin/types";
import { INITIAL_STATE } from "@/lib/admin/types";
import { useToast } from "./Toast";

export type AdminAction = (prev: ActionState, fd: FormData) => Promise<ActionState>;

type Ctx = { state: ActionState; pending: boolean };
const FormCtx = createContext<Ctx>({ state: INITIAL_STATE, pending: false });
export const useActionForm = () => useContext(FormCtx);

type Props = {
  action: AdminAction;
  children: React.ReactNode;
  className?: string;
  id?: string;
  /** Ask for confirmation before submitting. A submit button may override it with data-confirm. */
  confirm?: string;
  resetOnSuccess?: boolean;
  encType?: "multipart/form-data";
  "aria-label"?: string;
  onResult?: (state: ActionState) => void;
};

/**
 * Form wrapper for admin server actions: confirmation prompts, pending state,
 * toast + inline feedback, and no input loss on validation errors.
 */
export function ActionForm({ action, children, className, id, confirm, resetOnSuccess, onResult, ...rest }: Props) {
  const toast = useToast();
  const ref = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (prev: ActionState, fd: FormData) => {
    const result = await action(prev, fd);
    if (result.message) toast(result.message, result.ok);
    if (result.ok && resetOnSuccess) ref.current?.reset();
    onResult?.(result);
    return result;
  }, INITIAL_STATE);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const submitter = ((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null) ?? null;
    const question = submitter?.dataset.confirm ?? confirm;
    if (question && !window.confirm(question)) return;
    const fd = new FormData(e.currentTarget, submitter);
    startTransition(() => formAction(fd));
  }

  return (
    <FormCtx.Provider value={{ state, pending }}>
      <form ref={ref} id={id} className={className} onSubmit={onSubmit} aria-busy={pending} {...rest}>
        {children}
      </form>
    </FormCtx.Provider>
  );
}

/** Inline status line for the surrounding ActionForm. */
export function FormStatus({ className = "" }: { className?: string }) {
  const { state, pending } = useActionForm();
  if (pending) return <p className={`text-xs text-ink-faint ${className}`} role="status">Saving…</p>;
  if (!state.message) return <p className={className} role="status" aria-live="polite" />;
  return (
    <p
      className={`text-xs ${state.ok ? "text-[#1F5132]" : "text-[#9B1C1C]"} ${className}`}
      role={state.ok ? "status" : "alert"}
      aria-live="polite"
    >
      {state.message}
    </p>
  );
}

export function SubmitButton({
  children,
  className,
  name,
  value,
  confirm,
  pendingText,
  ...rest
}: {
  children: React.ReactNode;
  className: string;
  name?: string;
  value?: string;
  confirm?: string;
  pendingText?: string;
  "aria-label"?: string;
  title?: string;
  disabled?: boolean;
}) {
  const { pending } = useActionForm();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      data-confirm={confirm}
      className={className}
      {...rest}
      disabled={pending || rest.disabled}
    >
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

export function FieldError({ name }: { name: string }) {
  const { state } = useActionForm();
  const msg = state.errors?.[name];
  if (!msg) return null;
  return (
    <p className="field-error" id={`${name}-error`}>
      {msg}
    </p>
  );
}
