'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useShortcuts() {
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // ALT+N: New Invoice
            if (e.altKey && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                router.push('/billing');
            }
            // ALT+I: Inventory
            if (e.altKey && e.key.toLowerCase() === 'i') {
                e.preventDefault();
                router.push('/inventory');
            }
            // ALT+D: Dashboard
            if (e.altKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                router.push('/');
            }
            // ALT+S: Settings
            if (e.altKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                router.push('/settings');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);
}
