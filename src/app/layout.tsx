import type { Metadata } from "next";
import pkg from "../../package.json";
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
      <body className="flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
        <footer className="border-t border-line px-4 py-3 text-center text-xs text-steel">
          ShipReady {pkg.version}
        </footer>
      </body>
    </html>
  );
}
