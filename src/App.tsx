import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { HomePOSView } from './components/HomePOSView';
import { LoginView } from './components/LoginView';
import { Navbar } from './components/Navbar';
import { StockView } from './components/StockView';
import { TransactionsView } from './components/TransactionsView';
import {
  DEMO_ACCOUNTS,
  formatIndoDateLabel,
  formatRupiah,
  getCurrentWibTime,
  getNextTransactionId,
  getTodayWibIsoDate,
  INITIAL_CART,
  INITIAL_INGREDIENTS,
  INITIAL_PRODUCTS,
  INITIAL_SHIFT,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_TRANSACTIONS,
} from './data/mockData';
import {
  IngredientStock,
  PaymentMethod,
  Product,
  RiderAccount,
  ShiftState,
  StockMovement,
  TabId,
  Transaction,
  TransactionItem,
} from './types';

const STORAGE_KEY = 'kkj_express_rider_workspace_v2';
const REMEMBERED_ID_KEY = 'kkj_express_remembered_identifier';

interface PersistedWorkspace {
  activeRiderId: string | null;
  activeTab: TabId;
  products: Product[];
  cart: Record<string, number>;
  transactions: Transaction[];
  ingredients: IngredientStock[];
  movements: StockMovement[];
  shift: ShiftState;
}

function getDefaultWorkspace(riderId: string | null = null): PersistedWorkspace {
  return {
    activeRiderId: riderId,
    activeTab: 'beranda',
    products: INITIAL_PRODUCTS.map((p) => ({ ...p, recipe: { ...p.recipe } })),
    cart: { ...INITIAL_CART },
    transactions: INITIAL_TRANSACTIONS.map((t) => ({
      ...t,
      items: t.items.map((i) => ({ ...i })),
    })),
    ingredients: INITIAL_INGREDIENTS.map((ing) => ({ ...ing })),
    movements: INITIAL_STOCK_MOVEMENTS.map((m) => ({ ...m })),
    shift: { ...INITIAL_SHIFT },
  };
}

function loadWorkspace(): PersistedWorkspace {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultWorkspace(null);
    const parsed = JSON.parse(raw) as Partial<PersistedWorkspace>;
    if (!parsed || !Array.isArray(parsed.products)) {
      return getDefaultWorkspace(null);
    }
    return {
      activeRiderId: parsed.activeRiderId ?? null,
      activeTab: parsed.activeTab ?? 'beranda',
      products: parsed.products,
      cart: parsed.cart ?? {},
      transactions: parsed.transactions ?? INITIAL_TRANSACTIONS,
      ingredients: parsed.ingredients ?? INITIAL_INGREDIENTS,
      movements: parsed.movements ?? INITIAL_STOCK_MOVEMENTS,
      shift: parsed.shift ?? { ...INITIAL_SHIFT },
    };
  } catch {
    return getDefaultWorkspace(null);
  }
}

export default function App() {
  const [workspace, setWorkspace] = useState<PersistedWorkspace>(() =>
    loadWorkspace(),
  );
  const [rememberedIdentifier, setRememberedIdentifier] = useState<string>(
    () => {
      try {
        return localStorage.getItem(REMEMBERED_ID_KEY) ?? '';
      } catch {
        return '';
      }
    },
  );
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);
  const [toast, setToast] = useState<{
    id: number;
    title: string;
    detail?: string;
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch {
      // Ignore storage quota errors
    }
  }, [workspace]);

  useEffect(() => {
    const updateElapsed = () => {
      if (!workspace.shift.hasStartedToday || !workspace.shift.startTimestampMs) {
        setElapsedMinutes(0);
        return;
      }
      if (!workspace.shift.isActive) return;
      const diffMins = Math.floor(
        (Date.now() - workspace.shift.startTimestampMs) / 60000,
      );
      setElapsedMinutes(Math.max(0, diffMins));
    };
    updateElapsed();
    const timer = window.setInterval(updateElapsed, 30000);
    return () => window.clearInterval(timer);
  }, [workspace.shift]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activeRider: RiderAccount | null = useMemo(() => {
    if (!workspace.activeRiderId) return null;
    return (
      DEMO_ACCOUNTS.find((a) => a.id === workspace.activeRiderId) ??
      DEMO_ACCOUNTS[0]
    );
  }, [workspace.activeRiderId]);

  const nextOrderId = useMemo(() => {
    const cartNum = activeRider?.id === 'rider-01' ? '01' : '03';
    return getNextTransactionId(workspace.transactions, cartNum);
  }, [workspace.transactions, activeRider]);

  const showToast = (title: string, detail?: string) => {
    setToast({ id: Date.now(), title, detail });
  };

  const handleLogin = (account: RiderAccount, rememberMe: boolean) => {
    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_ID_KEY, account.email);
        setRememberedIdentifier(account.email);
      } else {
        localStorage.removeItem(REMEMBERED_ID_KEY);
        setRememberedIdentifier('');
      }
    } catch {
      // Ignore storage errors
    }

    setWorkspace((prev) => ({
      ...prev,
      activeRiderId: account.id,
      activeTab: 'beranda',
      shift: {
        ...prev.shift,
        isActive: false,
      },
    }));
    showToast(
      `Selamat datang, ${account.firstName}!`,
      'Klik Mulai operasional saat Anda siap memulai sesi hari ini.',
    );
  };

  const handleSwitchAccount = (account: RiderAccount) => {
    setWorkspace((prev) => ({
      ...prev,
      activeRiderId: account.id,
      activeTab: 'beranda',
    }));
    showToast(
      `Beralih ke ${account.name}`,
      `Aktif di ${account.cartLabel}.`,
    );
  };

  const handleLogout = () => {
    setWorkspace((prev) => ({
      ...prev,
      activeRiderId: null,
    }));
  };

  const handleResetDemo = () => {
    const currentId = workspace.activeRiderId;
    const reset = getDefaultWorkspace(currentId);
    setWorkspace(reset);
    setElapsedMinutes(0);
    showToast(
      'Data workspace direset',
      'Transaksi, stok, dan status operasional kembali ke 0.',
    );
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setWorkspace((prev) => {
      const product = prev.products.find((p) => p.id === productId);
      if (!product) return prev;

      const currentQty = prev.cart[productId] ?? 0;
      const nextQty = Math.max(0, Math.min(product.stock, currentQty + delta));
      const nextCart = { ...prev.cart };

      if (nextQty === 0) {
        delete nextCart[productId];
      } else {
        nextCart[productId] = nextQty;
      }

      return { ...prev, cart: nextCart };
    });
  };

  const handleResetCart = () => {
    setWorkspace((prev) => ({ ...prev, cart: {} }));
  };

  const handleCompletePayment = (
    method: PaymentMethod,
    cashReceived?: number,
  ) => {
    const timeWib = getCurrentWibTime(false);
    const timeShort = getCurrentWibTime(true);
    const todayIso = getTodayWibIsoDate();
    const todayLabel = formatIndoDateLabel(todayIso);

    setWorkspace((prev) => {
      const orderItems: TransactionItem[] = [];
      let total = 0;
      let totalCups = 0;

      let coffeeUsed = 0;
      let milkUsed = 0;
      let palmSugarUsed = 0;

      const updatedProducts = prev.products.map((product) => {
        const qty = prev.cart[product.id] ?? 0;
        if (qty <= 0) return product;

        const subtotal = qty * product.price;
        total += subtotal;
        totalCups += qty;

        coffeeUsed += qty * product.recipe.coffeeKg;
        milkUsed += qty * product.recipe.milkL;
        palmSugarUsed += qty * product.recipe.palmSugarL;

        orderItems.push({
          productId: product.id,
          name: product.name,
          category: product.category,
          qty,
          unitPrice: product.price,
          subtotal,
        });

        return {
          ...product,
          stock: Math.max(0, product.stock - qty),
        };
      });

      if (orderItems.length === 0) return prev;

      const cartNum = prev.activeRiderId === 'rider-01' ? '01' : '03';
      const txId = getNextTransactionId(prev.transactions, cartNum);
      const change =
        method === 'Tunai' && cashReceived !== undefined
          ? Math.max(0, cashReceived - total)
          : undefined;

      const newTx: Transaction = {
        id: txId,
        time: timeWib,
        dateIso: todayIso,
        dateLabel: todayLabel,
        totalCups,
        method,
        total,
        cashReceived: method === 'Tunai' ? cashReceived : undefined,
        change,
        status: 'Berhasil',
        items: orderItems,
      };

      const usageMap: Record<'coffee' | 'milk' | 'palmSugar', number> = {
        coffee: Math.round(coffeeUsed * 1000) / 1000,
        milk: Math.round(milkUsed * 1000) / 1000,
        palmSugar: Math.round(palmSugarUsed * 1000) / 1000,
      };

      const newMovements: StockMovement[] = [];
      const updatedIngredients = prev.ingredients.map((ing) => {
        const deltaUsed = usageMap[ing.id] ?? 0;
        if (deltaUsed <= 0) return ing;

        const nextRemaining = Math.max(
          0,
          Math.round((ing.remaining - deltaUsed) * 100) / 100,
        );
        const nextUsedToday =
          Math.round((ing.usedToday + deltaUsed) * 100) / 100;

        newMovements.push({
          id: `mov-${Date.now()}-${ing.id}`,
          time: timeShort,
          dateIso: todayIso,
          ingredientId: ing.id,
          ingredientName: ing.name,
          unit: ing.unit,
          type: 'Penjualan',
          delta: -Math.round(deltaUsed * 100) / 100,
          balance: nextRemaining,
        });

        return {
          ...ing,
          remaining: nextRemaining,
          usedToday: nextUsedToday,
        };
      });

      const detailParts = [
        `${totalCups} cup`,
        formatRupiah(total),
        method === 'Tunai' && change !== undefined
          ? `Kembalian ${formatRupiah(change)}`
          : 'QRIS terkonfirmasi',
      ];
      showToast(`Transaksi ${txId} berhasil!`, detailParts.join(' • '));

      return {
        ...prev,
        products: updatedProducts,
        cart: {},
        transactions: [newTx, ...prev.transactions],
        ingredients: updatedIngredients,
        movements: [...newMovements, ...prev.movements],
        shift: {
          ...prev.shift,
          lastSyncedLabel: timeWib,
        },
      };
    });
  };

  const handleStartShift = () => {
    const nowTime = getCurrentWibTime(false);
    const todayIso = getTodayWibIsoDate();

    setWorkspace((prev) => {
      const isFirstStartToday =
        !prev.shift.hasStartedToday || prev.shift.startDateIso !== todayIso;

      const startTimeLabel = isFirstStartToday
        ? nowTime
        : prev.shift.startTimeLabel ?? nowTime;
      const startTimestampMs = isFirstStartToday
        ? Date.now()
        : prev.shift.startTimestampMs ?? Date.now();

      showToast(
        isFirstStartToday
          ? 'Operasional dimulai'
          : 'Operasional dilanjutkan',
        isFirstStartToday
          ? `Jam mulai kerja hari ini tercatat pukul ${startTimeLabel}.`
          : `Melanjutkan sesi sejak ${startTimeLabel}.`,
      );

      return {
        ...prev,
        shift: {
          isActive: true,
          hasStartedToday: true,
          startDateIso: todayIso,
          startTimeLabel,
          startTimestampMs,
          endedAtLabel: null,
          lastSyncedLabel: nowTime,
        },
      };
    });
  };

  const handleEndShift = () => {
    const endedTime = getCurrentWibTime(false);
    setWorkspace((prev) => ({
      ...prev,
      shift: {
        ...prev.shift,
        isActive: false,
        endedAtLabel: endedTime,
        lastSyncedLabel: endedTime,
      },
    }));
    showToast(
      'Operasional shift diakhiri',
      `Rekap penjualan tersimpan hingga pukul ${endedTime}.`,
    );
  };

  if (!activeRider) {
    return (
      <LoginView
        onLogin={handleLogin}
        savedIdentifier={rememberedIdentifier}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F3] text-[#171614]">
      <Navbar
        activeTab={workspace.activeTab}
        onSelectTab={(tab) =>
          setWorkspace((prev) => ({ ...prev, activeTab: tab }))
        }
        rider={activeRider}
        onSwitchAccount={handleSwitchAccount}
        onResetDemo={handleResetDemo}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {workspace.activeTab === 'beranda' && (
          <HomePOSView
            rider={activeRider}
            products={workspace.products}
            cart={workspace.cart}
            nextOrderId={nextOrderId}
            shift={workspace.shift}
            elapsedMinutes={elapsedMinutes}
            transactions={workspace.transactions}
            onUpdateCartQty={handleUpdateCartQty}
            onResetCart={handleResetCart}
            onCompletePayment={handleCompletePayment}
            onStartShift={handleStartShift}
            onEndShift={handleEndShift}
          />
        )}

        {workspace.activeTab === 'riwayat' && (
          <TransactionsView
            rider={activeRider}
            transactions={workspace.transactions}
            lastSyncedLabel={workspace.shift.lastSyncedLabel}
          />
        )}

        {workspace.activeTab === 'stok' && (
          <StockView
            rider={activeRider}
            ingredients={workspace.ingredients}
            movements={workspace.movements}
            lastSyncedLabel={workspace.shift.lastSyncedLabel}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#181714] text-[#FAF8F3] mt-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xl font-medium tracking-tight">KKJ Express</div>
          <div className="sm:text-right">
            <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.18em] text-[#B8A88A] uppercase">
              KOPI TERUS MENGALIR. USAHA TETAP TERKENDALI.
            </div>
            <div className="text-[11px] text-[#FAF8F3]/50 mt-1">
              © 2026 KKJ Express. Seluruh hak dilindungi.
            </div>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border border-[#B8A88A]/35 bg-[#1D1B18] text-[#FAF8F3] px-4 py-3.5 shadow-2xl flex items-start gap-3"
        >
          <CheckCircle2
            className="w-5 h-5 text-[#6FCF97] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-semibold">
              {toast.title}
            </div>
            {toast.detail && (
              <div className="text-[11px] sm:text-xs text-[#FAF8F3]/75 mt-0.5 tabular-nums">
                {toast.detail}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Tutup notifikasi"
            className="text-[#FAF8F3]/50 hover:text-[#FAF8F3] p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
