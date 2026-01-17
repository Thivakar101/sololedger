'use client';

import { useState, useMemo } from 'react';
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
import { Plus, Search, Edit2, Trash2, Package, X, Filter, Grid3x3, List, ChevronDown, Download, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useShortcuts } from '@/hooks/use-shortcuts';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ViewMode = 'list' | 'grid';
type StockFilter = 'all' | 'low' | 'out' | 'good';

export default function InventoryPage() {
    useShortcuts();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [stockFilter, setStockFilter] = useState<StockFilter>('all');
    const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
    const [showFilters, setShowFilters] = useState(false);

    const allProducts = useLiveQuery(() => db.products.toArray());

    const filteredProducts = useMemo(() => {
        if (!allProducts) return [];
        
        return allProducts.filter(p => {
            // Search filter
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                p.sku.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Stock filter
            const matchesStock = 
                stockFilter === 'all' ? true :
                stockFilter === 'out' ? p.currentStock === 0 :
                stockFilter === 'low' ? p.currentStock > 0 && p.currentStock < 10 :
                stockFilter === 'good' ? p.currentStock >= 10 : true;
            
            return matchesSearch && matchesStock;
        });
    }, [allProducts, searchTerm, stockFilter]);

    const stats = useMemo(() => {
        if (!allProducts) return { total: 0, low: 0, out: 0, value: 0 };
        
        return {
            total: allProducts.length,
            low: allProducts.filter(p => p.currentStock > 0 && p.currentStock < 10).length,
            out: allProducts.filter(p => p.currentStock === 0).length,
            value: allProducts.reduce((sum, p) => sum + (p.sellingPrice * p.currentStock), 0)
        };
    }, [allProducts]);

    const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const productData: Product = {
            name: formData.get('name') as string,
            sku: formData.get('sku') as string,
            purchasePrice: parseFloat(formData.get('purchasePrice') as string),
            sellingPrice: parseFloat(formData.get('sellingPrice') as string),
            currentStock: parseInt(formData.get('currentStock') as string),
            unit: formData.get('unit') as string,
            tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(t => t),
        };

        try {
            if (editingProduct?.id) {
                await db.products.put({ ...productData, id: editingProduct.id });
                toast.success('Product updated successfully');
            } else {
                await db.products.add(productData);
                toast.success('Product added successfully');
            }
            setIsAddDialogOpen(false);
            setEditingProduct(null);
        } catch (error) {
            toast.error('Failed to save product');
            console.error(error);
        }
    };

    const handleDeleteProduct = async (id: number) => {
        if (confirm('Are you sure you want to delete this product?')) {
            await db.products.delete(id);
            setSelectedProducts(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
            toast.success('Product deleted');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedProducts.size === 0) return;
        if (!confirm(`Delete ${selectedProducts.size} selected products?`)) return;

        try {
            await db.products.bulkDelete(Array.from(selectedProducts));
            setSelectedProducts(new Set());
            toast.success(`Deleted ${selectedProducts.size} products`);
        } catch (error) {
            toast.error('Failed to delete products');
        }
    };

    const toggleProductSelection = (id: number) => {
        setSelectedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedProducts.size === filteredProducts.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(filteredProducts.map(p => p.id!)));
        }
    };

    const getStockStatus = (stock: number) => {
        if (stock === 0) return { label: 'Out of Stock', color: 'text-destructive', bgColor: 'bg-destructive/10', icon: AlertTriangle };
        if (stock < 10) return { label: 'Low Stock', color: 'text-orange-600', bgColor: 'bg-orange-500/10', icon: AlertCircle };
        return { label: 'In Stock', color: 'text-emerald-600', bgColor: 'bg-emerald-500/10', icon: CheckCircle2 };
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 relative"
        >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Products</p>
                                    <p className="text-2xl font-black mt-1">{stats.total}</p>
                                </div>
                                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Package className="size-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStockFilter('low')}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Low Stock</p>
                                    <p className="text-2xl font-black mt-1 text-orange-600">{stats.low}</p>
                                </div>
                                <div className="size-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                    <AlertCircle className="size-6 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setStockFilter('out')}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Out of Stock</p>
                                    <p className="text-2xl font-black mt-1 text-destructive">{stats.out}</p>
                                </div>
                                <div className="size-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                                    <AlertTriangle className="size-6 text-destructive" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Value</p>
                                    <p className="text-2xl font-black mt-1 text-emerald-600">₹{stats.value.toFixed(0)}</p>
                                </div>
                                <div className="size-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <Download className="size-6 text-emerald-600 rotate-180" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Inventory Management</h2>
                    <p className="text-muted-foreground text-sm">Manage your product stock and pricing</p>
                </div>
                
                <AnimatePresence>
                    {!isAddDialogOpen && (
                        <motion.button
                            layoutId="add-product-hero"
                            onClick={() => {
                                setEditingProduct(null);
                                setIsAddDialogOpen(true);
                            }}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 py-2 shadow-lg shadow-primary/20"
                        >
                            <Plus className="size-4" />
                            <span className="font-bold">Add Product</span>
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search products by name or SKU..."
                        className="pl-10 bg-background/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2">
                    {/* Stock Filter */}
                    <div className="flex gap-1 bg-background/50 p-1 rounded-lg border border-border/50">
                        <Button
                            variant={stockFilter === 'all' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setStockFilter('all')}
                            className="text-xs"
                        >
                            All
                        </Button>
                        <Button
                            variant={stockFilter === 'good' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setStockFilter('good')}
                            className="text-xs"
                        >
                            In Stock
                        </Button>
                        <Button
                            variant={stockFilter === 'low' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setStockFilter('low')}
                            className="text-xs"
                        >
                            Low
                        </Button>
                        <Button
                            variant={stockFilter === 'out' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setStockFilter('out')}
                            className="text-xs"
                        >
                            Out
                        </Button>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex gap-1 bg-background/50 p-1 rounded-lg border border-border/50">
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="icon"
                            className="size-8"
                            onClick={() => setViewMode('list')}
                        >
                            <List className="size-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="icon"
                            className="size-8"
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid3x3 className="size-4" />
                        </Button>
                    </div>

                    {/* Bulk Actions */}
                    {selectedProducts.size > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                        >
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 className="size-4 mr-2" />
                                Delete ({selectedProducts.size})
                            </Button>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Product List/Grid */}
            {viewMode === 'list' ? (
                <Card className="overflow-hidden border-border/50 shadow-sm bg-card/50 backdrop-blur-xl">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="border-border/50 hover:bg-transparent">
                                <TableHead className="w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                                        onChange={toggleSelectAll}
                                        className="rounded border-border"
                                    />
                                </TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-right">Purchase Price</TableHead>
                                <TableHead className="text-right">Selling Price</TableHead>
                                <TableHead className="text-center">Stock</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="popLayout">
                                {filteredProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-64 text-center text-muted-foreground">
                                            {allProducts?.length === 0 ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Package className="size-12 opacity-20" />
                                                    <p>No products yet. Add your first product to get started.</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Search className="size-12 opacity-20" />
                                                    <p>No products match your filters.</p>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProducts.map((product, i) => {
                                        const status = getStockStatus(product.currentStock);
                                        const StatusIcon = status.icon;
                                        
                                        return (
                                            <motion.tr
                                                key={product.id}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="border-b border-border/50 hover:bg-muted/30 transition-colors group"
                                            >
                                                <TableCell>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProducts.has(product.id!)}
                                                        onChange={() => toggleProductSelection(product.id!)}
                                                        className="rounded border-border"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                                            <Package className="size-5 text-primary" />
                                                        </div>
                                                        <span className="font-medium">{product.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {product.sku}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-muted-foreground">
                                                    ₹{product.purchasePrice.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold">
                                                    ₹{product.sellingPrice.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={cn("font-bold tabular-nums", status.color, status.bgColor, "border-0")}>
                                                        {product.currentStock} {product.unit}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        <StatusIcon className={cn("size-4", status.color)} />
                                                        <span className={cn("text-xs font-medium", status.color)}>{status.label}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 text-muted-foreground hover:text-foreground"
                                                            onClick={() => {
                                                                setEditingProduct(product);
                                                                setIsAddDialogOpen(true);
                                                            }}
                                                        >
                                                            <Edit2 className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 text-muted-foreground hover:text-destructive"
                                                            onClick={() => handleDeleteProduct(product.id!)}
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredProducts.map((product, i) => {
                            const status = getStockStatus(product.currentStock);
                            const StatusIcon = status.icon;
                            
                            return (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ delay: i * 0.03 }}
                                >
                                    <Card className={cn(
                                        "border-border/50 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden",
                                        selectedProducts.has(product.id!) && "ring-2 ring-primary"
                                    )}
                                        onClick={() => toggleProductSelection(product.id!)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <Badge variant="outline" className="text-xs font-mono">
                                                    {product.sku}
                                                </Badge>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProducts.has(product.id!)}
                                                    onChange={() => toggleProductSelection(product.id!)}
                                                    className="rounded border-border"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>

                                            <div className="mb-3">
                                                <h3 className="font-bold text-sm mb-1 line-clamp-2">{product.name}</h3>
                                                <div className="flex items-center gap-1 text-xs">
                                                    <StatusIcon className={cn("size-3", status.color)} />
                                                    <span className={status.color}>{status.label}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-4 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Stock:</span>
                                                    <Badge className={cn("font-bold text-xs", status.color, status.bgColor, "border-0")}>
                                                        {product.currentStock} {product.unit}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Selling:</span>
                                                    <span className="font-bold">₹{product.sellingPrice}</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="size-7"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingProduct(product);
                                                        setIsAddDialogOpen(true);
                                                    }}
                                                >
                                                    <Edit2 className="size-3" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="size-7 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteProduct(product.id!);
                                                    }}
                                                >
                                                    <Trash2 className="size-3" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Add/Edit Product Dialog */}
            <AnimatePresence>
                {isAddDialogOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => {
                            setIsAddDialogOpen(false);
                            setEditingProduct(null);
                        }}
                    >
                        <motion.div
                            layoutId="add-product-hero"
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between z-10">
                                <h2 className="text-2xl font-bold">
                                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setIsAddDialogOpen(false);
                                        setEditingProduct(null);
                                    }}
                                >
                                    <X className="size-4" />
                                </Button>
                            </div>

                            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <Label htmlFor="name">Product Name *</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            defaultValue={editingProduct?.name}
                                            required
                                            className="mt-1.5"
                                            placeholder="Enter product name..."
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="sku">SKU *</Label>
                                        <Input
                                            id="sku"
                                            name="sku"
                                            defaultValue={editingProduct?.sku}
                                            required
                                            className="mt-1.5"
                                            placeholder="e.g., PROD-001"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="unit">Unit *</Label>
                                        <Input
                                            id="unit"
                                            name="unit"
                                            defaultValue={editingProduct?.unit || 'pcs'}
                                            required
                                            className="mt-1.5"
                                            placeholder="e.g., pcs, kg, ltr"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="purchasePrice">Purchase Price *</Label>
                                        <Input
                                            id="purchasePrice"
                                            name="purchasePrice"
                                            type="number"
                                            step="0.01"
                                            defaultValue={editingProduct?.purchasePrice}
                                            required
                                            className="mt-1.5"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="sellingPrice">Selling Price *</Label>
                                        <Input
                                            id="sellingPrice"
                                            name="sellingPrice"
                                            type="number"
                                            step="0.01"
                                            defaultValue={editingProduct?.sellingPrice}
                                            required
                                            className="mt-1.5"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="currentStock">Current Stock *</Label>
                                        <Input
                                            id="currentStock"
                                            name="currentStock"
                                            type="number"
                                            defaultValue={editingProduct?.currentStock}
                                            required
                                            className="mt-1.5"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                                        <Input
                                            id="tags"
                                            name="tags"
                                            defaultValue={editingProduct?.tags?.join(', ')}
                                            className="mt-1.5"
                                            placeholder="electronics, accessories"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button type="submit" className="flex-1 h-11 font-bold">
                                        <Plus className="mr-2 size-4" />
                                        {editingProduct ? 'Update Product' : 'Add Product'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setIsAddDialogOpen(false);
                                            setEditingProduct(null);
                                        }}
                                        className="flex-1 h-11"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
