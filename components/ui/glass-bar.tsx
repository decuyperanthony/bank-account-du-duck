"use client";

import { type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type GlassBarProps<T extends ElementType = "div"> = {
  as?: T;
  children: ReactNode;
  className?: string;
  position?: "top" | "bottom";
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export const GlassBar = <T extends ElementType = "div">({
  as,
  children,
  className,
  position = "top",
  ...props
}: GlassBarProps<T>) => {
  const Component = as ?? "div";

  return (
    <Component
      className={cn(
        "fixed left-0 right-0 z-50",
        "bg-background/80 backdrop-blur-lg",
        "border-border/50",
        position === "top" && "top-0 border-b pt-safe",
        position === "bottom" && "bottom-0 border-t pb-safe",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};
