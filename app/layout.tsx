import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Persona Blog",
  description: "A transformation-focused persona blog",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
