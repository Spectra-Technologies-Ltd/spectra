import type { Metadata, Viewport } from "next";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import AuthProvider from "@/providers/AuthProvider";

export const metadata: Metadata = {
  title: "BASTIONOS | Operations Intelligence Platform",
  description:
    "Enterprise operations intelligence platform for private security companies, connecting guards, clients, sites, and analytics.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BASTIONOS",
  },
  icons: {
    apple: "/apple-touch-icon.png",
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0d0d12",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground flex flex-col font-sans">
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
