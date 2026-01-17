'use client';

import { useState, useEffect } from 'react';
import { db, Profile } from '@/lib/db';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save, Building2, MapPin, Phone, Mail, Globe, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { useShortcuts } from '@/hooks/use-shortcuts';

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
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Settings</h2>
                <p className="text-zinc-500 text-sm">Configure your business identity and billing defaults.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <Card className="bg-zinc-950 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-500" />
                            Business Identity
                        </CardTitle>
                        <CardDescription>This information will appear on all your invoices.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="businessName">Business Name</Label>
                                <Input
                                    id="businessName"
                                    name="businessName"
                                    value={formData.businessName}
                                    onChange={handleChange}
                                    className="bg-zinc-900 border-zinc-800"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="taxId">Tax ID (GST/VAT Number)</Label>
                                <Input
                                    id="taxId"
                                    name="taxId"
                                    value={formData.taxId}
                                    onChange={handleChange}
                                    className="bg-zinc-900 border-zinc-800"
                                    placeholder="e.g., 29AAAAA0000A1Z5"
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
                                className="bg-zinc-900 border-zinc-800"
                                placeholder="Street, City, State - PIN"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contact">Contact Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        id="contact"
                                        name="contact"
                                        value={formData.contact}
                                        onChange={handleChange}
                                        className="pl-10 bg-zinc-900 border-zinc-800"
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
                                    className="bg-zinc-900 border-zinc-800"
                                    placeholder="e.g., INR"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-950 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="w-5 h-5 text-emerald-500" />
                            Bill Customization
                        </CardTitle>
                        <CardDescription>Personalize the look and feel of your bills.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="brandColor">Brand Color</Label>
                                <div className="flex gap-3">
                                    <div
                                        className="w-10 h-10 rounded border border-zinc-700"
                                        style={{ backgroundColor: formData.brandColor }}
                                    />
                                    <Input
                                        id="brandColor"
                                        name="brandColor"
                                        value={formData.brandColor}
                                        onChange={handleChange}
                                        className="bg-zinc-900 border-zinc-800"
                                        placeholder="#000000"
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
                                className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Terms mentioned at the bottom of invoice..."
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-8 py-6 font-bold text-lg">
                        <Save className="w-5 h-5 mr-2" />
                        Save All Changes
                    </Button>
                </div>
            </form>
        </div>
    );
}
