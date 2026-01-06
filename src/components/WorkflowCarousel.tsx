import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { WorkflowStep } from "../types";

interface WorkflowCarouselProps {
  steps: WorkflowStep[];
  children: React.ReactNode;
}

export default function WorkflowCarousel({
  steps,
  children,
}: WorkflowCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const childrenArray = React.Children.toArray(children);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "ArrowRight") {
        setActiveIndex((prev) =>
          prev < childrenArray.length - 1 ? prev + 1 : prev
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [childrenArray.length]);

  return (
    <div className="space-y-6">
      {/* 轮播内容区 */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {childrenArray.map((child, index) => (
            <div key={index} className="w-full flex-shrink-0 px-4 md:px-12 lg:px-24">
              <div className="max-w-7xl mx-auto">
                {child}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 步骤指示器 - 固定在底部 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-gradient-to-t from-background via-background/80 to-transparent">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setActiveIndex(index)}
              className="group py-4 px-2 cursor-pointer focus:outline-none"
              title={`第 ${index + 1} 步: ${step.title}`}
            >
              <div
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  activeIndex === index
                    ? "w-12 bg-primary shadow-[0_0_15px_rgba(var(--color-primary),0.6)]"
                    : "w-3 bg-primary/20 group-hover:bg-primary/40"
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
