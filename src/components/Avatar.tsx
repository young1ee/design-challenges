import { CSSProperties } from "react";

interface AvatarProps {
  name: string;
  src?: string | null;
  className?: string;
  style?: CSSProperties;
}

export default function Avatar({ name, src, className = "", style }: AvatarProps) {
  return (
    <div
      className={`rounded-full bg-elevated flex items-center justify-center text-fg-muted font-medium shrink-0 overflow-hidden ${className}`}
      style={style}
    >
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : name.slice(0, 2).toUpperCase()
      }
    </div>
  );
}
