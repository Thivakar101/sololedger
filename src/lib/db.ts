import Dexie, { type Table } from 'dexie';

export interface Profile {
  id?: number;
  businessName: string;
  logoUrl?: string;
  taxId: string;
  address: string;
  contact: string;
  currency: string;
  brandColor: string;
  footerTerms: string;
  signatureUrl?: string;
}

export interface Product {
  id?: number;
  name: string;
  sku: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  unit: string;
  tags: string[];
}

export interface Invoice {
  id?: number;
  invoiceNumber: string;
  date: Date;
  customerName: string;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  status: 'Paid' | 'Unpaid';
}

export interface InvoiceItem {
  id?: number;
  invoiceId: number;
  productId: number;
  productName: string;
  quantity: number;
  priceAtSale: number;
}

export class SoloLedgerDB extends Dexie {
  profiles!: Table<Profile>;
  products!: Table<Product>;
  invoices!: Table<Invoice>;
  invoiceItems!: Table<InvoiceItem>;

  constructor() {
    super('SoloLedgerDB');
    this.version(1).stores({
      profiles: '++id, businessName',
      products: '++id, name, sku, *tags',
      invoices: '++id, invoiceNumber, date, customerName, status',
      invoiceItems: '++id, invoiceId, productId',
    });
  }
}

export const db = new SoloLedgerDB();
