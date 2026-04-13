import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { AmbientNav } from "@/components/navigation/AmbientNav";
import { ThermalLayout } from "@/components/thermal/ThermalLayout";
import { INLINE_RESTORE_SCRIPT } from "@/lib/thermal/inline-restore";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: INLINE_RESTORE_SCRIPT }} />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased bg-background`}>
        <ThermalLayout>
          {children}
          <AmbientNav />
        </ThermalLayout>
      </body>
    </html>
  );
}
