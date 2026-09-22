import { AppSidebar } from "@/components/layout/app-sidebar"
import { PageContainer } from "@/components/layout/page-container"
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
      {/* h-svh + overflow-hidden: quem rola é a conversa, não a página. */}
      <SidebarInset className="h-svh overflow-hidden">
        <Topbar />
        <PageContainer>{children}</PageContainer>
      </SidebarInset>
    </SidebarProvider>
  )
}
