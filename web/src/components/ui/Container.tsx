import type { ReactNode } from "react";

const SIZES = {
  sm: "max-w-2xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
} as const;

/** Centered page container with consistent horizontal padding and width. */
export function Container({
  children,
  size = "md",
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  size?: keyof typeof SIZES;
  className?: string;
  as?: "div" | "main" | "section" | "header" | "footer";
}) {
  return <Tag className={`mx-auto w-full ${SIZES[size]} px-4 sm:px-6 ${className}`}>{children}</Tag>;
}
