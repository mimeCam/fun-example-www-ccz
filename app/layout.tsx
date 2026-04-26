import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { AmbientNav } from "@/components/navigation/AmbientNav";
import { SkipLink } from "@/components/shared/SkipLink";
import { ThermalLayout } from "@/components/thermal/ThermalLayout";
import { INLINE_RESTORE_SCRIPT } from "@/lib/thermal/inline-restore";
import "./globals.css";
import "@/lib/design/ambient-surfaces.css";
import "@/lib/design/print-surface.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "optional",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "optional",
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
        {/* Room Constitution — OS↔CSS seam. Must appear BEFORE the inline
            restore script: UAs parse <head> top-down for canvas-paint
            hints, so the meta has to land first. Pairs with the three
            declarations on `:root` in `app/globals.css` (color-scheme,
            accent-color, background-color). Sync guard:
            `lib/design/__tests__/color-scheme-sync.test.ts`. */}
        <meta name="color-scheme" content="dark" />
        <script dangerouslySetInnerHTML={{ __html: INLINE_RESTORE_SCRIPT }} />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased bg-background`}>
        {/* SkipLink — cold-start handshake. MUST stay the first child of
            <body> so a keyboard reader's first Tab lands here before any
            other surface (Mike napkin §1, Tanya UX §2.3 — first focusable,
            robustly). Tab-order test asserts on document.body.firstElementChild.
            CSS-only slide-in; works pre-hydration. Closes TRUST_INVARIANTS[1]. */}
        <SkipLink target="#main-content" />
        <ThermalLayout>
          {children}
          <AmbientNav />
        </ThermalLayout>
      </body>
    </html>
  );
}
