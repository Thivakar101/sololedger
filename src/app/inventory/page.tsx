'use client';

import { useState, useEffect } from 'react';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useShortcuts } from '@/hooks/use-shortcuts';
import { toast } from 'sonner';

export default function InventoryPage() {
    useShortcuts();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const products = useLiveQuery(
        () => db.products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase())
        ).toArray(),
        [searchTerm]
    );

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
                await db.products.update(editingProduct.id, productData);
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
            toast.success('Product deleted');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">Inventory</h2>
                    <p className="text-zinc-500 text-sm">Manage your product stock and pricing.</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                    setIsAddDialogOpen(open);
                    if (!open) setEditingProduct(null);
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Product
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                        <DialogHeader>
                            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSaveProduct} className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Product Name</Label>
                                    <Input id="name" name="name" defaultValue={editingProduct?.name} required className="bg-zinc-900 border-zinc-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sku">SKU / Code</Label>
                                    <Input id="sku" name="sku" defaultValue={editingProduct?.sku} required className="bg-zinc-900 border-zinc-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="purchasePrice">Purchase Price</Label>
                                    <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" defaultValue={editingProduct?.purchasePrice} required className="bg-zinc-900 border-zinc-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sellingPrice">Selling Price</Label>
                                    <Input id="sellingPrice" name="sellingPrice" type="number" step="0.01" defaultValue={editingProduct?.sellingPrice} required className="bg-zinc-900 border-zinc-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currentStock">Current Stock</Label>
                                    <Input id="currentStock" name="currentStock" type="number" defaultValue={editingProduct?.currentStock} required className="bg-zinc-900 border-zinc-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="unit">Unit (e.g., Pcs, Kg)</Label>
                                    <Input id="unit" name="unit" defaultValue={editingProduct?.unit} required className="bg-zinc-900 border-zinc-800" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tags">Tags (comma separated)</Label>
                                <Input id="tags" name="tags" defaultValue={editingProduct?.tags.join(', ')} placeholder="e.g., electronics, hardware" className="bg-zinc-900 border-zinc-800" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save Product</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        placeholder="Search products or SKU..."
                        className="pl-10 bg-zinc-950 border-zinc-800"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
                <Table>
                    <TableHeader className="bg-zinc-900/50">
                        <TableRow className="border-zinc-800">
                            <TableHead className="text-zinc-400">Product</TableHead>
                            <TableHead className="text-zinc-400">SKU</TableHead>
                            <TableHead className="text-zinc-400">Stock</TableHead>
                            <TableHead className="text-zinc-400 text-right">Selling Price</TableHead>
                            <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-zinc-500">
                                    No products found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products?.map((product) => (
                                <TableRow key={product.id} className="border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center">
                                                <Package className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{product.name}</p>
                                                <div className="flex gap-1 mt-1">
                                                    {product.tags.map(tag => (
                                                        <Badge key={tag} variant="secondary" className="text-[10px] bg-zinc-800 text-zinc-400">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-zinc-400 font-mono text-xs">{product.sku}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={product.currentStock < 10 ? "text-red-500 font-bold" : "text-zinc-300"}>
                                                {product.currentStock}
                                            </span>
                                            <span className="text-zinc-500 text-xs italic">{product.unit}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-emerald-500 font-bold">₹{product.sellingPrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-8 h-8 text-zinc-400 hover:text-white"
                                                onClick={() => {
                                                    setEditingProduct(product);
                                                    setIsAddDialogOpen(true);
                                                }}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-8 h-8 text-zinc-400 hover:text-red-500"
                                                onClick={() => product.id && handleDeleteProduct(product.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
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
