'use client';

import { useState, useMemo, useEffect } from 'react';
import { db, Product, Invoice, InvoiceItem } from '@/lib/db';
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
import { Trash2, Save, ShoppingCart, Plus, Minus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useShortcuts } from '@/hooks/use-shortcuts';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface BillingItem {
    productId: number;
    name: string;
    quantity: number;
    price: number;
}

export default function BillingPage() {
    useShortcuts();
    const router = useRouter();
    const [customerName, setCustomerName] = useState('Walk-in Customer');
    const [items, setItems] = useState<BillingItem[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [selectedProductIndex, setSelectedProductIndex] = useState(0);

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
                price: product.sellingPrice
            }]);
        }
        setProductSearch('');
        setSelectedProductIndex(0);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateQuantity = (index: number, delta: number) => {
        const newItems = [...items];
        newItems[index].quantity = Math.max(1, newItems[index].quantity + delta);
        setItems(newItems);
    };

    const handleSaveInvoice = async () => {
        if (items.length === 0) {
            toast.error('Add at least one item');
            return;
        }

        try {
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

                for (const item of items) {
                    await db.invoiceItems.add({
                        invoiceId: invoiceId as number,
                        productId: item.productId,
                        productName: item.name,
                        quantity: item.quantity,
                        priceAtSale: item.price
                    });

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
            router.push('/sales');
        } catch (error) {
            toast.error('Failed to generate invoice');
            console.error(error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (productSearch && products) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedProductIndex(prev => Math.min(products.length - 1, prev + 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedProductIndex(prev => Math.max(0, prev - 1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (products[selectedProductIndex]) {
                    handleAddProduct(products[selectedProductIndex]);
                }
            }
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-blue-500" />
                            <h3 className="font-bold text-white text-lg">New Invoice</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="customer" className="text-zinc-400">Customer:</Label>
                            <Input
                                id="customer"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="bg-zinc-950 border-zinc-800 h-8 w-48 text-white"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-zinc-950 border-b border-zinc-800">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <Input
                                placeholder="Start typing product name or SKU (Enter/Arrows to select)..."
                                className="pl-10 bg-zinc-900 border-zinc-800 text-white"
                                value={productSearch}
                                onChange={(e) => {
                                    setProductSearch(e.target.value);
                                    setSelectedProductIndex(0);
                                }}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                            {productSearch && products && products.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl z-50 max-h-60 overflow-y-auto">
                                    {products.map((p, i) => (
                                        <div
                                            key={p.id}
                                            className={`p-3 border-b border-zinc-800 last:border-0 cursor-pointer flex justify-between items-center ${i === selectedProductIndex ? 'bg-blue-600/20 text-blue-400' : 'text-zinc-300'}`}
                                            onClick={() => handleAddProduct(p)}
                                        >
                                            <div>
                                                <p className="font-medium">{p.name}</p>
                                                <p className="text-xs opacity-60 font-mono">{p.sku}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">₹{p.sellingPrice.toFixed(2)}</p>
                                                <p className="text-[10px] opacity-60">Stock: {p.currentStock}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="min-h-[400px]">
                        <Table>
                            <TableHeader className="bg-zinc-900/30">
                                <TableRow className="border-zinc-800">
                                    <TableHead className="text-zinc-400 w-12 text-center">#</TableHead>
                                    <TableHead className="text-zinc-400">Item Name</TableHead>
                                    <TableHead className="text-zinc-400 text-right">Price</TableHead>
                                    <TableHead className="text-zinc-400 text-center">Qty</TableHead>
                                    <TableHead className="text-zinc-400 text-right">Total</TableHead>
                                    <TableHead className="text-zinc-400 w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center text-zinc-500 italic">
                                            No items added. Search and select products above.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item, index) => (
                                        <TableRow key={index} className="border-zinc-800">
                                            <TableCell className="text-center text-zinc-500 text-xs">{index + 1}</TableCell>
                                            <TableCell className="font-medium text-white">{item.name}</TableCell>
                                            <TableCell className="text-right text-zinc-300">₹{item.price.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-3">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-6 h-6 border border-zinc-800 text-zinc-400 hover:text-white"
                                                        onClick={() => updateQuantity(index, -1)}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </Button>
                                                    <span className="w-8 text-center text-white font-bold">{item.quantity}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-6 h-6 border border-zinc-800 text-zinc-400 hover:text-white"
                                                        onClick={() => updateQuantity(index, 1)}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-white">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-8 h-8 text-zinc-600 hover:text-red-500"
                                                    onClick={() => handleRemoveItem(index)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-4">
                        Order Summary
                    </h3>

                    <div className="space-y-3">
                        <div className="flex justify-between text-zinc-400">
                            <span>Subtotal</span>
                            <span>₹{totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                            <span>GST (18%)</span>
                            <span>₹{totals.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                            <span>Discount</span>
                            <span className="text-emerald-500">-₹0.00</span>
                        </div>
                        <div className="pt-4 border-t border-zinc-800 flex justify-between items-end">
                            <span className="text-lg font-bold text-white">Net Amount</span>
                            <span className="text-3xl font-black text-blue-500">₹{totals.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-6">
                        <Button variant="ghost" className="border border-zinc-800 text-zinc-400 hover:text-white" onClick={() => setItems([])}>
                            Clear
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 font-bold" onClick={handleSaveInvoice}>
                            <Save className="w-4 h-4 mr-2" />
                            Complete Bill
                        </Button>
                    </div>
                </div>

                <div className="bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800 p-4">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-3 tracking-widest">Billing Tips</p>
                    <ul className="text-xs text-zinc-400 space-y-2">
                        <li className="flex items-start gap-2">
                            <kbd className="bg-zinc-800 px-1 rounded border border-zinc-700">Enter</kbd>
                            <span>Add selected product</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <kbd className="bg-zinc-800 px-1 rounded border border-zinc-700">↑/↓</kbd>
                            <span>Navigate search results</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
