import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  activeTab,
  onTabChange,
}: {
  items: {
    title: string
    id: string
    icon: React.ReactNode
    href?: string
  }[]
  activeTab: string
  onTabChange: (id: string) => void
}) {
  const navigate = useNavigate()

  const handleClick = (item: { id: string; href?: string }) => {
    onTabChange(item.id)
    if (item.href) navigate(item.href)
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={activeTab === item.id}
              onClick={() => handleClick(item)}
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span>{item.title}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
