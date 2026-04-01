type BadgeVariant = "positive" | "negative" | "warning" | "neutral";

const config: Record<BadgeVariant, { color: string; dot: string }> = {
  positive: { color: "text-success",    dot: "bg-success"    },
  negative: { color: "text-danger",     dot: "bg-danger"     },
  warning:  { color: "text-warning",    dot: "bg-warning"    },
  neutral:  { color: "text-fg-muted",   dot: "bg-fg-muted"   },
};

interface BadgeProps {
  variant?: BadgeVariant;
  label: string;
}

export default function Badge({ variant = "positive", label }: BadgeProps) {
  const { color, dot } = config[variant];
  return (
    <div className="flex items-center gap-2">
      <div className={`w-[9px] h-[9px] rounded-full shrink-0 ${dot}`} />
      <span className={`text-sm ${color}`}>{label}</span>
    </div>
  );
}
