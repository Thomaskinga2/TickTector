import { ViewTransition } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MotionProvider } from "@/components/motion-provider";
import { TabBar } from "@/components/tab-bar";
import { Toaster } from "@/components/toaster";

export const metadata: Metadata = {
  title: "TickTector",
  description: "This week's tick risk for Massachusetts towns.",
  appleWebApp: { capable: true, title: "TickTector", statusBarStyle: "default" },
};

// Safari 26 tints its bars from the page background, so the theme color matches --background.
export const viewport: Viewport = {
  viewportFit: "cover",
  // TickTector is light only, even when the phone is in dark mode.
  colorScheme: "light",
  themeColor: "#f4efe4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col">
        <MotionProvider>
          {/* Room for the floating tab bar and the home indicator. */}
          {/* Navigations cross-fade with a slight rise (app/globals.css, .page). */}
          <ViewTransition update="page" default="none">
            <div className="flex flex-1 flex-col pb-[calc(env(safe-area-inset-bottom)+6rem)]">{children}</div>
          </ViewTransition>
          <TabBar />
          <Toaster />
        </MotionProvider>
      </body>
    </html>
  );
}
