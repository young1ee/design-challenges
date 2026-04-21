"use client";

import * as RadixTooltip from "@radix-ui/react-tooltip";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <RadixTooltip.Provider delayDuration={300} skipDelayDuration={100}>
      {children}
    </RadixTooltip.Provider>
  );
}

export function Tooltip({ content, children }: { content: string; children: React.ReactNode }) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          sideOffset={6}
          className="px-2.5 py-1.5 rounded-lg text-xs text-fg-primary"
          style={{
            background: "var(--color-elevated)",
            boxShadow: "var(--shadow-default)",
            transformOrigin: "var(--radix-tooltip-content-transform-origin)",
            animation: "dropdown-open 150ms var(--ease-out)",
          }}
        >
          {content}
          <RadixTooltip.Arrow style={{ fill: "var(--color-elevated)" }} />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
