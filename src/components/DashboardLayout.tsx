import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import TrialBanner from "@/components/TrialBanner";

export default function DashboardLayout({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TrialBanner />
          <header className="h-14 flex items-center justify-between border-b border-border px-4 sticky top-0 bg-background/95 backdrop-blur z-30">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger />
              {title && <h1 className="font-heading text-base font-semibold truncate">{title}</h1>}
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
