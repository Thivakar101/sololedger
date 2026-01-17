'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import {db, Invoice, InvoiceItem } from '@/lib/db';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, FileText, Calendar, User, Search, Printer, X, Eye, TrendingUp, Receipt, DollarSign } from 'lucide-react';
import { useShortcuts } from '@/hooks/use-shortcuts';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useReactToPrint } from 'react-to-print';
import { InvoicePrint } from '@/components/InvoicePrint';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function SalesPage() {
    useShortcuts();
    const [searchTerm, setSearchTerm] = useState('');
    const [printInvoiceData, setPrintInvoiceData] = useState<{
        invoice: any;
        items: any[];
    } | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<{ invoice: Invoice, items: InvoiceItem[] } | null>(null);
    const printRef = useRef<HTMLDivElement>(null);
    const { profile } = useAppContext();

    const invoices = useLiveQuery(() => db.invoices.orderBy('date').reverse().toArray());

    const stats = useMemo(() => {
        if (!invoices) return { total: 0, revenue: 0, today: 0 };
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return {
            total: invoices.length,
            revenue: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
            today: invoices.filter(inv => {
                const invDate = new Date(inv.date);
                invDate.setHours(0, 0, 0, 0);
                return invDate.getTime() === today.getTime();
            }).length
        };
    }, [invoices]);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        onAfterPrint: () => setPrintInvoiceData(null),
    });

    useEffect(() => {
        if (printInvoiceData) {
            setTimeout(() => {
                handlePrint();
            }, 150);
        }
    }, [printInvoiceData, handlePrint]);

    const triggerPrint = async (invoice: any, e: React.MouseEvent) => {
        e.stopPropagation();
        const items = await db.invoiceItems.where('invoiceId').equals(invoice.id).toArray();
        setPrintInvoiceData({ invoice, items });
    };

    const openInvoiceDetails = async (invoice: Invoice) => {
        const items = await db.invoiceItems.where('invoiceId').equals(invoice.id).toArray();
        setSelectedInvoice({ invoice, items });
    };

    const filteredInvoices = invoices?.filter(inv =>
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Print Container */}
            <div className="print-container">
                <div ref={printRef}>
                    {printInvoiceData && profile && (
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Invoices</p>
                                    <p className="text-2xl font-black mt-1">{stats.total}</p>
                                </div>
                                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Receipt className="size-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Revenue</p>
                                    <p className="text-2xl font-black mt-1 text-emerald-600">₹{stats.revenue.toFixed(2)}</p>
                                </div>
                                <div className="size-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <TrendingUp className="size-6 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Today's Sales</p>
                                    <p className="text-2xl font-black mt-1 text-blue-600">{stats.today}</p>
                                </div>
                                <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <Calendar className="size-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Sales History</h2>
                    <p className="text-muted-foreground text-sm">View and manage all invoices</p>
                </div>
                <div className="relative w-full sm:w-auto min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search invoices or customers..."
                        className="pl-10 bg-background/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Invoices Table */}
            <Card className="overflow-hidden border-border/50 shadow-sm bg-card/50 backdrop-blur-xl">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="border-border/50 hover:bg-transparent">
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="w-[120px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!filteredInvoices || filteredInvoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                                    {invoices?.length === 0 ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Receipt className="size-12 opacity-20" />
                                            <p>No sales yet. Create your first invoice in Billing.</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Search className="size-12 opacity-20" />
                                            <p>No invoices match your search.</p>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredInvoices.map((invoice, i) => (
                                <motion.tr
                                    key={invoice.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="border-b border-border/50 hover:bg-muted/30 transition-colors group cursor-pointer"
                                    onClick={() => openInvoiceDetails(invoice)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                                <FileText className="size-4 text-primary" />
                                            </div>
                                            <span className="font-mono text-sm font-medium text-primary">{invoice.invoiceNumber}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="size-3.5" />
                                            <span className="text-xs">{new Date(invoice.date).toLocaleDateString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-foreground font-medium">
                                            <User className="size-3.5 text-muted-foreground" />
                                            <span>{invoice.customerName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={invoice.status === 'Paid' ? 'outline' : 'secondary'}
                                            className={invoice.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' : ''}
                                        >
                                            {invoice.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-0.5 font-bold text-foreground">
                                            <IndianRupee className="size-3 text-muted-foreground" />
                                            <span>{invoice.totalAmount.toFixed(2)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-primary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openInvoiceDetails(invoice);
                                                }}
                                                title="View Details"
                                            >
                                                <Eye className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-primary"
                                                onClick={(e) => triggerPrint(invoice, e)}
                                                title="Print Invoice"
                                            >
                                                <Printer className="size-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </motion.tr>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Invoice Details Modal */}
            <AnimatePresence>
                {selectedInvoice && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedInvoice(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between z-10">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Receipt className="size-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedInvoice.invoice.invoiceNumber}</h2>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(selectedInvoice.invoice.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setPrintInvoiceData(selectedInvoice);
                                            setSelectedInvoice(null);
                                        }}
                                    >
                                        <Printer className="mr-2 size-4" />
                                        Print
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedInvoice(null)}>
                                        <X className="size-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 space-y-6">
                                {/* Customer Info */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Customer</p>
                                        <p className="text-lg font-bold">{selectedInvoice.invoice.customerName}</p>
                                    </div>
                                    <Badge
                                        variant={selectedInvoice.invoice.status === 'Paid' ? 'outline' : 'secondary'}
                                        className={cn(
                                            "text-sm px-3 py-1",
                                            selectedInvoice.invoice.status === 'Paid' && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                        )}
                                    >
                                        {selectedInvoice.invoice.status}
                                    </Badge>
                                </div>

                                {/* Items Table */}
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Invoice Items</h3>
                                    <div className="border border-border/50 rounded-xl overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-muted/30">
                                                <TableRow className="hover:bg-transparent border-border/50">
                                                    <TableHead className="w-12">#</TableHead>
                                                    <TableHead>Product</TableHead>
                                                    <TableHead className="text-center">Qty</TableHead>
                                                    <TableHead className="text-right">Price</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedInvoice.items.map((item, index) => (
                                                    <TableRow key={item.id} className="border-border/50">
                                                        <TableCell className="text-muted-foreground text-xs">{index + 1}</TableCell>
                                                        <TableCell className="font-medium">{item.productName}</TableCell>
                                                        <TableCell className="text-center font-mono">{item.quantity}</TableCell>
                                                        <TableCell className="text-right font-mono">₹{item.priceAtSale.toFixed(2)}</TableCell>
                                                        <TableCell className="text-right font-bold font-mono">
                                                            ₹{(item.priceAtSale * item.quantity).toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                {/* Totals */}
                                <div className="flex justify-end">
                                    <div className="w-80 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span className="font-mono">
                                                ₹{(selectedInvoice.invoice.totalAmount - selectedInvoice.invoice.taxAmount).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Tax (GST 18%)</span>
                                            <span className="font-mono">₹{selectedInvoice.invoice.taxAmount.toFixed(2)}</span>
                                        </div>
                                        {selectedInvoice.invoice.discountAmount > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Discount</span>
                                                <span className="font-mono text-emerald-600">
                                                    -₹{selectedInvoice.invoice.discountAmount.toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="border-t border-dashed border-border/50 pt-3"></div>
                                        <div className="flex justify-between items-center bg-primary/5 rounded-xl p-4 border border-primary/20">
                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Amount</span>
                                            <span className="text-2xl font-black text-primary">
                                                ₹{selectedInvoice.invoice.totalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
