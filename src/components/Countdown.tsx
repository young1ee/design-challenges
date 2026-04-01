"use client";

import { useEffect, useRef, useState } from "react";

interface CountdownProps {
  endDate: Date;
  onExpire?: () => void;
}

function getTimeLeft(endDate: Date) {
  const diff = endDate.getTime() - Date.now();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
}

export default function Countdown({ endDate, onExpire }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const update = () => {
      const t = getTimeLeft(endDate);
      setTimeLeft(t);
      if (!t) onExpireRef.current?.();
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  const { days, hours, minutes, seconds } = timeLeft ?? { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const parts = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);

  return (
    <p className="text-sm">
      <span style={{ color: "#ffffff" }}>{parts.join(", ")}</span>{" "}
      <span className="text-fg-muted">left to finish your challenge</span>
    </p>
  );
}
