import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Controller Monitor — Real-Time Telemetry Dashboard",
  description: "High-performance Embedded Controller Real-Time Telemetry Dashboard with compact radial gauges, Chart.js trends, unit conversions, and session exports.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Oswald:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
