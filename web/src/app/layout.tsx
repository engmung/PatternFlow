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
  description:
    "Play light patterns with your fingertips. An open-source LED synthesizer — a modern reinterpretation of Nam June Paik's Participation TV (1963).",
  keywords: [
    "LED synthesizer",
    "open-source hardware",
    "generative art",
    "creative coding",
    "ESP32",
    "LED matrix",
    "Patternflow",
    "Seung Hun Lee",
    "interactive art",
    "media art",
  ],
  authors: [{ name: "Seung Hun Lee" }],
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    url: "https://patternflow.work",
    title: "Patternflow — An LED synthesizer",
    description:
      "Play light patterns with your fingertips. An open-source LED synthesizer built with ESP32-S3 and a 128×64 LED matrix.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Patternflow — An LED synthesizer",
    description:
      "Play light patterns with your fingertips. An open-source LED synthesizer.",
    images: ["/og-image.jpg"],
  },
  other: {
    "theme-color": "#000000",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
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
