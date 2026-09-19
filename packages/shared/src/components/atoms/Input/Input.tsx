import { forwardRef, type InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-md border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 disabled:bg-slate-100 ${
        rest["aria-invalid"] ? "border-red-500 focus-visible:outline-red-500" : "border-slate-300 focus-visible:outline-brand-600"
      } ${className}`}
      {...rest}
    />
  );
});
