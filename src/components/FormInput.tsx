"use client";

export default function FormInput({
  className,
  style,
  onFocus,
  onBlur,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={`w-full h-[41px] px-4 rounded-lg bg-canvas text-sm text-fg-primary placeholder:text-fg-muted outline-none ${className ?? ""}`}
      style={{ boxShadow: "none", transition: "box-shadow 150ms ease-out", ...style }}
      onMouseEnter={(e) => {
        if (document.activeElement !== e.currentTarget)
          e.currentTarget.style.boxShadow = "inset 0 0 0 1px var(--color-line)";
      }}
      onMouseLeave={(e) => {
        if (document.activeElement !== e.currentTarget)
          e.currentTarget.style.boxShadow = "none";
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = "inset 0 0 0 1px var(--color-accent)";
        onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
        onBlur?.(e);
      }}
    />
  );
}
