import { ReactNode } from "react";

interface TimelineProps {
  children: ReactNode;
}

export default function Timeline({ children }: TimelineProps) {
  return (
    <div className="relative">
      {/* 时间轴垂直线 */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-pink-500 to-purple-500" />

      {/* 步骤列表 */}
      <div className="space-y-8">{children}</div>
    </div>
  );
}
