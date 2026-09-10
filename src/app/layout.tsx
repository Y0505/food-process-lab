import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FoodProcessLab",
  description: "An interactive 3D learning environment for food-processing processes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
