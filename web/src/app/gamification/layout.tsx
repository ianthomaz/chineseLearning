import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz",
};

export default function GamificationLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
