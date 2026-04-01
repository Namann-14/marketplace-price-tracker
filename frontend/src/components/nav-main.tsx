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
  }[]
  activeTab: string
  onTabChange: (id: string) => void
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={activeTab === item.id}
              onClick={() => onTabChange(item.id)}
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
