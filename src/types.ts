export type TabId = 'beranda' | 'riwayat' | 'stok';

export type PaymentMethod = 'Tunai' | 'QRIS';

export type ProductCategory = 'KOPI' | 'NON-KOPI';

export interface RiderAccount {
  id: string;
  name: string;
  firstName: string;
  role: string;
  cartLabel: string;
  cartCode: string;
  email: string;
  username: string;
  password: string;
  accountTypeLabel: string;
}

export interface ProductRecipe {
  coffeeKg: number;
  milkL: number;
  palmSugarL: number;
}

export interface Product {
  id: string;
  category: ProductCategory;
  name: string;
  stock: number;
  price: number;
  recipe: ProductRecipe;
}

export interface TransactionItem {
  productId: string;
  name: string;
  category: ProductCategory;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  time: string;
  dateIso: string;
  dateLabel: string;
  totalCups: number;
  method: PaymentMethod;
  total: number;
  cashReceived?: number;
  change?: number;
  status: 'Berhasil';
  items: TransactionItem[];
}

export type IngredientId = 'coffee' | 'milk' | 'palmSugar';

export interface IngredientStock {
  id: IngredientId;
  name: string;
  unit: 'kg' | 'liter';
  remaining: number;
  usedToday: number;
  lowThreshold: number;
  weeklyUsage: number;
  tomorrowTarget: number;
}

export type StockMovementType = 'Penjualan' | 'Alokasi awal';

export interface StockMovement {
  id: string;
  time: string;
  dateIso: string;
  ingredientId: IngredientId;
  ingredientName: string;
  unit: 'kg' | 'liter';
  type: StockMovementType;
  delta: number;
  balance: number;
}

export interface ShiftState {
  isActive: boolean;
  hasStartedToday: boolean;
  startDateIso: string | null;
  startTimeLabel: string | null;
  startTimestampMs: number | null;
  lastSyncedLabel: string | null;
  endedAtLabel?: string | null;
}
