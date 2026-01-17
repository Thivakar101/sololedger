'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Receipt,
  AlertTriangle,
  IndianRupee,
  Plus,
  FileText
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useMemo } from "react";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

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
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back. Here&apos;s your business at a glance.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/billing">
            <Button size="lg" className="shadow-primary/20 shadow-xl">
              <Plus className="w-5 h-5 mr-2" />
              New Invoice
            </Button>
          </Link>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Today's Sales", icon: IndianRupee, value: `₹${stats?.todaySales.toFixed(2) || '0.00'}`, desc: "Gross sales for today", color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { title: "Stock Value", icon: Package, value: `₹${stats?.stockValue.toFixed(2) || '0.00'}`, desc: "Total inventory valuation", color: "text-blue-500", bg: "bg-blue-500/10" },
          { title: "Unpaid Bills", icon: Receipt, value: stats?.unpaidBills || 0, desc: "Invoices awaiting payment", color: "text-orange-500", bg: "bg-orange-500/10" },
          { title: "Low Stock Items", icon: AlertTriangle, value: stats?.lowStockCount || 0, desc: "Action required", color: "text-red-500", bg: "bg-red-500/10" }
        ].map((stat, i) => (
          <motion.div variants={itemVariants} key={i}>
            <Card className="hover:scale-[1.02] transition-transform duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`p-2 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <motion.div variants={itemVariants} className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!stats?.recentInvoices || stats.recentInvoices.length === 0 ? (
                  <div className="flex h-[200px] items-center justify-center text-muted-foreground italic">
                    No recent invoices found.
                  </div>
                ) : (
                  stats.recentInvoices.map((inv, i) => (
                    <motion.div 
                      key={inv.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + (i * 0.1) }}
                      className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 hover:bg-muted/60 transition-colors border border-border/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <FileText className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{inv.customerName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{inv.invoiceNumber} • {new Date(inv.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">₹{inv.totalAmount.toFixed(2)}</p>
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-border text-muted-foreground">{inv.status}</Badge>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              {stats?.recentInvoices && stats.recentInvoices.length > 0 && (
                <Link href="/sales" className="block text-center text-xs text-muted-foreground mt-6 hover:text-primary transition-colors">
                  View All Sales History →
                </Link>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!stats?.lowStockItems || stats.lowStockItems.length === 0 ? (
                  <div className="flex h-[200px] items-center justify-center text-muted-foreground italic text-center">
                    All inventory levels are healthy.
                    <br />
                    Good job!
                  </div>
                ) : (
                  stats.lowStockItems.map((prod, i) => (
                    <motion.div 
                      key={prod.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + (i * 0.1) }}
                      className="flex items-center justify-between p-4 rounded-2xl bg-destructive/5 hover:bg-destructive/10 transition-colors border border-destructive/20"
                    >
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                          <Package className="size-5 text-destructive" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{prod.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">SKU: {prod.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-destructive">{prod.currentStock} {prod.unit}</p>
                        <Link href="/inventory">
                          <Button variant="link" size="sm" className="h-6 p-0 text-xs text-muted-foreground hover:text-primary">Restock</Button>
                        </Link>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
