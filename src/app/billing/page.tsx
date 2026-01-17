'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { db, Product } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, ShoppingCart, Plus, Minus, Search, ArrowRight, Receipt, ShoppingBasket, List, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useShortcuts } from '@/hooks/use-shortcuts';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReactToPrint } from 'react-to-print';
import { InvoicePrint } from '@/components/InvoicePrint';
import { useAppContext } from '@/context/AppContext';

interface BillingItem {
    productId: number;
    name: string;
    quantity: number;
    price: number;
    sku: string;
}

export default function BillingPage() {
    useShortcuts();
    const router = useRouter();
    const { profile } = useAppContext();
    const [customerName, setCustomerName] = useState('Walk-in Customer');
    const [items, setItems] = useState<BillingItem[]>([]);
    const [productSearch, setProductSearch] = useState('');

    // Print State
    const [printInvoiceData, setPrintInvoiceData] = useState<{
        invoice: any;
        items: any[];
    } | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    // Split View State
    const [leftPanelWidth, setLeftPanelWidth] = useState(60); // Percentage
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter products
    const products = useLiveQuery(
        () => db.products.filter(p =>
            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.sku.toLowerCase().includes(productSearch.toLowerCase())
        ).toArray(),
        [productSearch]
    );

    const totals = useMemo(() => {
        const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const tax = subtotal * 0.18; // Default 18% tax
        return {
            subtotal,
            tax,
            total: subtotal + tax
        };
    }, [items]);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        onAfterPrint: () => {
            setPrintInvoiceData(null);
            router.push('/sales');
        },
    });

    useEffect(() => {
        if (printInvoiceData) {
            // Short delay to ensure component is rendered
            const timer = setTimeout(() => {
                handlePrint();
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [printInvoiceData, handlePrint]);

    const handleAddProduct = (product: Product) => {
        const existingItemIndex = items.findIndex(i => i.productId === product.id);
        if (existingItemIndex > -1) {
            const newItems = [...items];
            newItems[existingItemIndex].quantity += 1;
            setItems(newItems);
        } else {
            setItems([...items, {
                productId: product.id!,
                name: product.name,
                quantity: 1,
                price: product.sellingPrice,
                sku: product.sku
            }]);
        }
        toast.success(`Added ${product.name}`);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateQuantity = (index: number, delta: number) => {
        const newItems = [...items];
        newItems[index].quantity = Math.max(1, newItems[index].quantity + delta);
        setItems(newItems);
    };

    const handleSaveInvoice = async (shouldPrint: boolean = false) => {
        if (items.length === 0) {
            toast.error('Add at least one item');
            return;
        }

        try {
            let savedInvoice: any = null;
            let savedItems: any[] = [];

            await db.transaction('rw', db.invoices, db.invoiceItems, db.products, async () => {
                const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
                const invoiceId = await db.invoices.add({
                    invoiceNumber,
                    date: new Date(),
                    customerName,
                    totalAmount: totals.total,
                    taxAmount: totals.tax,
                    discountAmount: 0,
                    status: 'Paid'
                });

                savedInvoice = await db.invoices.get(invoiceId);

                for (const item of items) {
                    const itemId = await db.invoiceItems.add({
                        invoiceId: invoiceId as number,
                        productId: item.productId,
                        productName: item.name,
                        quantity: item.quantity,
                        priceAtSale: item.price
                    });

                    const savedItem = await db.invoiceItems.get(itemId);
                    if (savedItem) savedItems.push(savedItem);

                    // Deduct stock
                    const product = await db.products.get(item.productId);
                    if (product) {
                        await db.products.update(item.productId, {
                            currentStock: product.currentStock - item.quantity
                        });
                    }
                }
            });

            toast.success('Invoice generated successfully');

            if (shouldPrint && savedInvoice) {
                setPrintInvoiceData({ invoice: savedInvoice, items: savedItems });
                setItems([]);
                setCustomerName('Walk-in Customer');
                // router.push will happen onAfterPrint
            } else {
                setItems([]);
                setCustomerName('Walk-in Customer');
                router.push('/sales');
            }
        } catch (error) {
            toast.error('Failed to generate invoice');
            console.error(error);
        }
    };

    // Resizing Logic
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

        // Clamp between 30% and 70%
        setLeftPanelWidth(Math.min(Math.max(newWidth, 30), 70));
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);


    return (
        <div
            ref={containerRef}
            className="flex h-[calc(100vh-100px)] overflow-hidden gap-0 relative select-none"
        >
            {/* Print Container */}
            <div className="print-container">
                <div ref={printRef}>
                    {printInvoiceData && (
                        <InvoicePrint
                            invoice={printInvoiceData.invoice}
                            items={printInvoiceData.items}
                            profile={profile}
                        />
                    )}
                </div>
            </div>

            <style jsx>{`
                .print-container {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    visibility: hidden;
                    pointer-events: none;
                }

                @media print {
                    .print-container {
                        visibility: visible;
                        position: static;
                    }
                }
            `}</style>

            {/* LEFT PANEL: CART & SUMMARY */}
            <motion.div
                className="flex flex-col gap-6 pr-4 h-full overflow-hidden"
                style={{ width: `${leftPanelWidth}%` }}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                {/* Header: Customer Info */}
                <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-4 shadow-sm flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <ShoppingCart className="size-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-foreground leading-none">Current Sale</h3>
                            <p className="text-xs text-muted-foreground font-mono mt-1">{items.length} Items</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Label htmlFor="customer" className="text-muted-foreground text-xs uppercase font-bold">Customer</Label>
                        <Input
                            id="customer"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="bg-background/50 border-border/50 h-9 w-48 text-sm"
                        />
                    </div>
                </div>

                {/* Cart Table */}
                <Card className="flex-1 border-border/50 shadow-sm bg-card/60 backdrop-blur-sm flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader className="bg-muted/30 sticky top-0 z-10">
                                <TableRow className="border-border/50 hover:bg-transparent text-xs">
                                    <TableHead className="w-10 text-center font-bold">#</TableHead>
                                    <TableHead className="font-bold">Item</TableHead>
                                    <TableHead className="text-right font-bold w-24">Price</TableHead>
                                    <TableHead className="text-center font-bold w-28">Qty</TableHead>
                                    <TableHead className="text-right font-bold w-24">Total</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence initial={false}>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-64 text-center">
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="flex flex-col items-center justify-center text-muted-foreground/40 gap-4"
                                                >
                                                    <div className="bg-muted/20 p-6 rounded-full animate-pulse">
                                                        <ShoppingBasket className="size-12" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-lg font-medium">Cart is Empty</p>
                                                        <p className="text-sm">Select items from the catalog to begin.</p>
                                                    </div>
                                                </motion.div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((item, index) => (
                                            <motion.tr
                                                key={`${item.productId}-${index}`}
                                                layout
                                                initial={{ opacity: 0, x: -20, backgroundColor: "rgba(var(--primary), 0.1)" }}
                                                animate={{ opacity: 1, x: 0, backgroundColor: "transparent" }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                                className="border-b border-border/50 group hover:bg-muted/10 transition-colors text-sm"
                                            >
                                                <TableCell className="text-center text-muted-foreground font-mono">{index + 1}</TableCell>
                                                <TableCell className="font-medium">
                                                    {item.name}
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums text-muted-foreground">₹{item.price.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-center gap-1 bg-muted/40 rounded-lg p-0.5 w-fit mx-auto border border-border/20">
                                                        <Button variant="ghost" size="icon" className="size-5 rounded hover:bg-background hover:shadow-sm" onClick={() => updateQuantity(index, -1)}><Minus className="size-3" /></Button>
                                                        <span className="w-6 text-center font-bold text-xs tabular-nums">{item.quantity}</span>
                                                        <Button variant="ghost" size="icon" className="size-5 rounded hover:bg-background hover:shadow-sm" onClick={() => updateQuantity(index, 1)}><Plus className="size-3" /></Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-bold tabular-nums">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="size-7 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveItem(index)}>
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </TableCell>
                                            </motion.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                {/* Summary / Totals - Horizontal Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card shadow-lg border border-border/50 rounded-2xl p-4 shrink-0 grid grid-cols-4 gap-4 items-center"
                >
                    <div className="col-span-1 border-r border-border/50 pr-4">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Subtotal</p>
                        <p className="text-lg font-mono font-medium">₹{totals.subtotal.toFixed(2)}</p>
                    </div>
                    <div className="col-span-1 border-r border-border/50 pr-4">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Tax (18%)</p>
                        <p className="text-lg font-mono font-medium">₹{totals.tax.toFixed(2)}</p>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-3">
                        <div className="text-right mr-4">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Payable</p>
                            <motion.p
                                key={totals.total}
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                                className="text-3xl font-black text-primary tracking-tighter"
                            >
                                ₹{totals.total.toFixed(2)}
                            </motion.p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button
                                size="lg"
                                className="h-11 px-6 text-base shadow-lg shadow-primary/25 rounded-xl font-bold"
                                onClick={() => handleSaveInvoice(false)}
                            >
                                Checkout <ArrowRight className="ml-2 size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-6 text-xs font-bold border-primary/20 hover:bg-primary/5 text-primary"
                                onClick={() => handleSaveInvoice(true)}
                            >
                                <Printer className="mr-2 size-3.5" /> Save & Print
                            </Button>
                        </div>
                    </div>
                </motion.div>

            </motion.div>

            {/* DRAG HANDLE */}
            <div
                className="w-1.5 cursor-col-resize flex items-center justify-center hover:bg-primary/20 transition-colors group relative z-50"
                onMouseDown={handleMouseDown}
            >
                <div className="w-0.5 h-16 bg-border group-hover:bg-primary transition-colors rounded-full" />
                {isDragging && <div className="absolute inset-y-0 -left-96 -right-96 z-50 cursor-col-resize" />}
            </div>

            {/* RIGHT PANEL: ITEMS CATALOG */}
            <motion.div
                className="flex flex-col gap-6 pl-4 h-full overflow-hidden bg-muted/5 rounded-l-3xl border-l border-border/50 shadow-inner"
                style={{ flex: 1 }}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <div className="p-6 pb-0 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-xl flex items-center gap-2">
                            <List className="size-5 text-muted-foreground" />
                            Product Catalog
                        </h3>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search products..."
                            className="pl-10 h-11 bg-background shadow-sm border-border/60"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 pt-2">
                    <div className="flex flex-col gap-2">
                        <AnimatePresence mode="popLayout">
                            {products?.map((product, i) => (
                                <motion.button
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ delay: i * 0.03 }}
                                    whileHover={{ scale: 1.01, backgroundColor: "rgba(var(--primary), 0.05)" }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => handleAddProduct(product)}
                                    disabled={product.currentStock === 0}
                                    className={cn(
                                        "flex items-center justify-between w-full text-left bg-card hover:border-primary/50 border border-border/50 p-4 rounded-xl shadow-sm hover:shadow-md transition-all group",
                                        product.currentStock === 0 && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <div className="flex flex-col">
                                        <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{product.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="secondary" className="text-[10px] h-5 bg-muted font-mono px-1.5">{product.sku}</Badge>
                                            <span className={cn("text-[10px] font-bold uppercase tracking-wider", product.currentStock < 10 ? "text-destructive" : "text-emerald-500")}>
                                                {product.currentStock} in stock
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-lg font-black text-foreground">₹{product.sellingPrice}</span>
                                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Plus className="size-4 text-primary" />
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </AnimatePresence>
                        {products?.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-64 flex flex-col items-center justify-center text-muted-foreground text-center"
                            >
                                <Search className="size-10 mb-2 opacity-20" />
                                <p className="font-medium">No products found</p>
                                <p className="text-sm opacity-50">Try searching for something else</p>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
