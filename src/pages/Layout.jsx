

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Bell,
  Building2,
  DollarSign,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
  Mail,
  MessageCircle,
  Scale,
  Settings,
  BarChart3,
  LifeBuoy,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import usePermissions from "@/components/hooks/usePermissions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User as UserEntity } from "@/api/entities";

// Global error boundary for iteration errors
class IterationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    if (error.message && error.message.includes('Symbol.iterator')) {
      return { hasError: true, error };
    }
    return null;
  }

  componentDidCatch(error, errorInfo) {
    if (error.message && error.message.includes('Symbol.iterator')) {
      console.error('Iteration Error caught:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Loading...</h2>
            <p className="text-gray-600 mb-4">Please wait while we load your data.</p>
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const allNavigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Vendors",
    url: createPageUrl("Vendors"),
    icon: Building2,
  },
  {
    title: "Portfolios",
    url: createPageUrl("Portfolios"),
    icon: FolderOpen,
  },
  {
    title: "Debts",
    url: createPageUrl("Debts"),
    icon: FileText,
  },
  {
    title: "Campaigns",
    url: createPageUrl("Campaigns"),
    icon: MessageCircle,
  },
  {
    title: "Legal",
    url: createPageUrl("Legal"),
    icon: Scale,
  },
  {
    title: "Payments",
    url: createPageUrl("Payments"),
    icon: DollarSign,
  },
  {
    title: "Communications",
    url: createPageUrl("Communications"),
    icon: Mail,
  },
  {
    title: "Reports",
    url: createPageUrl("Reports"),
    icon: BarChart3,
  },
  {
    title: "Integrations",
    url: createPageUrl("Integrations"),
    icon: LinkIcon,
  },
];

const allSettingsItems = [
  {
    title: "Settings",
    url: createPageUrl("Settings"),
    icon: Settings,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const { user, isAdmin, isLoading } = usePermissions();

  const handleLogout = async () => {
    await UserEntity.logout();
    window.location.reload();
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const names = name.split(' ');
    if (names.length > 1) {
        return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  };

  const navigationItems = (allNavigationItems || []).filter(item => !item.adminOnly || isAdmin);
  const settingsItems = (allSettingsItems || []).filter(item => !item.adminOnly || isAdmin);

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
        </div>
    );
  }

  // If the current page is the Payment Portal, render it without the sidebar layout
  if (currentPageName === 'PaymentPortal') {
    return (
        <IterationErrorBoundary>
            {children}
        </IterationErrorBoundary>
    );
  }

  return (
    <IterationErrorBoundary>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50">
          <Sidebar collapsible="icon">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>CCAI</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {(navigationItems || []).map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={
                            location.pathname === item.url ||
                            (item.url !== "/" && location.pathname.startsWith(item.url))
                          }
                        >
                          <Link to={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
              <SidebarMenu>
                {(settingsItems || []).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname.startsWith(item.url)}
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
              <div className="flex items-center gap-3 p-3 border-t">
                  <Avatar className="h-9 w-9">
                      <AvatarImage src={`https://avatar.vercel.sh/${user?.email}`} alt={user?.full_name} />
                      <AvatarFallback>{getInitials(user?.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                      <p className="text-sm font-semibold text-gray-800 truncate">{user?.full_name || "Anonymous"}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleLogout} title="Log Out">
                      <LogOut className="w-4 h-4 text-gray-500" />
                  </Button>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b px-4 py-2">
              <SidebarTrigger />
            </div>
            <IterationErrorBoundary>
              {children}
            </IterationErrorBoundary>
          </main>
        </div>
      </SidebarProvider>
    </IterationErrorBoundary>
  );
}

