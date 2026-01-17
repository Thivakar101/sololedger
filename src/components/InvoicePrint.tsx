'use client';

import { Profile, Invoice, InvoiceItem } from '@/lib/db';
import { IndianRupee } from 'lucide-react';

interface InvoicePrintProps {
    profile: Profile | null;
    invoice: Invoice;
    items: InvoiceItem[];
}

export function InvoicePrint({ profile, invoice, items }: InvoicePrintProps) {
    return (
        <div className="bg-white text-black p-8 max-w-[800px] mx-auto min-h-[1000px] flex flex-col font-sans border border-zinc-100 shadow-sm print:border-0 print:shadow-none print:m-0" id="invoice-printable">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 pb-6 border-zinc-100 mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-blue-600 mb-1">
                        {profile?.businessName || 'SoloLedger Invoice'}
                    </h1>
                    <p className="text-zinc-500 text-sm max-w-[300px] whitespace-pre-line">
                        {profile?.address}
                    </p>
                    {profile?.contact && (
                        <p className="text-zinc-500 text-sm mt-1">
                            Contact: {profile.contact}
                        </p>
                    )}
                </div>
                <div className="text-right">
                    <div className="bg-zinc-100 px-4 py-2 rounded mb-2 inline-block">
                        <span className="text-xs uppercase font-bold text-zinc-500 tracking-widest">Invoice Number</span>
                        <p className="text-lg font-mono font-bold">#{invoice.invoiceNumber}</p>
                    </div>
                    <div className="text-xs text-zinc-500 mt-2">
                        <p>Date: {new Date(invoice.date).toLocaleDateString()}</p>
                        {profile?.taxId && <p className="mt-1">GSTIN: {profile.taxId}</p>}
                    </div>
                </div>
            </div>

            {/* Bill To */}
            <div className="mb-8">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest mb-1 block">Billed To</span>
                <p className="text-lg font-bold">{invoice.customerName}</p>
            </div>

            {/* Items Table */}
            <div className="flex-1">
                <table className="w-full text-sm">
                    <thead className="border-b-2 border-zinc-900 bg-zinc-50">
                        <tr>
                            <th className="text-left py-3 px-2 w-12">#</th>
                            <th className="text-left py-3 px-2">Description</th>
                            <th className="text-right py-3 px-2 w-24">Price</th>
                            <th className="text-center py-3 px-2 w-24">Qty</th>
                            <th className="text-right py-3 px-2 w-32">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index} className="border-b border-zinc-100">
                                <td className="py-4 px-2 text-zinc-400">{index + 1}</td>
                                <td className="py-4 px-2 font-medium">{item.productName}</td>
                                <td className="py-4 px-2 text-right">₹{item.priceAtSale.toFixed(2)}</td>
                                <td className="py-4 px-2 text-center">{item.quantity}</td>
                                <td className="py-4 px-2 text-right font-bold">₹{(item.priceAtSale * item.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="mt-8 border-t-2 border-zinc-100 pt-6">
                <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-zinc-500">
                            <span>Subtotal</span>
                            <span>₹{(invoice.totalAmount - invoice.taxAmount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-zinc-500">
                            <span>Tax (GST 18%)</span>
                            <span>₹{invoice.taxAmount.toFixed(2)}</span>
                        </div>
                        {invoice.discountAmount > 0 && (
                            <div className="flex justify-between text-emerald-500 font-medium">
                                <span>Discount</span>
                                <span>-₹{invoice.discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-end pt-2 border-t border-zinc-100 mt-2">
                            <span className="text-sm font-bold uppercase tracking-widest">Net Amount</span>
                            <span className="text-2xl font-black text-blue-600">₹{invoice.totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-16 border-t border-zinc-100 pt-8 text-center">
                <p className="text-zinc-500 text-sm mb-4">
                    {profile?.footerTerms || 'Thank you for your business!'}
                </p>
                <div className="flex justify-center gap-12 mt-8 opacity-30 italic">
                    <div className="flex flex-col items-center">
                        <div className="w-24 border-b border-black mb-1"></div>
                        <span className="text-[10px]">Customer Signature</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-24 border-b border-black mb-1"></div>
                        <span className="text-[10px]">Authorized Signatory</span>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #invoice-printable, #invoice-printable * {
                        visibility: visible;
                    }
                    #invoice-printable {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        max-width: none !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    @page {
                        margin: 1cm;
                    }
                }
            `}</style>
        </div>
    );
}
