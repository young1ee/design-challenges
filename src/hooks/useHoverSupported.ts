import { useState } from "react";

export function useHoverSupported() {
  return useState(
    () => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches
  )[0];
}
