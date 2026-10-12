/** Result returned by every admin server action (consumed by <ActionForm>). */
export type ActionState = {
  ok: boolean;
  message: string;
  /** Field-level validation errors keyed by form field name. */
  errors?: Record<string, string>;
  /** Optional payload (e.g. the URL of an uploaded image). */
  data?: Record<string, string>;
  /** Increments on every response so clients can react to repeated identical results. */
  at?: number;
};

export const INITIAL_STATE: ActionState = { ok: true, message: "" };
