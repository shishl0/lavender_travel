"use client";

import { forwardRef, SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, error, className = "", children, disabled, ...props },
  ref
) {
  return (
    <div className="grid gap-1">
      {label && <label className="text-sm font-medium">{label}</label>}

      <div className="relative">
        <select
          ref={ref}
          disabled={disabled}
          className={[
            "w-full h-10 rounded-lg border px-3 pr-9 text-sm bg-white shadow-sm",
            "appearance-none",
            "border-gray-200 focus:outline-none focus:border-[#5e3bb7] focus:ring-2 focus:ring-[#5e3bb7]/20",
            "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
            "transition-colors",
            className,
          ].join(" ")}
          {...props}
        >
          {children}
        </select>

        {/* красивая стрелка */}
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.12l3.71-3.89a.75.75 0 011.08 1.04l-4.25 4.46a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </div>

      {error && <div className="text-xs text-rose-600">{error}</div>}
    </div>
  );
});

export default Select;