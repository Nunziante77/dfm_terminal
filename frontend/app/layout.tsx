import type { Metadata } from "next";
import "@/styles/globals.css";
import Providers from "@/components/Providers";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import StatusBar from "@/components/StatusBar";

export const metadata: Metadata = {
  title: "DFM Terminal",
  description: "Strategic intelligence terminal — Bloomberg, Govini, Palantir in one shell",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-terminal-bg text-terminal-text font-mono">
        <Providers>
          <div className="flex flex-col h-screen overflow-hidden">
            <TopBar />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-auto bg-terminal-bg p-4">
                {children}
              </main>
            </div>
            <StatusBar />
          </div>
        </Providers>
      </body>
    </html>
  );
}
