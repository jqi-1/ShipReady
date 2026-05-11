import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShipReady",
  description: "Turn a GitHub repo into a production launch plan."
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
