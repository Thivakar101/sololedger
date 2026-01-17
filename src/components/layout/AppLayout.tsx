import { Sidebar } from './Sidebar';
import { Toaster } from '@/components/ui/sonner';

export function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-background font-sans antialiased text-foreground selection:bg-primary/10">
            <Sidebar />
            <main className="flex-1 relative overflow-hidden flex flex-col">
                <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] pointer-events-none" />
                <div className="flex-1 overflow-y-auto p-8 relative z-10">
                    <div className="max-w-7xl mx-auto space-y-10 pb-10">
                        {children}
                    </div>
                </div>
            </main>
            <Toaster position="bottom-right" />
        </div>
    );
}
