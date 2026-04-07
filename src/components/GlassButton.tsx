import { ButtonHTMLAttributes } from "react";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "glass" | "ghost";
}

export default function GlassButton({
  variant = "glass",
  className = "",
  children,
  style,
  ...props
}: GlassButtonProps) {
  const base =
    "flex items-center justify-center rounded-lg text-fg-secondary hover:text-fg-primary transition-[transform,color,background-color] duration-150 active:scale-[0.97] cursor-pointer outline-none disabled:opacity-50 disabled:pointer-events-none";
  const glass = "bg-[var(--color-glass-subtle)] hover:bg-[var(--color-glass-hover)]";
  const ghost = "hover:bg-[var(--color-glass-subtle)]";

  return (
    <button
      {...props}
      className={`${base} ${variant === "glass" ? glass : ghost} ${className}`}
      style={variant === "glass" ? { boxShadow: "var(--shadow-btn)", ...style } : style}
    >
      {children}
    </button>
  );
}
