'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, FileText, Calendar, User } from 'lucide-react';
import { useShortcuts } from '@/hooks/use-shortcuts';

export default function SalesPage() {
    useShortcuts();

    const invoices = useLiveQuery(
        () => db.invoices.orderBy('date').reverse().toArray()
    );

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Sales History</h2>
                <p className="text-zinc-500 text-sm">View and track all and past invoices.</p>
            </div>

            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
                <Table>
                    <TableHeader className="bg-zinc-900/50">
                        <TableRow className="border-zinc-800">
                            <TableHead className="text-zinc-400">Invoice #</TableHead>
                            <TableHead className="text-zinc-400">Date</TableHead>
                            <TableHead className="text-zinc-400">Customer</TableHead>
                            <TableHead className="text-zinc-400">Status</TableHead>
                            <TableHead className="text-zinc-400 text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!invoices || invoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center text-zinc-500 italic">
                                    No sales history found. Start billing to see invoices here.
                                </TableCell>
                            </TableRow>
                        ) : (
                            invoices.map((invoice) => (
                                <TableRow key={invoice.id} className="border-zinc-800 hover:bg-zinc-900/50 transition-colors group cursor-pointer">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                                <FileText className="w-4 h-4 text-zinc-400" />
                                            </div>
                                            <span className="font-mono text-sm text-blue-400">{invoice.invoiceNumber}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-zinc-400">
                                            <Calendar className="w-3 h-3" />
                                            <span className="text-xs">{invoice.date.toLocaleDateString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-zinc-300">
                                            <User className="w-3 h-3 text-zinc-500" />
                                            <span>{invoice.customerName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={invoice.status === 'Paid' ? 'default' : 'secondary'} className={invoice.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : ''}>
                                            {invoice.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1 font-bold text-white">
                                            <IndianRupee className="w-3 h-3 text-zinc-500" />
                                            <span>{invoice.totalAmount.toFixed(2)}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
