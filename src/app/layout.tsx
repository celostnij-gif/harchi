import type { Metadata, Viewport } from "next";
import { Unbounded, Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/kharchi/ThemeProvider";
import LangProvider from "@/components/kharchi/LangProvider";
import StyledToaster from "@/components/kharchi/StyledToaster";
import { getSiteData } from "@/lib/site-data";

const display = Unbounded({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Харчі — Гаряча їжа там, де ти | Сублімати для походів та ПХД",
  description:
    "Перший український інтернет-магазин субліматів. Харчі XL, сніданки, перші та другі страви, снеки й напої. Готово за 10 хвилин — гаряча їжа там, де ти.",
  keywords: [
    "Харчі",
    "сублімати",
    "туристична їжа",
    "їжа в похід",
    "Харчі XL",
    "харчування ПХД",
    "freeze dried food",
  ],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Харчі — Гаряча їжа там, де ти",
    description:
      "Сублімовані страви для походів, рибалки та військових. Готово за 10 хвилин.",
    siteName: "Харчі",
    type: "website",
    locale: "uk_UA",
    images: [{ url: "/hero-camp.png", width: 1344, height: 768 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0908",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Текстові override-и з БД (глибоко мержаться зі STRINGS у LangProvider)
  const { overrides } = await getSiteData();

  return (
    <html lang="uk" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${display.variable} ${inter.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <LangProvider overrides={overrides}>
            {children}
            <StyledToaster />
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
