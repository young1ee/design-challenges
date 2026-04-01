import { ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
  right?: ReactNode;
}

export default function SectionLabel({ children, right }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-4 px-3 py-2 rounded-full border-[0.5px] border-line text-sm text-fg-muted">
      <span>{children}</span>
      {right && (
        <>
          <div className="w-[0.5px] h-5 bg-line" />
          {right}
        </>
      )}
    </div>
  );
}
