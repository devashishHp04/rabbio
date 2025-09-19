// src/components/app-layout-client.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Beaker, BookMarked, FlaskConical, LayoutDashboard, User, Library, Sparkles, Bell, HelpCircle, MoreHorizontal, Settings, LogOut, LifeBuoy, Users, GraduationCap, Handshake, Headset, Rocket, Shield, ChevronDown } from 'lucide-react';
import { Separator } from './ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import type { AuthenticatedUser } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

interface AppLayoutClientProps {
  children: React.ReactNode;
  user: AuthenticatedUser | null;
  unreadNotifications: number;
}

export default function AppLayoutClient({ children, user, unreadNotifications }: AppLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdminOpen, setIsAdminOpen] = React.useState(pathname.startsWith('/admin'));
  
  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    try {
      await signOut(auth);
    } catch {}
    router.push('/');
  };

  const topNavItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/pipeline', icon: BookMarked, label: 'Pipeline' },
    { href: '/clinical-trials-search', icon: Beaker, label: 'Clinical Trials' },
    { href: '/literature-review', icon: FlaskConical, label: 'Literature Review' },
  ];

  const adminNavItems = [
    { href: '/admin/pipelines', label: 'Pipelines' },
    { href: '/admin/users', label: 'Users' },
    { href: '#', label: 'Drugs', disabled: true },
    { href: '#', label: 'Key People', disabled: true },
    { href: '#', label: 'Other Data', disabled: true },
  ];

  const bottomNavItems = [
    { href: '/resource-hub', icon: Library, label: 'Resource Hub' },
    { href: '/whats-new', icon: Sparkles, label: "What's New" },
    { href: '/notifications', icon: Bell, label: 'Notifications', badge: unreadNotifications > 0 ? unreadNotifications : null },
  ];

  const helpMenuItems = [
    { href: '/help', icon: LifeBuoy, label: 'Help Center' },
    { href: '/community', icon: Users, label: 'Community' },
    { href: '/support', icon: Headset, label: 'Contact Support' },
  ];

  const userRole = user?.role || 'viewer';
  const userName = user?.email?.split('@')[0] || 'User';
  const userAvatarFallback = userName.slice(0, 2).toUpperCase();

  const getUpgradeButton = () => {
    if (!user || !user.plan) {
      return null;
    }
    const isPro = user.plan === 'pro';
    const buttonText = isPro ? "Upgrade to Enterprise" : "Upgrade to Pro";
    const buttonClass = isPro ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-green-500 hover:bg-green-600 text-white";

    return (
      <SidebarMenuItem>
        <Button asChild variant="default" className={cn("w-full justify-center", buttonClass)}>
          <Link href="/pricing">
            <Rocket className="mr-2 h-4 w-4" />
            {buttonText}
          </Link>
        </Button>
      </SidebarMenuItem>
    );
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="py-4">
            <Link href="/dashboard" className="w-full">
                <Image src="/pipelinex-logo.png" alt="PipelineX Logo" width={492} height={192} className="w-full h-auto" />
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {topNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label, side: 'right' }}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
            {(userRole === 'admin' || userRole === 'editor') && (
              <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <Shield />
                      <span>Admin</span>
                      <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform ease-in-out group-data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                </SidebarMenuItem>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {adminNavItems.map((item) => (
                      <SidebarMenuSubItem key={`${item.href}-${item.label}`}>
                        <Link href={item.href} passHref>
                          <SidebarMenuSubButton
                            isActive={pathname.startsWith(item.href)}
                            aria-disabled={item.disabled}
                            disabled={item.disabled}
                          >
                            {item.label}
                          </SidebarMenuSubButton>
                        </Link>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <Separator className="my-2 bg-sidebar-border" />
          <SidebarMenu>
            {bottomNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label, side: 'right' }}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                    {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <Popover>
                <PopoverTrigger asChild>
                  <SidebarMenuButton tooltip={{ children: 'Help', side: 'right' }}>
                    <HelpCircle />
                    <span className="grow">Help</span>
                  </SidebarMenuButton>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-56 bg-card border-border shadow-lg p-1">
                  <div className="flex flex-col space-y-1">
                    {helpMenuItems.map((item) => (
                      <Button key={item.href} asChild variant="ghost" className="justify-start">
                        <Link href={item.href}>
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.label}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </SidebarMenuItem>
          </SidebarMenu>
          <Separator className="my-2 bg-sidebar-border" />
          <SidebarMenu>
            {getUpgradeButton()}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between gap-4 border-b bg-secondary px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
          </div>
          <div className="flex flex-1 items-center justify-end gap-4">
            {user?.plan && (
              <div className="flex items-center gap-2">
                <Badge variant="default" className="capitalize text-sm hidden sm:inline-flex">
                  {user.plan} Plan
                </Badge>
                {user.plan !== 'pro' && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/pricing">Upgrade</Link>
                  </Button>
                )}
              </div>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="relative p-2 h-auto">
                  <Avatar className="size-8">
                    <AvatarImage src={`https://i.pravatar.cc/40?u=${user?.uid}`} alt={userName} />
                    <AvatarFallback>{userAvatarFallback}</AvatarFallback>
                  </Avatar>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 bg-card border-border shadow-lg p-1">
                <div className="p-2">
                  <p className="font-medium text-sm">{userName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <Separator />
                <div className="flex flex-col p-1">
                  <Button asChild variant="ghost" className="justify-start">
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="justify-start">
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="justify-start">
                    <Link href="/pricing">
                      <Rocket className="mr-2 h-4 w-4" />
                      Pricing & Upgrade
                    </Link>
                  </Button>
                  <Separator />
                  <Button variant="ghost" className="justify-start" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
