import { cloneElement, isValidElement, type ReactElement } from "react";

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  /**
   * `"assertive"` (default) interrupts the screen reader immediately via
   * `role="alert"` — reserve it for deliberate, user-initiated events like a
   * submit-time validation failure. `"polite"` announces only once the
   * screen reader is idle, via `aria-live="polite"` (role="alert" always
   * forces assertive semantics per the ARIA spec, so it's omitted here) —
   * use it for feedback that appears on its own while the user is still
   * typing, so every keystroke's error doesn't interrupt them mid-type.
   */
  errorPriority?: "assertive" | "polite";
  children: ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>;
}

/**
 * Wires label + input + error message together so every form field gets the
 * same accessibility wiring (aria-invalid / aria-describedby) without each
 * feature package re-deriving it by hand.
 */
export function FormField({ label, htmlFor, error, hint, errorPriority = "assertive", children }: FormFieldProps) {
  const errorId = `${htmlFor}-error`;
  const hintId = `${htmlFor}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  const field = isValidElement(children)
    ? cloneElement(children, {
        id: htmlFor,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy,
      })
    : children;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {field}
      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role={errorPriority === "assertive" ? "alert" : undefined}
          aria-live={errorPriority === "polite" ? "polite" : undefined}
          className="text-xs text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}
