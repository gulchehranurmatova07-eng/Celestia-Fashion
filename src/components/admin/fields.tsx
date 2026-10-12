"use client";

import { useId } from "react";
import { input, label as labelCls } from "./styles";
import { FieldError, useActionForm } from "./ActionForm";

type Base = { label: string; name: string; hint?: string; className?: string };

export function TextField({
  label,
  name,
  hint,
  className = "",
  type = "text",
  ...rest
}: Base & {
  type?: "text" | "email" | "number" | "url" | "date" | "datetime-local" | "tel" | "search";
  defaultValue?: string | number;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number | string;
  maxLength?: number;
  pattern?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "text" | "decimal" | "email" | "url";
}) {
  const id = useId();
  const { state } = useActionForm();
  const err = state.errors?.[name];
  return (
    <div className={className}>
      <label htmlFor={id} className={labelCls}>
        {label}
        {rest.required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        className={input}
        aria-invalid={err ? true : undefined}
        aria-describedby={err ? `${name}-error` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-faint">
          {hint}
        </p>
      ) : null}
      <FieldError name={name} />
    </div>
  );
}

export function TextArea({
  label,
  name,
  hint,
  className = "",
  rows = 4,
  ...rest
}: Base & { defaultValue?: string; rows?: number; required?: boolean; placeholder?: string; maxLength?: number }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <textarea id={id} name={name} rows={rows} className={`${input} h-auto py-2 leading-relaxed`} {...rest} />
      {hint ? <p className="mt-1 text-xs text-ink-faint">{hint}</p> : null}
      <FieldError name={name} />
    </div>
  );
}

export function SelectField({
  label,
  name,
  options,
  hint,
  className = "",
  ...rest
}: Base & {
  options: { value: string; label: string }[];
  defaultValue?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <select id={id} name={name} className={input} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint ? <p className="mt-1 text-xs text-ink-faint">{hint}</p> : null}
      <FieldError name={name} />
    </div>
  );
}

export function Checkbox({
  label,
  name,
  hint,
  className = "",
  defaultChecked,
  value,
}: Base & { defaultChecked?: boolean; value?: string }) {
  const id = useId();
  return (
    <div className={`flex items-start gap-2.5 ${className}`}>
      <input id={id} name={name} type="checkbox" value={value} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-obsidian" />
      <label htmlFor={id} className="text-sm">
        {label}
        {hint ? <span className="block text-xs text-ink-faint">{hint}</span> : null}
      </label>
    </div>
  );
}
