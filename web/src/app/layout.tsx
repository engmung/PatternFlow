import type { Metadata } from "next";
import { Inter, JetBrains_Mono, DM_Sans, Silkscreen, Newsreader } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { PostHogProvider } from "@/providers/PostHogProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

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

const newsreader = Newsreader({
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://patternflow.work"),
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
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    url: "https://patternflow.work",
    title: "Patternflow — An LED synthesizer",
    description:
      "Play light patterns with your fingertips. An open-source LED synthesizer built with ESP32-S3 and a 128×64 LED matrix.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Patternflow — An LED synthesizer",
    description:
      "Play light patterns with your fingertips. An open-source LED synthesizer.",
    images: ["/og-image.png"],
  },
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
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
        className={`${inter.variable} ${jetbrainsMono.variable} ${dmSans.variable} ${silkscreen.variable} ${newsreader.variable} antialiased`}
      >
        <PostHogProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </PostHogProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
