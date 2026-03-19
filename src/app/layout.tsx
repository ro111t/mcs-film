import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MCS — Media Creative Society",
  description: "The creative collective for filmmakers, photographers, and visual storytellers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <div className="film-grain" />
        <Navbar />
        <main>{children}</main>
        <footer className="border-t border-border/50 bg-background">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-6 py-10 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/mcs-logo.png" alt="MCS" className="h-6 w-6 object-contain" />
              <span className="text-xs font-semibold text-foreground/60">Media Creative Society</span>
            </div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted/40">
              MCS — A Common Sense Product
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
