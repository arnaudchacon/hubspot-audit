import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"
  ),
  title: "HubSpot Health Check — CRM Audit Tool",
  description:
    "Audit your HubSpot instance in seconds. Detects duplicate contacts, owner gaps, zombie workflows, stale deals, and phone format issues.",
  openGraph: {
    title: "HubSpot Health Check — CRM Audit Tool",
    description:
      "Upload your contacts export and get a scored audit report with specific, actionable fix recommendations.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HubSpot Health Check — CRM Audit Tool",
    description:
      "Upload your contacts export and get a scored audit report with specific, actionable fix recommendations.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        {children}
        <Footer />
      </body>
    </html>
  );
}
