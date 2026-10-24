import type { Metadata, Viewport } from "next";
import { Geist_Mono, Public_Sans } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { cn } from "@/lib/utils";

const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TikTector",
  description: "Weekly tick risk for Massachusetts towns.",
  appleWebApp: { capable: true, title: "TikTector", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#1f3a2e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("antialiased", publicSans.variable, geistMono.variable, "font-sans")}>
      <body className="flex min-h-dvh flex-col pt-[env(safe-area-inset-top)]">
        <div className="flex flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))]">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
