'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, Profile } from '@/lib/db';

interface AppContextType {
    profile: Profile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshProfile = async () => {
        const p = await db.profiles.toCollection().first();
        setProfile(p || null);
        setLoading(false);
    };

    useEffect(() => {
        refreshProfile();
    }, []);

    return (
        <AppContext.Provider value={{ profile, loading, refreshProfile }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
}
