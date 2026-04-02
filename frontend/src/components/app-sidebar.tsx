import * as React from "react"
import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Activity, Package, TrendingDown } from "lucide-react"

export function AppSidebar({
  activeTab,
  onTabChange,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  activeTab: string
  onTabChange: (id: string) => void
}) {
  const navItems = [
    { title: "Products", id: "products", icon: <Package className="size-4" />, href: "/" },
    { title: "Overview", id: "overview", icon: <Activity className="size-4" />, href: "/overview" },
    { title: "Price Changes", id: "price-changes", icon: <TrendingDown className="size-4" />, href: "/price-changes" },
  ]

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={() => onTabChange("overview")}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Activity className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold tracking-tight">Entrupy</span>
                <span className="truncate text-xs">Price Tracker</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} activeTab={activeTab} onTabChange={onTabChange} />
      </SidebarContent>
    </Sidebar>
  )
}
