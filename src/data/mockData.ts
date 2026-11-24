import {
  IngredientStock,
  Product,
  RiderAccount,
  ShiftState,
  StockMovement,
  Transaction,
} from '../types';

export const DEMO_ACCOUNTS: RiderAccount[] = [
  {
    id: 'rider-03',
    name: 'Budi Santoso',
    firstName: 'Budi',
    role: 'Rider • Gerobak 03',
    cartLabel: 'Gerobak 03',
    cartCode: 'GEROBAK 03',
    email: 'budi.rider03@kkjexpress.id',
    username: 'budi.gerobak03',
    password: 'KopiKKJ#03',
    accountTypeLabel: 'Akun Rider Utama (Gerobak 03)',
  },
  {
    id: 'rider-01',
    name: 'Rina Kusuma',
    firstName: 'Rina',
    role: 'Rider • Gerobak 01',
    cartLabel: 'Gerobak 01',
    cartCode: 'GEROBAK 01',
    email: 'rina.rider01@kkjexpress.id',
    username: 'rina.gerobak01',
    password: 'KopiKKJ#01',
    accountTypeLabel: 'Akun Rider Cadangan (Gerobak 01)',
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'kopi-susu-gula-aren',
    category: 'KOPI',
    name: 'Kopi Susu Gula Aren',
    stock: 0,
    price: 18000,
    recipe: { coffeeKg: 0.025, milkL: 0.18, palmSugarL: 0.06 },
  },
  {
    id: 'caffe-latte',
    category: 'KOPI',
    name: 'Caffè Latte',
    stock: 0,
    price: 20000,
    recipe: { coffeeKg: 0.025, milkL: 0.2, palmSugarL: 0 },
  },
  {
    id: 'americano',
    category: 'KOPI',
    name: 'Americano',
    stock: 0,
    price: 15000,
    recipe: { coffeeKg: 0.025, milkL: 0, palmSugarL: 0 },
  },
  {
    id: 'cappuccino',
    category: 'KOPI',
    name: 'Cappuccino',
    stock: 0,
    price: 20000,
    recipe: { coffeeKg: 0.025, milkL: 0.18, palmSugarL: 0 },
  },
  {
    id: 'chocolate',
    category: 'NON-KOPI',
    name: 'Chocolate',
    stock: 0,
    price: 18000,
    recipe: { coffeeKg: 0, milkL: 0.2, palmSugarL: 0.02 },
  },
  {
    id: 'matcha-latte',
    category: 'NON-KOPI',
    name: 'Matcha Latte',
    stock: 0,
    price: 22000,
    recipe: { coffeeKg: 0, milkL: 0.2, palmSugarL: 0 },
  },
];

export const INITIAL_CART: Record<string, number> = {};

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_INGREDIENTS: IngredientStock[] = [
  {
    id: 'coffee',
    name: 'Biji kopi',
    unit: 'kg',
    remaining: 0,
    usedToday: 0,
    lowThreshold: 0.8,
    weeklyUsage: 0,
    tomorrowTarget: 0,
  },
  {
    id: 'milk',
    name: 'Susu segar',
    unit: 'liter',
    remaining: 0,
    usedToday: 0,
    lowThreshold: 1.5,
    weeklyUsage: 0,
    tomorrowTarget: 0,
  },
  {
    id: 'palmSugar',
    name: 'Gula aren',
    unit: 'liter',
    remaining: 0,
    usedToday: 0,
    lowThreshold: 0.7,
    weeklyUsage: 0,
    tomorrowTarget: 0,
  },
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];

export const INITIAL_SHIFT: ShiftState = {
  isActive: false,
  hasStartedToday: false,
  startDateIso: null,
  startTimeLabel: null,
  startTimestampMs: null,
  lastSyncedLabel: null,
  endedAtLabel: null,
};

export function formatRupiah(amount: number): string {
  const safe = Math.max(0, Math.round(amount));
  return `Rp${safe.toLocaleString('id-ID')}`;
}

export function formatInputDots(amount: number): string {
  if (!amount) return '';
  return Math.round(amount).toLocaleString('id-ID');
}

export function formatDecimalId(value: number, maxDecimals = 2): string {
  const rounded = Math.round(value * 100) / 100;
  return rounded.toLocaleString('id-ID', {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 1,
    maximumFractionDigits: maxDecimals,
  });
}

export function getNextTransactionId(
  transactions: Transaction[],
  cartPrefixNumber = '03',
): string {
  const prefix = cartPrefixNumber === '01' ? '01' : '03';
  let maxSeq = 0;
  for (const tx of transactions) {
    const match = tx.id.match(/^#KKJ-\d{2}(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) maxSeq = num;
    }
  }
  const next = maxSeq + 1;
  const padded = String(next).padStart(2, '0');
  return `#KKJ-${prefix}${padded}`;
}

export function getTodayWibIsoDate(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const month = parts.find((p) => p.type === 'month')?.value ?? '11';
  const day = parts.find((p) => p.type === 'day')?.value ?? '24';
  return `${year}-${month}-${day}`;
}

export function formatIndoDateLabel(
  isoDate: string,
  includeWeekday = false,
): string {
  if (!isoDate) return '-';
  const [y, m, d] = isoDate.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return isoDate;
  const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'UTC',
    weekday: includeWeekday ? 'long' : undefined,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dateObj);
}

export function getCurrentWibTime(short = false): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return short ? `${hour}.${minute}` : `${hour}.${minute} WIB`;
}

export function formatDurationLabel(totalMinutes: number): string {
  const safe = Math.max(0, totalMinutes);
  const hrs = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hrs <= 0) return `${mins} menit`;
  return `${hrs} jam ${mins} menit`;
}
