"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Building2,
  Dumbbell,
  FileText,
  GraduationCap,
  Inbox,
  LifeBuoy,
  Mail,
  Map,
  MapPin,
  PieChart,
  Send,
  Settings2,
  ShoppingBag,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Douglas",
    email: "admin@bestgoa.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: PieChart,
      isActive: false,
      items: [],
    },
    {
      title: "Submissions",
      url: "/admin/submissions",
      icon: Inbox,
      isActive: false,
      items: [],
    },
    {
      title: "Contact Messages",
      url: "/admin/contact",
      icon: Mail,
      isActive: false,
      items: [],
    },
    {
      title: "Restaurants",
      url: "/admin/restaurants",
      icon: SquareTerminal,
      isActive: false,
      items: [
        {
          title: "All Restaurants",
          url: "/admin/restaurants",
        },
        {
          title: "Add Restaurant",
          url: "/admin/restaurants/add",
        },
        {
          title: "Extraction Queue",
          url: "/admin/restaurants/queue",
        },
      ],
    },
    {
      title: "Hotels",
      url: "/admin/hotels",
      icon: Building2,
      isActive: false,
      items: [
        {
          title: "All Hotels",
          url: "/admin/hotels",
        },
        {
          title: "Add Hotel",
          url: "/admin/hotels/add",
        },
        {
          title: "Extraction Queue",
          url: "/admin/hotels/queue",
        },
      ],
    },
    {
      title: "Malls",
      url: "/admin/malls",
      icon: ShoppingBag,
      isActive: false,
      items: [
        {
          title: "All Malls",
          url: "/admin/malls",
        },
        {
          title: "Add Mall",
          url: "/admin/malls/add",
        },
        {
          title: "Extraction Queue",
          url: "/admin/malls/queue",
        },
      ],
    },
    {
      title: "Attractions",
      url: "/admin/attractions",
      icon: MapPin,
      isActive: false,
      items: [
        {
          title: "All Attractions",
          url: "/admin/attractions",
        },
        {
          title: "Add Attraction",
          url: "/admin/attractions/add",
        },
        {
          title: "Extraction Queue",
          url: "/admin/attractions/queue",
        },
      ],
    },
    {
      title: "Schools",
      url: "/admin/schools",
      icon: GraduationCap,
      isActive: false,
      items: [
        {
          title: "All Schools",
          url: "/admin/schools",
        },
        {
          title: "Add School",
          url: "/admin/schools/add",
        },
        {
          title: "Extraction Queue",
          url: "/admin/schools/queue",
        },
      ],
    },
    {
      title: "Fitness",
      url: "/admin/fitness",
      icon: Dumbbell,
      isActive: false,
      items: [
        {
          title: "All Fitness Places",
          url: "/admin/fitness",
        },
        {
          title: "Add Fitness Place",
          url: "/admin/fitness/add",
        },
        {
          title: "Extraction Queue",
          url: "/admin/fitness/queue",
        },
      ],
    },
    {
      title: "Blog",
      url: "/admin/blog",
      icon: FileText,
      isActive: false,
      items: [
        {
          title: "All Articles",
          url: "/admin/blog",
        },
      ],
    },
    {
      title: "Categories",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Cuisines",
          url: "/admin/cuisines",
        },
        {
          title: "Categories",
          url: "/admin/categories",
        },
        {
          title: "Features",
          url: "/admin/features",
        },
      ],
    },
    {
      title: "Data Management",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Import Jobs",
          url: "/admin/imports",
        },
        {
          title: "Failed Jobs",
          url: "/admin/imports/failed",
        },
      ],
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: Settings2,
      items: [],
    },
  ],
  navSecondary: [
    {
      title: "View Site",
      url: "/",
      icon: Send,
    },
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
  ],
  projects: [],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/admin" suppressHydrationWarning>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg" suppressHydrationWarning>
                  <Map className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight" suppressHydrationWarning>
                  <span className="truncate font-semibold">Best of Goa</span>
                  <span className="truncate text-xs">Admin Panel</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
