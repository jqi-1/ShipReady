import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Launch Architect",
  description: "Turn your AI-built prototype into a production deployment plan."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
