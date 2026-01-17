'use client';

import { useState, useEffect } from 'react';
import { db, Profile } from '@/lib/db';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, Building2, Phone, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { useShortcuts } from '@/hooks/use-shortcuts';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
    useShortcuts();
    const { profile, refreshProfile } = useAppContext();
    const [formData, setFormData] = useState<Partial<Profile>>({
        businessName: '',
        taxId: '',
        address: '',
        contact: '',
        currency: 'INR',
        brandColor: '#3b82f6',
        footerTerms: 'Thank you for your business!'
    });

    useEffect(() => {
        if (profile) {
            setFormData(profile);
        }
    }, [profile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (profile?.id) {
                await db.profiles.update(profile.id, formData);
            } else {
                await db.profiles.add(formData as Profile);
            }
            await refreshProfile();
            toast.success('Settings saved successfully');
        } catch (error) {
            toast.error('Failed to save settings');
            console.error(error);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8"
        >
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Settings</h2>
                <p className="text-muted-foreground text-sm">Configure your business identity and billing defaults.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="size-5 text-primary" />
                            Business Identity
                        </CardTitle>
                        <CardDescription>This information will appear on all your invoices.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="businessName">Business Name</Label>
                                <Input
                                    id="businessName"
                                    name="businessName"
                                    value={formData.businessName}
                                    onChange={handleChange}
                                    required
                                    placeholder="SoloLedger Inc."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="taxId">Tax ID (GST/VAT)</Label>
                                <Input
                                    id="taxId"
                                    name="taxId"
                                    value={formData.taxId}
                                    onChange={handleChange}
                                    placeholder="29AAAAA0000A1Z5"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Full Business Address</Label>
                            <Input
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Street, City, State - PIN"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="contact">Contact Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        id="contact"
                                        name="contact"
                                        value={formData.contact}
                                        onChange={handleChange}
                                        className="pl-10"
                                        placeholder="+91 99999 99999"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency">Default Currency</Label>
                                <Input
                                    id="currency"
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleChange}
                                    placeholder="INR"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="size-5 text-emerald-500" />
                            Appearance
                        </CardTitle>
                        <CardDescription>Customize how SoloLedger looks on your device.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="space-y-4">
                            <Label>Theme Preference</Label>
                            <ThemeToggle />
                        </div>
                        
                        <div className="space-y-2">
                             <Label>Bill Branding</Label>
                             <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-4">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="brandColor">Brand Color</Label>
                                        <div className="flex gap-3">
                                            <div
                                                className="size-10 rounded-xl border border-border shadow-sm transition-transform hover:scale-105"
                                                style={{ backgroundColor: formData.brandColor }}
                                            />
                                            <Input
                                                id="brandColor"
                                                name="brandColor"
                                                value={formData.brandColor}
                                                onChange={handleChange}
                                                placeholder="#000000"
                                                className="font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="footerTerms">Footer Terms & Conditions</Label>
                                    <textarea
                                        id="footerTerms"
                                        name="footerTerms"
                                        value={formData.footerTerms}
                                        onChange={handleChange}
                                        className="w-full h-24 bg-background/50 border border-input rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all resize-none"
                                        placeholder="Terms mentioned at the bottom of invoice..."
                                    />
                                </div>
                             </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button 
                        type="submit" 
                        size="lg" 
                        className="font-bold shadow-lg shadow-primary/20"
                    >
                        <Save className="size-5 mr-2" />
                        Save All Changes
                    </Button>
                </div>
            </form>
        </motion.div>
    );
}

function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="grid grid-cols-3 gap-3 max-w-md">
            <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    theme === "light" 
                        ? "border-primary bg-primary/5" 
                        : "border-border/50 hover:border-border hover:bg-muted/50"
                }`}
            >
                <div className="w-full aspect-video rounded-lg bg-[#f4f4f5] border border-zinc-200 relative overflow-hidden shadow-sm">
                    <div className="absolute top-2 left-2 w-8 h-2 bg-white rounded-full shadow-sm" />
                    <div className="absolute top-6 left-2 w-16 h-12 bg-white rounded-md shadow-sm border border-zinc-100" />
                </div>
                <span className="text-sm font-medium">Light</span>
            </button>
            <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    theme === "dark" 
                        ? "border-primary bg-primary/5" 
                        : "border-border/50 hover:border-border hover:bg-muted/50"
                }`}
            >
                <div className="w-full aspect-video rounded-lg bg-[#09090b] border border-zinc-800 relative overflow-hidden shadow-sm">
                    <div className="absolute top-2 left-2 w-8 h-2 bg-zinc-800 rounded-full" />
                    <div className="absolute top-6 left-2 w-16 h-12 bg-zinc-900 rounded-md border border-zinc-800" />
                </div>
                <span className="text-sm font-medium">Dark</span>
            </button>
            <button
                type="button"
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    theme === "system" 
                        ? "border-primary bg-primary/5" 
                        : "border-border/50 hover:border-border hover:bg-muted/50"
                }`}
            >
                <div className="w-full aspect-video rounded-lg bg-gradient-to-br from-[#f4f4f5] to-[#09090b] border border-border relative overflow-hidden shadow-sm flex items-center justify-center">
                    <div className="size-6 rounded-full bg-background/20 backdrop-blur-md border border-white/10" />
                </div>
                <span className="text-sm font-medium">System</span>
            </button>
        </div>
    );
}
