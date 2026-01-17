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
import { motion } from 'framer-motion';

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
        <aside className="w-64 bg-card/30 backdrop-blur-xl text-card-foreground flex flex-col h-screen sticky top-0 border-r border-border/50">
            <div className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
                <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 relative z-10">
                    <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20 shadow-inner">
                        <ShoppingCart className="size-4 text-primary" />
                    </div>
                    SoloLedger
                </h1>
            </div>
            <nav className="flex-1 px-4 space-y-2 mt-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.name} href={item.href}>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start gap-3 px-3 py-6 h-12 text-muted-foreground hover:text-foreground hover:bg-white/5",
                                        isActive && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-medium shadow-sm border border-primary/10"
                                    )}
                                >
                                    <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                                    {item.name}
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-nav-pill"
                                            className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </Button>
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 mt-auto">
                <div className="p-4 bg-card/40 rounded-xl border border-border/50 shadow-sm backdrop-blur-md">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-3 tracking-widest">Shortcuts</p>
                    <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex justify-between items-center group">
                            <span className="group-hover:text-foreground transition-colors">New Bill</span>
                            <kbd className="px-1.5 py-0.5 rounded-md bg-background/50 border border-border/50 text-[10px] shadow-sm group-hover:bg-background group-hover:border-primary/20 transition-colors">ALT+N</kbd>
                        </div>
                        <div className="flex justify-between items-center group">
                            <span className="group-hover:text-foreground transition-colors">Inventory</span>
                            <kbd className="px-1.5 py-0.5 rounded-md bg-background/50 border border-border/50 text-[10px] shadow-sm group-hover:bg-background group-hover:border-primary/20 transition-colors">ALT+I</kbd>
                        </div>
                    </div>
                </div>
                 <div className="mt-6 text-center">
                    <p className="text-[10px] text-muted-foreground/60 font-medium tracking-tight">
                        Designed & Developed by
                    </p>
                    <p className="text-[11px] text-primary/80 font-bold uppercase tracking-widest mt-0.5 hover:text-primary transition-colors cursor-default">
                        Quadrax Solutions
                    </p>
                </div>
            </div>
        </aside>
    );
}
