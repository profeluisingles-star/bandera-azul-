import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  KeyRound,
  MessageCircle,
  Package,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  Settings,
  ShoppingCart,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import type {
  AuthStatus,
  Client,
  OperatingExpense,
  PlatformData,
  PlatformSettings,
  Product,
  ProductStatus,
  ProductType,
  Sale,
} from '../types.ts';
import {
  buildWhatsAppReceiptUrl,
  downloadTextFile,
  escapeCsvCell,
  formatCRC,
  formatDateCR,
  totalProductStock,
} from '../utils/format.ts';
import { ReceiptModal } from '../components/ReceiptModal.tsx';

type AdminTab = 'resumen' | 'ventas' | 'productos' | 'inventario' | 'clientes' | 'ajustes';

interface TeacherWorkspaceViewProps {
  data: PlatformData;
  authToken: string;
  authStatus: AuthStatus;
  initialFocusProductId?: string | null;
  onDataChange: (next: PlatformData) => void;
  onClearFocusProduct: () => void;
}

export function TeacherWorkspaceView({
  data,
  authToken,
  authStatus,
  initialFocusProductId,
  onDataChange,
  onClearFocusProduct,
}: TeacherWorkspaceViewProps) {
  const [tab, setTab] = useState<AdminTab>(initialFocusProductId ? 'productos' : 'resumen');
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<Sale | null>(null);

  // Sales POS state
  const [saleClientId, setSaleClientId] = useState(data.clients[0]?.id || 'GENERAL');
  const [saleClientPhone, setSaleClientPhone] = useState(data.clients[0]?.phone || '');
  const [saleProductId, setSaleProductId] = useState(data.products[0]?.id || '');
  const [salePresentation, setSalePresentation] = useState('');
  const [saleQty, setSaleQty] = useState(1);
  const [saleUnitPrice, setSaleUnitPrice] = useState(0);
  const [saleMethod, setSaleMethod] = useState<Sale['paymentMethod']>('Efectivo');
  const [saleNotes, setSaleNotes] = useState('');

  // Reset & Delete confirmation modals
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetOpts, setResetOpts] = useState({
    resetSales: true,
    resetExpenses: true,
    resetMovements: true,
    resetBatches: true,
    resetClients: false,
    resetStock: false,
    resetSowings: false,
    resetLogs: false,
  });

  // Inventory movement state
  const [invProductId, setInvProductId] = useState(data.products[0]?.id || '');
  const [invPresentation, setInvPresentation] = useState('');
  const [invType, setInvType] = useState<'entrada' | 'ajuste'>('entrada');
  const [invQty, setInvQty] = useState(10);
  const [invBatchCode, setInvBatchCode] = useState('');
  const [invNote, setInvNote] = useState('');

  // Batch creation state
  const [batchProdId, setBatchProdId] = useState(data.products[0]?.id || '');
  const [batchPres, setBatchPres] = useState('');
  const [batchQty, setBatchQty] = useState(10);
  const [batchCode, setBatchCode] = useState('');
  const [batchResponsible, setBatchResponsible] = useState(data.settings.teacherName);

  // Client & Expense state
  const [cliName, setCliName] = useState('');
  const [cliType, setCliType] = useState<Client['type']>('Familia / Comunidad');
  const [cliPhone, setCliPhone] = useState('');
  const [cliNotes, setCliNotes] = useState('');

  const [expDesc, setExpDesc] = useState('');
  const [expCat, setExpCat] = useState<OperatingExpense['category']>('Sacos y empaques');
  const [expAmount, setExpAmount] = useState(0);
  const [expSupplier, setExpSupplier] = useState('');

  // Product editor state
  const [editProductId, setEditProductId] = useState<string>(
    initialFocusProductId || data.products[0]?.id || ''
  );
  const [creatingNewProduct, setCreatingNewProduct] = useState(false);
  const [prodDraft, setProdDraft] = useState<Product | null>(null);
  const [newPresName, setNewPresName] = useState('Saco de 25 kg');
  const [newPresPrice, setNewPresPrice] = useState(11500);
  const [newPresStock, setNewPresStock] = useState(5);

  // Settings & Password state
  const [settingsDraft, setSettingsDraft] = useState<PlatformSettings>(data.settings);
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');

  useEffect(() => {
    if (initialFocusProductId) {
      setTab('productos');
      setEditProductId(initialFocusProductId);
      setCreatingNewProduct(false);
      onClearFocusProduct();
    }
  }, [initialFocusProductId, onClearFocusProduct]);

  useEffect(() => {
    setSettingsDraft(data.settings);
  }, [data.settings]);

  // Keep POS presentation & price synced when selecting product
  const selectedSaleProduct = data.products.find((p) => p.id === saleProductId) || data.products[0];
  useEffect(() => {
    if (!selectedSaleProduct) return;
    const keys = Object.keys(selectedSaleProduct.prices);
    if (!keys.includes(salePresentation)) {
      const first = keys[0] || '';
      setSalePresentation(first);
      setSaleUnitPrice(selectedSaleProduct.prices[first] || 0);
    }
  }, [selectedSaleProduct, salePresentation]);

  const selectedInvProduct = data.products.find((p) => p.id === invProductId) || data.products[0];
  useEffect(() => {
    if (!selectedInvProduct) return;
    const keys = Object.keys(selectedInvProduct.prices);
    if (!keys.includes(invPresentation)) {
      setInvPresentation(keys[0] || '');
    }
  }, [selectedInvProduct, invPresentation]);

  const selectedBatchProduct = data.products.find((p) => p.id === batchProdId) || data.products[0];
  useEffect(() => {
    if (!selectedBatchProduct) return;
    const keys = Object.keys(selectedBatchProduct.prices);
    if (!keys.includes(batchPres)) {
      setBatchPres(keys[0] || '');
    }
  }, [selectedBatchProduct, batchPres]);

  useEffect(() => {
    if (creatingNewProduct) return;
    const found = data.products.find((p) => p.id === editProductId) || data.products[0];
    if (found) {
      setProdDraft(structuredClone(found));
    } else {
      setProdDraft(null);
    }
  }, [editProductId, data.products, creatingNewProduct]);

  const metrics = useMemo(() => {
    const totalSales = data.sales.reduce((s, v) => s + v.total, 0);
    const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0);
    const netMargin = totalSales - totalExpenses;
    const reinvestAmount = Math.round((totalSales * (data.settings.reinvestPercent || 0)) / 100);
    const stockValue = data.products.reduce((acc, p) => {
      return (
        acc +
        Object.entries(p.prices).reduce((sub, [pack, price]) => {
          const qty = p.stockByPresentation?.[pack] || 0;
          return sub + qty * price;
        }, 0)
      );
    }, 0);
    const totalUnits = data.products.reduce((s, p) => s + totalProductStock(p), 0);

    const byProduct = new Map<string, number>();
    for (const sale of data.sales) {
      byProduct.set(sale.productName, (byProduct.get(sale.productName) || 0) + sale.total);
    }
    const topProducts = Array.from(byProduct.entries()).sort((a, b) => b[1] - a[1]);

    return { totalSales, totalExpenses, netMargin, reinvestAmount, stockValue, totalUnits, topProducts };
  }, [data]);

  async function apiCall<T>(url: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        ...(options.headers || {}),
      },
    });
    const body = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) {
      throw new Error(body.error || 'Error al guardar en el servidor.');
    }
    return body;
  }

  async function refreshFullData() {
    const fresh = await apiCall<PlatformData>('/api/admin/data');
    onDataChange(fresh);
  }

  function showOk(text: string) {
    setNotice({ kind: 'ok', text });
  }
  function showErr(err: unknown) {
    setNotice({ kind: 'err', text: err instanceof Error ? err.message : 'Ocurrió un error.' });
  }

  async function handleRecordSale(e: FormEvent) {
    e.preventDefault();
    if (!selectedSaleProduct || !salePresentation) return;
    try {
      const res = await apiCall<{ sale: Sale }>('/api/admin/sales', {
        method: 'POST',
        body: JSON.stringify({
          clientId: saleClientId,
          clientPhone: saleClientPhone,
          productId: selectedSaleProduct.id,
          presentation: salePresentation,
          quantity: saleQty,
          unitPrice: saleUnitPrice,
          paymentMethod: saleMethod,
          notes: saleNotes,
        }),
      });
      await refreshFullData();
      setSaleNotes('');
      setActiveReceipt(res.sale);
      showOk(`Venta ${res.sale.receiptNumber} registrada e inventario actualizado.`);
    } catch (err) {
      showErr(err);
    }
  }

  async function handleDeleteProduct(product: Product) {
    setDeletingProduct(true);
    try {
      await apiCall(`/api/admin/products/${product.id}`, { method: 'DELETE' });
      const remaining = data.products.filter((p) => p.id !== product.id);
      await refreshFullData();
      setConfirmDeleteProduct(null);
      setCreatingNewProduct(false);
      setEditProductId(remaining[0]?.id || '');
      showOk(`Producto "${product.name}" eliminado del catálogo.`);
    } catch (err) {
      showErr(err);
    } finally {
      setDeletingProduct(false);
    }
  }

  async function handleResetPlatform() {
    setResetting(true);
    try {
      const next = await apiCall<PlatformData>('/api/admin/reset', {
        method: 'POST',
        body: JSON.stringify(resetOpts),
      });
      onDataChange(next);
      setResetModalOpen(false);
      setSaleClientId('GENERAL');
      setSaleClientPhone('');
      showOk('Registros reiniciados en cero. El catálogo de productos, precios y logos se conservó.');
    } catch (err) {
      showErr(err);
    } finally {
      setResetting(false);
    }
  }

  async function handleInventoryMove(e: FormEvent) {
    e.preventDefault();
    if (!selectedInvProduct || !invPresentation) return;
    try {
      await apiCall('/api/admin/inventory/move', {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedInvProduct.id,
          presentation: invPresentation,
          type: invType,
          quantity: invQty,
          batchCode: invBatchCode,
          note: invNote,
        }),
      });
      await refreshFullData();
      setInvNote('');
      showOk('Movimiento de inventario registrado.');
    } catch (err) {
      showErr(err);
    }
  }

  async function handleAddBatch(e: FormEvent) {
    e.preventDefault();
    if (!selectedBatchProduct || !batchPres) return;
    try {
      await apiCall('/api/admin/batches', {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedBatchProduct.id,
          presentation: batchPres,
          quantity: batchQty,
          batchCode,
          responsible: batchResponsible,
          qualityPassed: true,
          safetyChecked: true,
        }),
      });
      await refreshFullData();
      setBatchCode('');
      showOk('Lote de producción registrado.');
    } catch (err) {
      showErr(err);
    }
  }

  async function handleToggleBatchFlag(batchId: string, field: 'qualityPassed' | 'safetyChecked', val: boolean) {
    try {
      await apiCall(`/api/admin/batches/${batchId}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: val }),
      });
      await refreshFullData();
    } catch (err) {
      showErr(err);
    }
  }

  function startNewProduct() {
    setCreatingNewProduct(true);
    setProdDraft({
      id: 'NEW',
      code: `ECO-${String(data.products.length + 1).padStart(2, '0')}`,
      name: '',
      category: 'Insumo agroecológico',
      type: 'solido',
      status: 'activo',
      pack: 'Saco de 25 kg',
      purpose: '',
      how: '',
      dose: '',
      caution: '',
      packagingNote: 'Empaque en saco limpio o botella plástica reutilizada con triple lavado y etiqueta ECOTRON.',
      recipe: 'compost',
      process: [],
      reg: '',
      tech: '',
      tests: '',
      labelok: true,
      packok: true,
      image: '/products/eco-com.webp',
      slogan: 'Producción estudiantil CTP Tronadora.',
      prices: { 'Saco de 25 kg': 11500 },
      stockByPresentation: { 'Saco de 25 kg': 0 },
      marketingCategory: 'Catálogo ECOTRON',
      infosteps: [],
    });
  }

  async function handleSaveProduct(e: FormEvent) {
    e.preventDefault();
    if (!prodDraft) return;
    try {
      if (creatingNewProduct) {
        const created = await apiCall<Product>('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(prodDraft),
        });
        await refreshFullData();
        setCreatingNewProduct(false);
        setEditProductId(created.id);
        showOk(`Producto "${created.name}" creado.`);
      } else {
        await apiCall<Product>(`/api/admin/products/${prodDraft.id}`, {
          method: 'PUT',
          body: JSON.stringify(prodDraft),
        });
        await refreshFullData();
        showOk(`Cambios guardados en "${prodDraft.name}".`);
      }
    } catch (err) {
      showErr(err);
    }
  }

  function handleImageUpload(e: ChangeEvent<HTMLInputElement>, target: 'product' | 'ctp' | 'bandera' | 'ecotron') {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_800_000) {
      showErr('La imagen supera 1,8 MB. Usa un archivo más liviano.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;
      if (target === 'product' && prodDraft) {
        setProdDraft({ ...prodDraft, image: result });
      } else if (target === 'ctp') {
        setSettingsDraft((s) => ({ ...s, ctpLogoUrl: result }));
      } else if (target === 'bandera') {
        setSettingsDraft((s) => ({ ...s, banderaLogoUrl: result }));
      } else if (target === 'ecotron') {
        setSettingsDraft((s) => ({ ...s, ecotronLogoUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleAddClient(e: FormEvent) {
    e.preventDefault();
    if (!cliName.trim()) return;
    try {
      await apiCall('/api/admin/clients', {
        method: 'POST',
        body: JSON.stringify({ name: cliName, type: cliType, phone: cliPhone, notes: cliNotes }),
      });
      await refreshFullData();
      setCliName('');
      setCliPhone('');
      setCliNotes('');
      showOk('Cliente agregado.');
    } catch (err) {
      showErr(err);
    }
  }

  async function handleAddExpense(e: FormEvent) {
    e.preventDefault();
    if (!expDesc.trim() || expAmount <= 0) return;
    try {
      await apiCall('/api/admin/expenses', {
        method: 'POST',
        body: JSON.stringify({
          description: expDesc,
          category: expCat,
          amount: expAmount,
          supplier: expSupplier,
        }),
      });
      await refreshFullData();
      setExpDesc('');
      setExpAmount(0);
      setExpSupplier('');
      showOk('Gasto operativo registrado.');
    } catch (err) {
      showErr(err);
    }
  }

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault();
    try {
      await apiCall('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsDraft),
      });
      await refreshFullData();
      showOk('Identidad institucional y parámetros guardados.');
    } catch (err) {
      showErr(err);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    try {
      await apiCall('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: curPass, newPassword: newPass }),
      });
      setCurPass('');
      setNewPass('');
      showOk('Clave docente actualizada de forma segura.');
    } catch (err) {
      showErr(err);
    }
  }

  function handleExportSalesCsv() {
    const header = ['Recibo', 'Fecha', 'Cliente', 'Producto', 'Presentación', 'Cantidad', 'Unitario', 'Total', 'Pago'];
    const rows = data.sales.map((s) =>
      [s.receiptNumber, s.date, s.clientName, s.productName, s.presentation, s.quantity, s.unitPrice, s.total, s.paymentMethod]
        .map(escapeCsvCell)
        .join(',')
    );
    downloadTextFile('ventas-ecotron-2027.csv', [header.join(','), ...rows].join('\n'), 'text/csv;charset=utf-8');
  }

  function handleDownloadBackup() {
    downloadTextFile(
      `respaldo-ecotron-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(data, null, 2),
      'application/json;charset=utf-8'
    );
  }

  async function handleRestoreBackup(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const restored = await apiCall<PlatformData>('/api/admin/backup/restore', {
        method: 'POST',
        body: JSON.stringify(parsed),
      });
      onDataChange(restored);
      showOk('Respaldo JSON restaurado correctamente.');
    } catch (err) {
      showErr(err);
    }
  }

  const currentSaleStock =
    selectedSaleProduct && salePresentation
      ? selectedSaleProduct.stockByPresentation?.[salePresentation] || 0
      : 0;

  return (
    <div className="space-y-6">
      {/* Admin Header & Sub-tabs */}
      <div className="rounded-xl border border-[#DCE5DD] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6EFE7] pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#166534]">
              Panel Administrativo · Acceso Docente Completo
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-[#14241B]">
              Gestión Empresarial {data.settings.enterpriseName} y Plataforma
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportSalesCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#C8D6CB] bg-[#F7FAF7] px-3 py-1.5 text-xs font-semibold text-[#14241B] hover:bg-[#EBF3EC]"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-[#166534]" />
              Exportar ventas CSV
            </button>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#C8D6CB] bg-[#F7FAF7] px-3 py-1.5 text-xs font-semibold text-[#14241B] hover:bg-[#EBF3EC]"
            >
              <Download className="h-3.5 w-3.5 text-[#166534]" />
              Respaldo JSON
            </button>
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-1.5 text-xs font-semibold text-[#991B1B] hover:bg-[#FEE2E2]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Poner todo en cero
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {(
            [
              { id: 'resumen', label: 'Resumen financiero', icon: BarChart3 },
              { id: 'ventas', label: 'Registrar venta y recibos', icon: ShoppingCart },
              { id: 'productos', label: 'Productos, sacos y botellas', icon: Package },
              { id: 'inventario', label: 'Inventario y lotes', icon: Receipt },
              { id: 'clientes', label: 'Clientes y gastos', icon: Users },
              { id: 'ajustes', label: 'Logos, clave y respaldo', icon: Settings },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-[#14532D] text-white'
                    : 'border border-[#DCE5DD] bg-[#F7FAF7] text-[#33473B] hover:bg-[#EBF2EC]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {notice && (
          <div
            className={`mt-4 flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-xs font-medium ${
              notice.kind === 'ok'
                ? 'border-[#86EFAC] bg-[#F0FDF4] text-[#166534]'
                : 'border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B]'
            }`}
          >
            <span>{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} className="font-bold underline">
              Cerrar
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: Resumen Financiero */}
      {tab === 'resumen' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[#DCE5DD] bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#4B6153]">Ventas acumuladas</div>
              <div className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-[#14532D]">
                {formatCRC(metrics.totalSales)}
              </div>
              <div className="mt-1 text-xs text-[#4B6153]">{data.sales.length} recibos emitidos</div>
            </div>
            <div className="rounded-xl border border-[#DCE5DD] bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#4B6153]">Gastos operativos</div>
              <div className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-[#92400E]">
                {formatCRC(metrics.totalExpenses)}
              </div>
              <div className="mt-1 text-xs text-[#4B6153]">{data.expenses.length} compras registradas</div>
            </div>
            <div className="rounded-xl border border-[#DCE5DD] bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#4B6153]">
                Fondo Reinversión ({data.settings.reinvestPercent}%)
              </div>
              <div className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-[#0284C7]">
                {formatCRC(metrics.reinvestAmount)}
              </div>
              <div className="mt-1 text-xs text-[#4B6153]">
                Margen neto: <span className="font-mono tabular-nums">{formatCRC(metrics.netMargin)}</span>
              </div>
            </div>
            <div className="rounded-xl border border-[#DCE5DD] bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#4B6153]">Valor en inventario</div>
              <div className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-[#14241B]">
                {formatCRC(metrics.stockValue)}
              </div>
              <div className="mt-1 text-xs text-[#4B6153]">
                <span className="font-mono tabular-nums">{metrics.totalUnits}</span> unidades totales
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-[#DCE5DD] bg-white p-5">
              <h2 className="text-base font-bold text-[#14241B]">Ingresos por producto</h2>
              <div className="mt-4 space-y-3">
                {metrics.topProducts.map(([name, total]) => {
                  const pct = metrics.totalSales > 0 ? Math.round((total / metrics.totalSales) * 100) : 0;
                  return (
                    <div key={name} className="space-y-1 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-[#14241B]">{name}</span>
                        <span className="font-mono tabular-nums text-[#14532D]">
                          {formatCRC(total)} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#E6EFE7]">
                        <div className="h-full bg-[#166534]" style={{ width: `${Math.max(4, pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
                {metrics.topProducts.length === 0 && (
                  <p className="text-xs text-[#4B6153]">Aún no hay ventas registradas.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[#DCE5DD] bg-white p-5">
              <h2 className="text-base font-bold text-[#14241B]">Últimas ventas y comprobantes</h2>
              <div className="mt-3 divide-y divide-[#E6EFE7]">
                {data.sales.slice(0, 5).map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between gap-2 py-2.5 text-xs">
                    <div>
                      <div className="font-bold text-[#14241B]">
                        {sale.receiptNumber} · {sale.productName}
                      </div>
                      <div className="text-[#4B6153]">
                        {sale.presentation} × {sale.quantity} · {sale.clientName}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold tabular-nums text-[#14532D]">
                        {formatCRC(sale.total)}
                      </span>
                      <a
                        href={buildWhatsAppReceiptUrl(sale, data.settings)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-[#86EFAC] bg-[#F0FDF4] p-1.5 text-[#15803D] hover:bg-[#DCFCE7]"
                        title="Enviar factura por WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setActiveReceipt(sale)}
                        className="rounded-lg border border-[#DCE5DD] p-1.5 text-[#14241B] hover:bg-[#F2F8F3]"
                        title="Imprimir o editar recibo"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {data.sales.length === 0 && (
                  <p className="py-4 text-xs text-[#4B6153]">
                    Las ventas están en cero. Registra una nueva venta desde la pestaña de Ventas.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Ventas y Recibos */}
      {tab === 'ventas' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <form
            onSubmit={handleRecordSale}
            className="space-y-4 rounded-xl border border-[#DCE5DD] bg-white p-5 lg:col-span-5"
          >
            <h2 className="text-lg font-bold text-[#14241B]">Registrar nueva venta</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#14241B]">Cliente</label>
                <select
                  value={saleClientId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSaleClientId(nextId);
                    const matched = data.clients.find((c) => c.id === nextId);
                    setSaleClientPhone(matched?.phone || '');
                  }}
                  className="mt-1 w-full rounded-lg border border-[#C8D6CB] bg-white px-3 py-2 text-xs"
                >
                  <option value="GENERAL">Cliente general / Venta directa</option>
                  {data.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#14241B]">WhatsApp del cliente</label>
                <input
                  type="tel"
                  value={saleClientPhone}
                  onChange={(e) => setSaleClientPhone(e.target.value)}
                  placeholder="Ej. 8800-1234 (opcional)"
                  className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14241B]">Producto</label>
              <select
                value={saleProductId}
                onChange={(e) => setSaleProductId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#C8D6CB] bg-white px-3 py-2 text-xs"
              >
                {data.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            {selectedSaleProduct && selectedSaleProduct.status !== 'activo' && (
              <div className="flex items-start gap-2 rounded-lg border border-[#FCD34D] bg-[#FEF3C7]/60 p-2.5 text-[11px] text-[#78350F]">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D97706]" />
                <span>
                  Este producto figura como <strong>{selectedSaleProduct.status}</strong>. Asegúrate de que lleve etiqueta
                  correcta y cumpla orientación técnica antes de entregarlo.
                </span>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#14241B]">Presentación (Saco / Botella)</label>
                <select
                  value={salePresentation}
                  onChange={(e) => {
                    const pack = e.target.value;
                    setSalePresentation(pack);
                    setSaleUnitPrice(selectedSaleProduct?.prices[pack] || 0);
                  }}
                  className="mt-1 w-full rounded-lg border border-[#C8D6CB] bg-white px-3 py-2 text-xs"
                >
                  {Object.keys(selectedSaleProduct?.prices || {}).map((pack) => (
                    <option key={pack} value={pack}>
                      {pack} (Stock: {selectedSaleProduct?.stockByPresentation?.[pack] ?? 0})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#14241B]">
                  Cantidad (Disponible: <span className="font-mono">{currentSaleStock}</span>)
                </label>
                <input
                  type="number"
                  min={1}
                  value={saleQty}
                  onChange={(e) => setSaleQty(Math.max(1, Number(e.target.value)))}
                  className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#14241B]">Precio unitario (₡)</label>
                <input
                  type="number"
                  min={0}
                  value={saleUnitPrice}
                  onChange={(e) => setSaleUnitPrice(Math.max(0, Number(e.target.value)))}
                  className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#14241B]">Método de pago</label>
                <select
                  value={saleMethod}
                  onChange={(e) => setSaleMethod(e.target.value as Sale['paymentMethod'])}
                  className="mt-1 w-full rounded-lg border border-[#C8D6CB] bg-white px-3 py-2 text-xs"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="SINPE Móvil">SINPE Móvil</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Crédito interno">Crédito interno</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14241B]">Notas</label>
              <input
                type="text"
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                placeholder="Ej. entrega en portón, saco cosido..."
                className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 text-xs"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[#F2F8F3] px-4 py-3">
              <span className="text-xs font-bold text-[#14241B]">Total a cobrar</span>
              <span className="font-mono text-lg font-extrabold tabular-nums text-[#14532D]">
                {formatCRC(saleQty * saleUnitPrice)}
              </span>
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#14532D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#166534]"
            >
              <ShoppingCart className="h-4 w-4" />
              Registrar venta y generar recibo
            </button>
          </form>

          <div className="rounded-xl border border-[#DCE5DD] bg-white p-5 lg:col-span-7">
            <h2 className="text-lg font-bold text-[#14241B]">Historial de ventas y recibos</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[540px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DCE5DD] bg-[#F7FAF7] text-[#4B6153]">
                    <th className="px-2.5 py-2">Recibo</th>
                    <th className="px-2.5 py-2">Fecha</th>
                    <th className="px-2.5 py-2">Producto</th>
                    <th className="px-2.5 py-2">Cliente</th>
                    <th className="px-2.5 py-2 text-right">Total</th>
                    <th className="px-2.5 py-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6EFE7]">
                  {data.sales.map((s) => (
                    <tr key={s.id} className="hover:bg-[#FAFBF9]">
                      <td className="px-2.5 py-2 font-mono font-bold text-[#14532D]">{s.receiptNumber}</td>
                      <td className="px-2.5 py-2 font-mono tabular-nums text-[#4B6153]">{formatDateCR(s.date)}</td>
                      <td className="px-2.5 py-2">
                        <div className="font-semibold text-[#14241B]">{s.productName}</div>
                        <div className="text-[11px] text-[#4B6153]">
                          {s.presentation} × {s.quantity}
                        </div>
                      </td>
                      <td className="px-2.5 py-2 text-[#33473B]">{s.clientName}</td>
                      <td className="px-2.5 py-2 text-right font-mono font-bold tabular-nums text-[#14241B]">
                        {formatCRC(s.total)}
                      </td>
                      <td className="px-2.5 py-2 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <a
                            href={buildWhatsAppReceiptUrl(s, data.settings)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-[#86EFAC] bg-[#F0FDF4] px-2 py-1 text-[11px] font-semibold text-[#15803D] hover:bg-[#DCFCE7]"
                            title="Enviar comprobante por WhatsApp"
                          >
                            <MessageCircle className="h-3 w-3" />
                            WhatsApp
                          </a>
                          <button
                            type="button"
                            onClick={() => setActiveReceipt(s)}
                            className="inline-flex items-center gap-1 rounded-md border border-[#DCE5DD] px-2 py-1 text-[11px] font-semibold text-[#14532D] hover:bg-[#F2F8F3]"
                          >
                            <Printer className="h-3 w-3" />
                            Recibo
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data.sales.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-xs text-[#4B6153]">
                        Sin ventas registradas. El historial está limpio y listo para recibir nuevas ventas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Productos, Sacos, Botellas y Precios */}
      {tab === 'productos' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-2 lg:col-span-4">
            <button
              type="button"
              onClick={startNewProduct}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#14532D] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#166534]"
            >
              <Plus className="h-4 w-4" />
              Crear nuevo producto
            </button>
            <div className="space-y-1.5">
              {data.products.map((p) => {
                const active = !creatingNewProduct && prodDraft?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setCreatingNewProduct(false);
                      setEditProductId(p.id);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left ${
                      active
                        ? 'border-[#14532D] bg-[#EAF3EC]'
                        : 'border-[#DCE5DD] bg-white hover:bg-[#F7FAF7]'
                    }`}
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-10 w-10 shrink-0 rounded-lg border border-[#DCE5DD] object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-[#14241B]">{p.name}</div>
                      <div className="text-[11px] text-[#4B6153]">
                        {p.code} · {p.status} · {totalProductStock(p)} u.
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {prodDraft && (
            <form
              onSubmit={handleSaveProduct}
              className="space-y-4 rounded-xl border border-[#DCE5DD] bg-white p-6 lg:col-span-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6EFE7] pb-3">
                <h2 className="text-lg font-bold text-[#14241B]">
                  {creatingNewProduct ? 'Nuevo producto ECOTRON' : `Editando: ${prodDraft.name}`}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  {!creatingNewProduct && (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteProduct(prodDraft)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-xs font-semibold text-[#991B1B] hover:bg-[#FEE2E2]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar producto
                    </button>
                  )}
                  <button
                    type="submit"
                    className="rounded-lg bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#166534]"
                  >
                    {creatingNewProduct ? 'Crear producto' : 'Guardar cambios'}
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#14241B]">Nombre comercial</label>
                  <input
                    type="text"
                    required
                    value={prodDraft.name}
                    onChange={(e) => setProdDraft({ ...prodDraft, name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14241B]">Código SKU</label>
                  <input
                    type="text"
                    value={prodDraft.code}
                    onChange={(e) => setProdDraft({ ...prodDraft, code: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-[#14241B]">Categoría</label>
                  <input
                    type="text"
                    value={prodDraft.category}
                    onChange={(e) => setProdDraft({ ...prodDraft, category: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14241B]">Tipo de envase base</label>
                  <select
                    value={prodDraft.type}
                    onChange={(e) => setProdDraft({ ...prodDraft, type: e.target.value as ProductType })}
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] bg-white px-3 py-2 text-xs"
                  >
                    <option value="solido">Sólido (Sacos / Bolsas)</option>
                    <option value="liquido">Líquido / Caldo (Botellas)</option>
                    <option value="kit">Kit circular / Educación</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14241B]">Estado comercial</label>
                  <select
                    value={prodDraft.status}
                    onChange={(e) => setProdDraft({ ...prodDraft, status: e.target.value as ProductStatus })}
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] bg-white px-3 py-2 text-xs"
                  >
                    <option value="activo">Habilitado para venta</option>
                    <option value="ensayo">Ensayo escolar</option>
                    <option value="desarrollo">Validación técnica</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#14241B]">Eslogan corto (Afiche)</label>
                  <input
                    type="text"
                    value={prodDraft.slogan}
                    onChange={(e) => setProdDraft({ ...prodDraft, slogan: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14241B]">Foto del producto (opcional)</label>
                  <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#9DB8A2] bg-[#F7FAF7] px-3 py-1.5 text-xs font-semibold text-[#14532D] hover:bg-[#EAF3EC]">
                    <Upload className="h-3.5 w-3.5" />
                    Subir imagen JPG / PNG / WebP
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => handleImageUpload(e, 'product')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14241B]">Propósito y uso</label>
                <textarea
                  rows={2}
                  value={prodDraft.purpose}
                  onChange={(e) => setProdDraft({ ...prodDraft, purpose: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 text-xs"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#14241B]">Dosis orientativa</label>
                  <textarea
                    rows={2}
                    value={prodDraft.dose}
                    onChange={(e) => setProdDraft({ ...prodDraft, dose: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14241B]">Protocolo de empaque (Sacos / Botellas)</label>
                  <textarea
                    rows={2}
                    value={prodDraft.packagingNote}
                    onChange={(e) => setProdDraft({ ...prodDraft, packagingNote: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#14241B]">Cómo se aplica (paso a paso)</label>
                  <textarea
                    rows={2}
                    value={prodDraft.how}
                    onChange={(e) => setProdDraft({ ...prodDraft, how: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14241B]">Precaución y seguridad</label>
                  <textarea
                    rows={2}
                    value={prodDraft.caution}
                    onChange={(e) => setProdDraft({ ...prodDraft, caution: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Presentations & Prices editor */}
              <div className="rounded-xl border border-[#DCE5DD] bg-[#F8FAF8] p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#14532D]">
                  Presentaciones, precios (₡) y stock directo
                </div>
                <div className="mt-3 space-y-2">
                  {Object.entries(prodDraft.prices).map(([packName, priceVal]) => (
                    <div key={packName} className="grid grid-cols-12 items-center gap-2">
                      <div className="col-span-5 text-xs font-semibold text-[#14241B]">{packName}</div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min={0}
                          value={priceVal}
                          onChange={(e) =>
                            setProdDraft({
                              ...prodDraft,
                              prices: { ...prodDraft.prices, [packName]: Math.max(0, Number(e.target.value)) },
                            })
                          }
                          className="w-full rounded-lg border border-[#C8D6CB] bg-white px-2.5 py-1.5 font-mono text-xs"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min={0}
                          value={prodDraft.stockByPresentation?.[packName] ?? 0}
                          onChange={(e) =>
                            setProdDraft({
                              ...prodDraft,
                              stockByPresentation: {
                                ...prodDraft.stockByPresentation,
                                [packName]: Math.max(0, Number(e.target.value)),
                              },
                            })
                          }
                          className="w-full rounded-lg border border-[#C8D6CB] bg-white px-2.5 py-1.5 font-mono text-xs"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (Object.keys(prodDraft.prices).length <= 1) return;
                            const nextPrices = { ...prodDraft.prices };
                            delete nextPrices[packName];
                            const nextStock = { ...prodDraft.stockByPresentation };
                            delete nextStock[packName];
                            setProdDraft({ ...prodDraft, prices: nextPrices, stockByPresentation: nextStock });
                          }}
                          className="rounded p-1 text-[#991B1B] hover:bg-[#FEE2E2]"
                          title="Quitar presentación"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-12 gap-2 border-t border-[#DCE5DD] pt-3">
                  <input
                    type="text"
                    value={newPresName}
                    onChange={(e) => setNewPresName(e.target.value)}
                    placeholder="Ej. Saco de 25 kg o Botella reutilizada 1 L"
                    className="col-span-5 rounded-lg border border-[#C8D6CB] bg-white px-2.5 py-1.5 text-xs"
                  />
                  <input
                    type="number"
                    min={0}
                    value={newPresPrice}
                    onChange={(e) => setNewPresPrice(Number(e.target.value))}
                    placeholder="Precio ₡"
                    className="col-span-3 rounded-lg border border-[#C8D6CB] bg-white px-2.5 py-1.5 font-mono text-xs"
                  />
                  <input
                    type="number"
                    min={0}
                    value={newPresStock}
                    onChange={(e) => setNewPresStock(Number(e.target.value))}
                    placeholder="Stock"
                    className="col-span-2 rounded-lg border border-[#C8D6CB] bg-white px-2.5 py-1.5 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const clean = newPresName.trim();
                      if (!clean) return;
                      setProdDraft({
                        ...prodDraft,
                        prices: { ...prodDraft.prices, [clean]: Math.max(0, newPresPrice) },
                        stockByPresentation: {
                          ...prodDraft.stockByPresentation,
                          [clean]: Math.max(0, newPresStock),
                        },
                      });
                    }}
                    className="col-span-2 rounded-lg bg-[#166534] px-2 py-1.5 text-xs font-semibold text-white hover:bg-[#14532D]"
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 4: Inventario y Lotes */}
      {tab === 'inventario' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={handleInventoryMove} className="space-y-3 rounded-xl border border-[#DCE5DD] bg-white p-5">
              <h2 className="text-base font-bold text-[#14241B]">Registrar entrada o ajuste de stock</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold">Producto</label>
                  <select
                    value={invProductId}
                    onChange={(e) => setInvProductId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] bg-white px-2.5 py-2 text-xs"
                  >
                    {data.products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold">Presentación</label>
                  <select
                    value={invPresentation}
                    onChange={(e) => setInvPresentation(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] bg-white px-2.5 py-2 text-xs"
                  >
                    {Object.keys(selectedInvProduct?.prices || {}).map((pack) => (
                      <option key={pack} value={pack}>
                        {pack}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold">Tipo</label>
                  <select
                    value={invType}
                    onChange={(e) => setInvType(e.target.value as 'entrada' | 'ajuste')}
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] bg-white px-2.5 py-2 text-xs"
                  >
                    <option value="entrada">Entrada (+ producción)</option>
                    <option value="ajuste">Ajuste (+/- conteo)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold">Cantidad</label>
                  <input
                    type="number"
                    value={invQty}
                    onChange={(e) => setInvQty(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-2.5 py-2 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">Código de lote</label>
                  <input
                    type="text"
                    value={invBatchCode}
                    onChange={(e) => setInvBatchCode(e.target.value)}
                    placeholder="LOT-2027-..."
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-2.5 py-2 font-mono text-xs"
                  />
                </div>
              </div>
              <input
                type="text"
                value={invNote}
                onChange={(e) => setInvNote(e.target.value)}
                placeholder="Detalle: ensacado grupo 10-A, botellas triple lavado..."
                className="w-full rounded-lg border border-[#C8D6CB] px-3 py-2 text-xs"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#166534]"
              >
                Aplicar movimiento de inventario
              </button>
            </form>

            <form onSubmit={handleAddBatch} className="space-y-3 rounded-xl border border-[#DCE5DD] bg-white p-5">
              <h2 className="text-base font-bold text-[#14241B]">Registrar lote de producción</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold">Producto</label>
                  <select
                    value={batchProdId}
                    onChange={(e) => setBatchProdId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] bg-white px-2.5 py-2 text-xs"
                  >
                    {data.products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold">Presentación</label>
                  <select
                    value={batchPres}
                    onChange={(e) => setBatchPres(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] bg-white px-2.5 py-2 text-xs"
                  >
                    {Object.keys(selectedBatchProduct?.prices || {}).map((pack) => (
                      <option key={pack} value={pack}>
                        {pack}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold">Unidades</label>
                  <input
                    type="number"
                    min={1}
                    value={batchQty}
                    onChange={(e) => setBatchQty(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-2.5 py-2 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">Lote</label>
                  <input
                    type="text"
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                    placeholder="Auto"
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-2.5 py-2 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">Responsable</label>
                  <input
                    type="text"
                    value={batchResponsible}
                    onChange={(e) => setBatchResponsible(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-2.5 py-2 text-xs"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-[#166534] px-4 py-2 text-xs font-semibold text-white hover:bg-[#14532D]"
              >
                Registrar lote
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-[#DCE5DD] bg-white p-5">
            <h2 className="text-base font-bold text-[#14241B]">Lotes recientes y control de calidad/empaque</h2>
            <div className="mt-3 space-y-2">
              {data.batches.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E6EFE7] bg-[#FAFBF9] px-3.5 py-2.5 text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-[#14532D]">
                      {b.batchCode} · {b.productName}
                    </div>
                    <div className="text-[#4B6153]">
                      {b.presentation} × {b.quantity} · {b.responsible} · {formatDateCR(b.startDate)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleBatchFlag(b.id, 'qualityPassed', !b.qualityPassed)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-semibold ${
                        b.qualityPassed
                          ? 'border-[#86EFAC] bg-[#F0FDF4] text-[#166534]'
                          : 'border-[#DCE5DD] bg-white text-[#4B6153]'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Calidad OK
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleBatchFlag(b.id, 'safetyChecked', !b.safetyChecked)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-semibold ${
                        b.safetyChecked
                          ? 'border-[#86EFAC] bg-[#F0FDF4] text-[#166534]'
                          : 'border-[#DCE5DD] bg-white text-[#4B6153]'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Triple lavado / Etiqueta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Clientes y Gastos */}
      {tab === 'clientes' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-[#DCE5DD] bg-white p-5">
            <h2 className="text-base font-bold text-[#14241B]">Directorio de clientes</h2>
            <form onSubmit={handleAddClient} className="grid gap-2.5 rounded-lg bg-[#F8FAF8] p-3.5">
              <input
                type="text"
                required
                value={cliName}
                onChange={(e) => setCliName(e.target.value)}
                placeholder="Nombre completo o institución"
                className="rounded-lg border border-[#C8D6CB] bg-white px-3 py-1.5 text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={cliType}
                  onChange={(e) => setCliType(e.target.value as Client['type'])}
                  className="rounded-lg border border-[#C8D6CB] bg-white px-2.5 py-1.5 text-xs"
                >
                  <option value="Familia / Comunidad">Familia / Comunidad</option>
                  <option value="Productor local">Productor local</option>
                  <option value="Docente">Docente</option>
                  <option value="Estudiante">Estudiante</option>
                  <option value="Institución">Institución</option>
                </select>
                <input
                  type="text"
                  value={cliPhone}
                  onChange={(e) => setCliPhone(e.target.value)}
                  placeholder="Teléfono"
                  className="rounded-lg border border-[#C8D6CB] bg-white px-3 py-1.5 font-mono text-xs"
                />
              </div>
              <input
                type="text"
                value={cliNotes}
                onChange={(e) => setCliNotes(e.target.value)}
                placeholder="Notas (ej. compra sacos 25 kg)"
                className="rounded-lg border border-[#C8D6CB] bg-white px-3 py-1.5 text-xs"
              />
              <button
                type="submit"
                className="rounded-lg bg-[#14532D] px-3 py-2 text-xs font-semibold text-white hover:bg-[#166534]"
              >
                Agregar cliente
              </button>
            </form>

            <div className="divide-y divide-[#E6EFE7]">
              {data.clients.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 py-2.5 text-xs">
                  <div>
                    <div className="font-bold text-[#14241B]">{c.name}</div>
                    <div className="text-[#4B6153]">
                      {c.type} · <span className="font-mono">{c.phone || 'Sin teléfono'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await apiCall(`/api/admin/clients/${c.id}`, { method: 'DELETE' });
                      await refreshFullData();
                    }}
                    className="rounded p-1 text-[#991B1B] hover:bg-[#FEE2E2]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-[#DCE5DD] bg-white p-5">
            <h2 className="text-base font-bold text-[#14241B]">Gastos operativos (sacos, botellas, insumos)</h2>
            <form onSubmit={handleAddExpense} className="grid gap-2.5 rounded-lg bg-[#F8FAF8] p-3.5">
              <input
                type="text"
                required
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                placeholder="Descripción del gasto"
                className="rounded-lg border border-[#C8D6CB] bg-white px-3 py-1.5 text-xs"
              />
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={expCat}
                  onChange={(e) => setExpCat(e.target.value as OperatingExpense['category'])}
                  className="rounded-lg border border-[#C8D6CB] bg-white px-2 py-1.5 text-xs"
                >
                  <option value="Sacos y empaques">Sacos y empaques</option>
                  <option value="Etiquetas e impresión">Etiquetas e impresión</option>
                  <option value="Botellas y limpieza">Botellas y limpieza</option>
                  <option value="Insumos de huerta">Insumos de huerta</option>
                  <option value="Herramientas">Herramientas</option>
                  <option value="Otro">Otro</option>
                </select>
                <input
                  type="number"
                  min={1}
                  required
                  value={expAmount || ''}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  placeholder="Monto ₡"
                  className="rounded-lg border border-[#C8D6CB] bg-white px-2.5 py-1.5 font-mono text-xs"
                />
                <input
                  type="text"
                  value={expSupplier}
                  onChange={(e) => setExpSupplier(e.target.value)}
                  placeholder="Proveedor"
                  className="rounded-lg border border-[#C8D6CB] bg-white px-2.5 py-1.5 text-xs"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-[#166534] px-3 py-2 text-xs font-semibold text-white hover:bg-[#14532D]"
              >
                Registrar gasto
              </button>
            </form>

            <div className="divide-y divide-[#E6EFE7]">
              {data.expenses.map((ex) => (
                <div key={ex.id} className="flex items-center justify-between gap-2 py-2.5 text-xs">
                  <div>
                    <div className="font-bold text-[#14241B]">{ex.description}</div>
                    <div className="text-[#4B6153]">
                      {ex.category} · {ex.supplier} · {formatDateCR(ex.date)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold tabular-nums text-[#92400E]">{formatCRC(ex.amount)}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        await apiCall(`/api/admin/expenses/${ex.id}`, { method: 'DELETE' });
                        await refreshFullData();
                      }}
                      className="rounded p-1 text-[#991B1B] hover:bg-[#FEE2E2]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Identidad, Logos, Clave y Respaldo */}
      {tab === 'ajustes' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <form
            onSubmit={handleSaveSettings}
            className="space-y-4 rounded-xl border border-[#DCE5DD] bg-white p-5 lg:col-span-7"
          >
            <h2 className="text-base font-bold text-[#14241B]">Identidad institucional y logos</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold">Nombre de institución</label>
                <input
                  type="text"
                  value={settingsDraft.schoolName}
                  onChange={(e) => setSettingsDraft({ ...settingsDraft, schoolName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">Empresa estudiantil</label>
                <input
                  type="text"
                  value={settingsDraft.enterpriseName}
                  onChange={(e) => setSettingsDraft({ ...settingsDraft, enterpriseName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">Docente responsable</label>
                <input
                  type="text"
                  value={settingsDraft.teacherName}
                  onChange={(e) => setSettingsDraft({ ...settingsDraft, teacherName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">% Fondo de reinversión</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settingsDraft.reinvestPercent}
                  onChange={(e) => setSettingsDraft({ ...settingsDraft, reinvestPercent: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold">Enlace base del catálogo (para códigos QR)</label>
              <input
                type="url"
                value={settingsDraft.catalogUrl}
                onChange={(e) => setSettingsDraft({ ...settingsDraft, catalogUrl: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 text-xs"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[#DCE5DD] bg-[#F8FAF8] p-3 text-center">
                <img
                  src={settingsDraft.ctpLogoUrl}
                  alt="Logo CTP"
                  className="mx-auto h-12 w-12 object-contain"
                />
                <label className="mt-2 inline-block cursor-pointer text-[11px] font-bold text-[#14532D] underline">
                  Cambiar CTP
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'ctp')}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="rounded-lg border border-[#DCE5DD] bg-[#F8FAF8] p-3 text-center">
                <img
                  src={settingsDraft.ecotronLogoUrl}
                  alt="Logo ECOTRON"
                  className="mx-auto h-12 w-12 object-contain"
                />
                <label className="mt-2 inline-block cursor-pointer text-[11px] font-bold text-[#14532D] underline">
                  Cambiar ECOTRON
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'ecotron')}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="rounded-lg border border-[#DCE5DD] bg-[#F8FAF8] p-3 text-center">
                <img
                  src={settingsDraft.banderaLogoUrl}
                  alt="Logo Bandera Azul"
                  className="mx-auto h-12 w-12 object-contain"
                />
                <label className="mt-2 inline-block cursor-pointer text-[11px] font-bold text-[#14532D] underline">
                  Cambiar Bandera Azul
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'bandera')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="rounded-lg bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#166534]"
            >
              Guardar configuración institucional
            </button>
          </form>

          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-xl border border-[#DCE5DD] bg-white p-5">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-[#166534]" />
                <h2 className="text-base font-bold text-[#14241B]">Cambiar clave docente</h2>
              </div>
              {authStatus.envManaged ? (
                <p className="mt-2 text-xs text-[#4B6153]">
                  La clave está protegida mediante la variable de entorno <code>TEACHER_PASSCODE</code> del servidor.
                </p>
              ) : (
                <form onSubmit={handleChangePassword} className="mt-3 space-y-2.5">
                  <input
                    type="password"
                    required
                    value={curPass}
                    onChange={(e) => setCurPass(e.target.value)}
                    placeholder="Clave actual"
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-[#C8D6CB] px-3 py-2 text-xs"
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Nueva clave (mínimo 6 caracteres)"
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-[#C8D6CB] px-3 py-2 text-xs"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-[#14532D] px-3 py-2 text-xs font-semibold text-white hover:bg-[#166534]"
                  >
                    Actualizar clave privada
                  </button>
                </form>
              )}
            </div>

            <div className="rounded-xl border border-[#DCE5DD] bg-white p-5">
              <h2 className="text-base font-bold text-[#14241B]">Respaldo y restauración</h2>
              <p className="mt-1 text-xs text-[#4B6153]">
                Descarga una copia completa en JSON antes de fin de curso o restaura un respaldo anterior.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#C8D6CB] bg-[#F7FAF7] px-3 py-2 text-xs font-semibold text-[#14241B]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Descargar respaldo JSON
                </button>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#14532D] px-3 py-2 text-xs font-semibold text-white">
                  <Upload className="h-3.5 w-3.5" />
                  Restaurar JSON
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={handleRestoreBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2]/60 p-5">
              <div className="flex items-center gap-2 text-[#991B1B]">
                <RotateCcw className="h-4 w-4" />
                <h2 className="text-base font-bold">Reiniciar ciclo / Poner todo en cero</h2>
              </div>
              <p className="mt-1 text-xs text-[#7F1D1D]">
                Limpia ventas anteriores, gastos, movimientos o stock para arrancar un ciclo limpio de la empresa estudiantil,
                sin borrar tu catálogo ni tus precios.
              </p>
              <button
                type="button"
                onClick={() => setResetModalOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#991B1B] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#7F1D1D]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Abrir reinicio en cero
              </button>
            </div>
          </div>
        </div>
      )}

      <ReceiptModal
        sale={activeReceipt}
        settings={data.settings}
        onClose={() => setActiveReceipt(null)}
      />

      {/* In-app modal: confirm product deletion */}
      {confirmDeleteProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl border border-[#DCE5DD] bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[#14241B]">Eliminar producto del catálogo</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#33473B]">
              ¿Seguro que deseas eliminar <strong>{confirmDeleteProduct.name}</strong> ({confirmDeleteProduct.code})? Se quitará
              del catálogo público y del editor docente.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteProduct(null)}
                className="rounded-lg border border-[#C8D6CB] px-3.5 py-2 text-xs font-semibold text-[#14241B] hover:bg-[#F7FAF7]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingProduct}
                onClick={() => handleDeleteProduct(confirmDeleteProduct)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#991B1B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7F1D1D] disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {deletingProduct ? 'Eliminando...' : 'Sí, eliminar producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app modal: reset platform records to zero */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-xl border border-[#DCE5DD] bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-[#991B1B]">
              <RotateCcw className="h-5 w-5" />
              <h3 className="text-base font-bold text-[#14241B]">Poner registros en cero (Nuevo ciclo)</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#33473B]">
              Selecciona qué registros deseas poner en cero para iniciar con ventas nuevas. El <strong>catálogo de productos</strong>,
              sus <strong>precios</strong> y los <strong>logos institucionales</strong> siempre se mantienen intactos.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {(
                [
                  { key: 'resetSales', label: `Ventas y recibos (${data.sales.length})` },
                  { key: 'resetExpenses', label: `Gastos operativos (${data.expenses.length})` },
                  { key: 'resetMovements', label: `Movimientos de inventario (${data.movements.length})` },
                  { key: 'resetBatches', label: `Lotes de producción (${data.batches.length})` },
                  { key: 'resetStock', label: 'Poner stock actual de productos en 0' },
                  { key: 'resetClients', label: `Directorio de clientes (${data.clients.length})` },
                  { key: 'resetSowings', label: `Siembras activas (${data.sowings.length})` },
                  { key: 'resetLogs', label: `Bitácora de campo (${data.fieldLogs.length})` },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.key}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#DCE5DD] bg-[#F8FAF8] px-3 py-2 text-xs text-[#14241B]"
                >
                  <input
                    type="checkbox"
                    checked={resetOpts[opt.key]}
                    onChange={(e) => setResetOpts((prev) => ({ ...prev, [opt.key]: e.target.checked }))}
                    className="h-4 w-4 accent-[#14532D]"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="rounded-lg border border-[#C8D6CB] px-3.5 py-2 text-xs font-semibold text-[#14241B] hover:bg-[#F7FAF7]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleResetPlatform}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#991B1B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7F1D1D] disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {resetting ? 'Reiniciando...' : 'Confirmar y poner en cero'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
