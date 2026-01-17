'use client';

import { Profile, Invoice, InvoiceItem } from '@/lib/db';

interface InvoicePrintProps {
    profile: Profile | null;
    invoice: Invoice;
    items: InvoiceItem[];
}

export function InvoicePrint({ profile, invoice, items }: InvoicePrintProps) {
    const subtotal = items.reduce((acc, item) => acc + (item.priceAtSale * item.quantity), 0);
    const tax = subtotal * 0.18; // Default 18% GST

    return (
        <div className="bg-white text-black p-12 max-w-[850px] mx-auto min-h-[1100px] flex flex-col font-sans relative print:m-0 print:p-8" id="invoice-printable">

            {/* Header section */}
            <div className="flex justify-between items-start mb-16">
                <div>
                    <h1 className="text-2xl font-black text-[#2563eb] tracking-tight uppercase">
                        {profile?.businessName || 'SOLOLEDGER'} INVOICE
                    </h1>
                </div>

                <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Invoice Number</p>
                    <p className="text-xl font-black">#{invoice.invoiceNumber}</p>
                    <p className="text-xs text-zinc-500 mt-4">Date: {new Date(invoice.date).toLocaleDateString()}</p>
                </div>
            </div>

            {/* Bill To */}
            <div className="mb-12">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Billed To</p>
                <p className="text-2xl font-black">{invoice.customerName}</p>
            </div>

            {/* Items Table */}
            <div className="flex-1">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="text-left py-3 px-1 text-xs font-black w-10">#</th>
                            <th className="text-left py-3 px-1 text-xs font-black">Description</th>
                            <th className="text-right py-3 px-1 text-xs font-black w-24">Price</th>
                            <th className="text-center py-3 px-1 text-xs font-black w-20">Qty</th>
                            <th className="text-right py-3 px-1 text-xs font-black w-28">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index} className="border-b border-zinc-100">
                                <td className="py-4 px-1 text-sm text-zinc-500">{index + 1}</td>
                                <td className="py-4 px-1 text-sm font-medium">{item.productName}</td>
                                <td className="py-4 px-1 text-sm text-right">₹{item.priceAtSale.toFixed(2)}</td>
                                <td className="py-4 px-1 text-sm text-center">{item.quantity}</td>
                                <td className="py-4 px-1 text-sm text-right font-bold">₹{(item.priceAtSale * item.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="mt-12">
                <div className="flex flex-col items-end gap-3 pr-2">
                    <div className="flex justify-between w-64 text-sm">
                        <span className="text-zinc-500 font-medium">Subtotal</span>
                        <span className="font-bold">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between w-64 text-sm">
                        <span className="text-zinc-500 font-medium">Tax (GST 18%)</span>
                        <span className="font-bold">₹{tax.toFixed(2)}</span>
                    </div>
                    {invoice.discountAmount > 0 && (
                        <div className="flex justify-between w-64 text-sm text-emerald-600">
                            <span className="font-medium">Discount</span>
                            <span className="font-bold">-₹{invoice.discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between w-64 items-center mt-4">
                        <span className="text-sm font-black uppercase tracking-wider">Net Amount</span>
                        <span className="text-3xl font-black text-[#2563eb]">
                            ₹{invoice.totalAmount.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-24 text-center">
                <p className="text-xs text-zinc-400 font-medium italic">
                    {profile?.footerTerms || "Thank you for your business!"}
                </p>
                <div className="mt-8 flex justify-end">
                    <span className="text-[10px] text-zinc-300 font-mono">1/1</span>
                </div>
            </div>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                
                #invoice-printable {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    background-color: white !important;
                    color: black !important;
                }

                @media print {
                    #invoice-printable {
                        position: static !important;
                        width: 100% !important;
                        max-width: none !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }
                    @page {
                        margin: 1.5cm;
                        size: A4;
                    }
                }
            `}</style>
        </div>
    );
}
