'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Receipt,
  AlertTriangle,
  IndianRupee,
  Plus,
  FileText,
  TrendUp
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useMemo } from "react";

export default function Dashboard() {
  useShortcuts();

  const invoices = useLiveQuery(() => db.invoices.toArray());
  const products = useLiveQuery(() => db.products.toArray());

  const stats = useMemo(() => {
    if (!invoices || !products) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = invoices
      .filter(inv => new Date(inv.date) >= today)
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const stockValue = products.reduce((sum, prod) => sum + (prod.purchasePrice * prod.currentStock), 0);
    const unpaidBills = invoices.filter(inv => inv.status === 'Unpaid').length;
    const lowStockItems = products.filter(prod => prod.currentStock < 10);
    const recentInvoices = [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return {
      todaySales,
      stockValue,
      unpaidBills,
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.slice(0, 5),
      recentInvoices
    };
  }, [invoices, products]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard</h2>
          <p className="text-zinc-500">Welcome to SoloLedger. Here&apos;s your business at a glance.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/billing">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Today&apos;s Sales</CardTitle>
            <IndianRupee className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">₹{stats?.todaySales.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-zinc-500 mt-1">Gross sales for today</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Stock Value</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">₹{stats?.stockValue.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-zinc-500 mt-1">Total inventory valuation</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Unpaid Bills</CardTitle>
            <Receipt className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.unpaidBills || 0}</div>
            <p className="text-xs text-zinc-500 mt-1">Invoices awaiting payment</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.lowStockCount || 0}</div>
            {stats?.lowStockCount && stats.lowStockCount > 0 ? (
              <Badge variant="destructive" className="mt-1">Action required</Badge>
            ) : (
              <p className="text-xs text-emerald-500 mt-1">All levels healthy</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!stats?.recentInvoices || stats.recentInvoices.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center text-zinc-500 italic">
                  No recent invoices found.
                </div>
              ) : (
                stats.recentInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{inv.customerName}</p>
                        <p className="text-xs text-zinc-500">{inv.invoiceNumber} • {new Date(inv.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-400">₹{inv.totalAmount.toFixed(2)}</p>
                      <Badge variant="outline" className="text-[10px] h-4 px-1 border-zinc-800 text-zinc-500">{inv.status}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
            {stats?.recentInvoices && stats.recentInvoices.length > 0 && (
              <Link href="/sales" className="block text-center text-xs text-zinc-500 mt-4 hover:text-white transition-colors">
                View All Sales History →
              </Link>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!stats?.lowStockItems || stats.lowStockItems.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center text-zinc-500 italic text-center">
                  All inventory levels are healthy. Good job!
                </div>
              ) : (
                stats.lowStockItems.map((prod) => (
                  <div key={prod.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800 border-l-2 border-l-red-500">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center">
                        <Package className="w-4 h-4 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{prod.name}</p>
                        <p className="text-xs text-zinc-500">SKU: {prod.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-500">{prod.currentStock} {prod.unit}</p>
                      <Link href="/inventory">
                        <Button variant="link" size="sm" className="h-4 p-0 text-[10px] text-zinc-500 hover:text-white">Restock</Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
