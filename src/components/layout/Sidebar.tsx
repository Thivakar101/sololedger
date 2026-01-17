'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    Receipt,
    Settings,
    Search,
    ShoppingCart,
    TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Billing', href: '/billing', icon: Receipt },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Sales', href: '/sales', icon: TrendingUp },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-zinc-950 text-white flex flex-col h-screen sticky top-0 border-r border-zinc-800">
            <div className="p-6">
                <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-blue-500" />
                    SoloLedger
                </h1>
            </div>
            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.name} href={item.href}>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full justify-start gap-3 px-3 py-6 h-12 text-zinc-400 hover:text-white hover:bg-zinc-900",
                                    isActive && "bg-zinc-900 text-white border-r-2 border-blue-500 rounded-none font-medium"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </Button>
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 mt-auto">
                <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Shortcuts</p>
                    <div className="space-y-1 text-xs text-zinc-400">
                        <div className="flex justify-between">
                            <span>New Bill</span>
                            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px]">ALT+N</kbd>
                        </div>
                        <div className="flex justify-between">
                            <span>Inventory</span>
                            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px]">ALT+I</kbd>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
