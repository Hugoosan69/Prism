import { AppSidebar } from "@/components/layout/app-sidebar"
import { Topbar } from "@/components/layout/topbar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Topbar />
        <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-7">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
