import type { Metadata } from "next";
import { Inter, JetBrains_Mono, DM_Sans, Silkscreen } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const silkscreen = Silkscreen({
  weight: ['400', '700'],
  variable: "--font-silkscreen",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Patternflow — An LED synthesizer",
  description: "Play light patterns with your fingertips. An open-source reinterpretation of Nam June Paik's Participation TV (1963).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${dmSans.variable} ${silkscreen.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
