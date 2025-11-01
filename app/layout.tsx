import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitTrack Pro - Fitness Dashboard",
  description: "Your personal fitness tracking dashboard with calorie tracking, fasting timer, and health calculators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans bg-gray-100 text-gray-900">
        {children}
      </body>
    </html>
  );
}
