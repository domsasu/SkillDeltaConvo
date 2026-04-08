import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
});

export const metadata: Metadata = {
  title: "PPP — Personalized Learning Plans",
  description:
    "Get a personalized Coursera learning plan through conversation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sourceSans.variable} h-full antialiased`} style={{ colorScheme: "light" }}>
      <body className="h-full font-sans">{children}</body>
    </html>
  );
}
