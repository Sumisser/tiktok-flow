import type { ReactNode } from "react";

interface TimelineProps {
  children: ReactNode;
}

export default function Timeline({ children }: TimelineProps) {
  return (
    <div className="relative">
      {/* 步骤列表 */}
      <div className="space-y-8">{children}</div>
    </div>
  );
}
