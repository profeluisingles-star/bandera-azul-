import { createInitialPlatformData } from '../data/defaultCatalog.ts';
import type {
  AuthStatus,
  Client,
  CustomReminder,
  FieldLog,
  InventoryMovement,
  OperatingExpense,
  PlatformData,
  PlatformSettings,
  Product,
  ProductionBatch,
  PublicPlatformData,
  Sale,
  Sowing,
} from '../types.ts';

type BackendMode = 'unknown' | 'server' | 'local';

const LOCAL_DB_KEY = 'ecotron_platform_local_v1';
const LOCAL_AUTH_KEY = 'ecotron_auth_local_v1';

interface LocalAuthRecord {
  salt: string;
  hash: string;
  createdAt: string;
}

let detectedMode: BackendMode = 'unknown';
let localSessionToken: string | null = null;

export function getBackendMode(): BackendMode {
  return detectedMode;
}

function randomHex(bytesLen = 16): string {
  const bytes = new Uint8Array(bytesLen);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashLocalPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Deterministic fallback only if WebCrypto subtle is unavailable
  let h1 = 0x811c9dc5;
  for (let i = 0; i < data.length; i += 1) {
    h1 ^= data[i];
    h1 = Math.imul(h1, 0x01000193);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0');
}

function loadLocalAuth(): LocalAuthRecord | null {
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalAuthRecord>;
    if (typeof parsed.salt === 'string' && typeof parsed.hash === 'string' && parsed.salt && parsed.hash) {
      return {
        salt: parsed.salt,
        hash: parsed.hash,
        createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function saveLocalAuth(rec: LocalAuthRecord): void {
  localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(rec));
}

function loadLocalDb(): PlatformData {
  const fallback = createInitialPlatformData();
  try {
    const raw = localStorage.getItem(LOCAL_DB_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(raw) as Partial<PlatformData>;
    return {
      products: Array.isArray(parsed.products) ? parsed.products : fallback.products,
      clients: Array.isArray(parsed.clients) ? parsed.clients : fallback.clients,
      movements: Array.isArray(parsed.movements) ? parsed.movements : fallback.movements,
      sales: Array.isArray(parsed.sales) ? parsed.sales : fallback.sales,
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : fallback.expenses,
      batches: Array.isArray(parsed.batches) ? parsed.batches : fallback.batches,
      sowings: Array.isArray(parsed.sowings) ? parsed.sowings : fallback.sowings,
      fieldLogs: Array.isArray(parsed.fieldLogs) ? parsed.fieldLogs : fallback.fieldLogs,
      customReminders: Array.isArray(parsed.customReminders)
        ? parsed.customReminders
        : fallback.customReminders,
      settings: parsed.settings ? { ...fallback.settings, ...parsed.settings } : fallback.settings,
    };
  } catch {
    return fallback;
  }
}

function saveLocalDb(db: PlatformData): void {
  try {
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export async function probeBackendMode(token?: string): Promise<{ mode: 'server' | 'local'; authStatus?: AuthStatus }> {
  try {
    const res = await fetch('/api/auth/status', {
      cache: 'no-store',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      detectedMode = 'server';
      const st = (await res.json()) as AuthStatus;
      return { mode: 'server', authStatus: st };
    }
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      detectedMode = 'server';
      return { mode: 'server' };
    }
    // Static hosting (e.g. Shared App static CDN returning 404/405/HTML)
    detectedMode = 'local';
    const stored = loadLocalAuth();
    return {
      mode: 'local',
      authStatus: {
        configured: stored !== null,
        envManaged: false,
        authenticated: Boolean(token && localSessionToken && token === localSessionToken),
      },
    };
  } catch {
    // Keep server mode if previously detected, otherwise local fallback
    if (detectedMode === 'server') {
      return { mode: 'server' };
    }
    detectedMode = 'local';
    const stored = loadLocalAuth();
    return {
      mode: 'local',
      authStatus: {
        configured: stored !== null,
        envManaged: false,
        authenticated: Boolean(token && localSessionToken && token === localSessionToken),
      },
    };
  }
}

export async function fetchPublicPlatformData(): Promise<PublicPlatformData | null> {
  const probe = await probeBackendMode();
  if (probe.mode === 'server') {
    const res = await fetch('/api/public/data', { cache: 'no-store' });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return (await res.json()) as PublicPlatformData;
    }
    if (res.status === 404 || res.status === 405 || !contentType.includes('application/json')) {
      detectedMode = 'local';
    } else {
      return null;
    }
  }
  const db = loadLocalDb();
  return {
    products: db.products,
    sowings: db.sowings,
    fieldLogs: db.fieldLogs,
    customReminders: db.customReminders,
    settings: db.settings,
  };
}

export async function fetchAuthStatus(token?: string): Promise<AuthStatus> {
  const res = await probeBackendMode(token);
  if (res.authStatus) return res.authStatus;
  const stored = loadLocalAuth();
  return {
    configured: res.mode === 'local' ? stored !== null : true,
    envManaged: false,
    authenticated: false,
  };
}

export async function submitAuthRequest(
  isFirstSetup: boolean,
  password: string
): Promise<{ token: string; authStatus: AuthStatus }> {
  const probe = await probeBackendMode();
  if (probe.mode === 'server') {
    const endpoint = isFirstSetup ? '/api/auth/setup' : '/api/auth/login';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        throw new Error(
          `El servidor se está iniciando o reiniciando (HTTP ${res.status}). Espera 5 segundos y vuelve a intentar.`
        );
      }
      // Static host fallback (404 / 405 / HTML)
      detectedMode = 'local';
    } else {
      const data = (await res.json().catch(() => ({}))) as {
        token?: string;
        error?: string;
        configured?: boolean;
        envManaged?: boolean;
      };
      if (!res.ok || !data.token) {
        throw new Error(data.error || `No se pudo validar el acceso docente (HTTP ${res.status}).`);
      }
      return {
        token: data.token,
        authStatus: { configured: true, envManaged: Boolean(data.envManaged), authenticated: true },
      };
    }
  }

  // Local static-mode authentication (no Express server present)
  const stored = loadLocalAuth();
  if (!stored) {
    if (!isFirstSetup) {
      throw new Error(
        'Aún no hay clave configurada en este navegador. Recarga el formulario para definir tu clave docente.'
      );
    }
    if (password.length < 6 || password.length > 128) {
      throw new Error('La clave docente debe tener entre 6 y 128 caracteres.');
    }
    const salt = randomHex(16);
    const hash = await hashLocalPassword(password, salt);
    saveLocalAuth({ salt, hash, createdAt: new Date().toISOString() });
    localSessionToken = `local-${randomHex(24)}`;
    return {
      token: localSessionToken,
      authStatus: { configured: true, envManaged: false, authenticated: true },
    };
  }

  const candidate = await hashLocalPassword(password, stored.salt);
  if (candidate !== stored.hash) {
    throw new Error('Clave docente incorrecta.');
  }
  localSessionToken = `local-${randomHex(24)}`;
  return {
    token: localSessionToken,
    authStatus: { configured: true, envManaged: false, authenticated: true },
  };
}

export async function logoutTeacher(token: string): Promise<void> {
  if (detectedMode === 'local') {
    localSessionToken = null;
    return;
  }
  if (token) {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
}

function requireLocalToken(token: string): void {
  if (!token || !localSessionToken || token !== localSessionToken) {
    throw new Error('Acceso docente requerido. Inicia sesión para continuar.');
  }
}

function cleanStr(value: unknown, maxLen = 400): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLen) : '';
}

function cleanPositiveNum(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

async function handleLocalApi<T>(url: string, options: RequestInit, token: string): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body && typeof options.body === 'string' ? JSON.parse(options.body) : {};
  const db = loadLocalDb();

  if (url === '/api/admin/data' && method === 'GET') {
    requireLocalToken(token);
    return db as T;
  }

  if (url === '/api/auth/change-password' && method === 'POST') {
    requireLocalToken(token);
    const stored = loadLocalAuth();
    const cur = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const next = typeof body.newPassword === 'string' ? body.newPassword : '';
    if (!stored || (await hashLocalPassword(cur, stored.salt)) !== stored.hash) {
      throw new Error('La clave actual no es correcta.');
    }
    if (next.length < 6 || next.length > 128) {
      throw new Error('La nueva clave debe tener entre 6 y 128 caracteres.');
    }
    const salt = randomHex(16);
    const hash = await hashLocalPassword(next, salt);
    saveLocalAuth({ salt, hash, createdAt: new Date().toISOString() });
    return { ok: true } as T;
  }

  requireLocalToken(token);

  // Products
  if (url === '/api/admin/products' && method === 'POST') {
    const name = cleanStr(body.name, 120);
    if (!name) throw new Error('El nombre del producto es obligatorio.');
    const prices: Record<string, number> = {};
    const stockByPresentation: Record<string, number> = {};
    for (const [k, v] of Object.entries((body.prices || {}) as Record<string, unknown>)) {
      const label = cleanStr(k, 60);
      if (label) {
        prices[label] = cleanPositiveNum(v, 0);
        stockByPresentation[label] = cleanPositiveNum(body.stockByPresentation?.[k], 0);
      }
    }
    const firstPack = Object.keys(prices)[0] || cleanStr(body.pack, 60) || 'Saco de 25 kg';
    if (Object.keys(prices).length === 0) {
      prices[firstPack] = 2000;
      stockByPresentation[firstPack] = 0;
    }
    const newProduct: Product = {
      id: `ECO-${randomHex(3).toUpperCase()}`,
      code: cleanStr(body.code, 40) || `PRD-${Date.now().toString().slice(-4)}`,
      name,
      category: cleanStr(body.category, 80) || 'Insumo agroecológico',
      type: body.type === 'liquido' || body.type === 'kit' ? body.type : 'solido',
      status: body.status === 'activo' || body.status === 'ensayo' ? body.status : 'desarrollo',
      pack: firstPack,
      purpose: cleanStr(body.purpose, 400),
      how: cleanStr(body.how, 400),
      dose: cleanStr(body.dose, 300),
      caution: cleanStr(body.caution, 400),
      packagingNote: cleanStr(body.packagingNote, 400),
      recipe: cleanStr(body.recipe, 40) || 'compost',
      process: Array.isArray(body.process) ? body.process : [],
      reg: cleanStr(body.reg, 300),
      tech: cleanStr(body.tech, 300),
      tests: cleanStr(body.tests, 300),
      labelok: Boolean(body.labelok),
      packok: Boolean(body.packok),
      image: cleanStr(body.image, 2_500_000) || '/products/eco-com.webp',
      slogan: cleanStr(body.slogan, 200) || 'Producción agroecológica CTP Tronadora.',
      prices,
      stockByPresentation,
      marketingCategory: cleanStr(body.marketingCategory, 100) || 'Catálogo ECOTRON',
      infosteps: Array.isArray(body.infosteps) ? body.infosteps : [],
    };
    db.products.push(newProduct);
    saveLocalDb(db);
    return newProduct as T;
  }

  const prodMatch = url.match(/^\/api\/admin\/products\/([^/]+)$/);
  if (prodMatch) {
    const id = prodMatch[1];
    if (method === 'PUT') {
      const idx = db.products.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error('Producto no encontrado.');
      const existing = db.products[idx];
      const updated: Product = {
        ...existing,
        ...body,
        id: existing.id,
      };
      db.products[idx] = updated;
      saveLocalDb(db);
      return updated as T;
    }
    if (method === 'DELETE') {
      db.products = db.products.filter((p) => p.id !== id);
      saveLocalDb(db);
      return { ok: true } as T;
    }
  }

  // Sales
  if (url === '/api/admin/sales' && method === 'POST') {
    const product = db.products.find((p) => p.id === body.productId);
    const presentation = cleanStr(body.presentation, 60);
    const quantity = Math.floor(cleanPositiveNum(body.quantity, 0));
    if (!product || !presentation || quantity <= 0) {
      throw new Error('Verifica producto, presentación y cantidad mayor a cero.');
    }
    const currentStock = Number(product.stockByPresentation[presentation] || 0);
    if (currentStock < quantity) {
      throw new Error(
        `Stock insuficiente para ${product.name} (${presentation}). Disponible: ${currentStock}.`
      );
    }
    const client = db.clients.find((c) => c.id === body.clientId);
    const unitPrice = cleanPositiveNum(body.unitPrice, product.prices[presentation] || 0);
    const date = cleanStr(body.date, 20) || new Date().toISOString().slice(0, 10);
    const receiptNumber = `REC-2027-${String(db.sales.length + 1).padStart(3, '0')}`;
    product.stockByPresentation[presentation] = currentStock - quantity;

    const sale: Sale = {
      id: `VEN-${Date.now().toString().slice(-6)}`,
      receiptNumber,
      date,
      clientId: client ? client.id : 'GENERAL',
      clientName: client ? client.name : cleanStr(body.clientName, 120) || 'Cliente general',
      clientPhone: cleanStr(body.clientPhone, 30) || client?.phone || '',
      productId: product.id,
      productName: product.name,
      presentation,
      quantity,
      unitPrice,
      total: quantity * unitPrice,
      paymentMethod: body.paymentMethod || 'Efectivo',
      notes: cleanStr(body.notes, 250),
    };
    const movement: InventoryMovement = {
      id: `MOV-${Date.now().toString().slice(-6)}`,
      productId: product.id,
      productName: product.name,
      presentation,
      type: 'venta',
      quantity: -quantity,
      batchCode: receiptNumber,
      note: `Venta a ${sale.clientName}`,
      date,
    };
    db.sales.unshift(sale);
    db.movements.unshift(movement);
    saveLocalDb(db);
    return { sale, product, movement } as T;
  }

  // Inventory Move
  if (url === '/api/admin/inventory/move' && method === 'POST') {
    const product = db.products.find((p) => p.id === body.productId);
    const presentation = cleanStr(body.presentation, 60);
    const quantity = Number(body.quantity);
    const type = body.type === 'ajuste' ? 'ajuste' : 'entrada';
    if (!product || !presentation || !Number.isFinite(quantity) || quantity === 0) {
      throw new Error('Selecciona producto, presentación y cantidad válida.');
    }
    const current = Number(product.stockByPresentation[presentation] || 0);
    product.stockByPresentation[presentation] =
      type === 'entrada' ? current + Math.abs(quantity) : Math.max(0, current + quantity);
    const movement: InventoryMovement = {
      id: `MOV-${Date.now().toString().slice(-6)}`,
      productId: product.id,
      productName: product.name,
      presentation,
      type,
      quantity: type === 'entrada' ? Math.abs(quantity) : quantity,
      batchCode: cleanStr(body.batchCode, 40) || `LOT-${new Date().toISOString().slice(0, 10)}`,
      note: cleanStr(body.note, 220),
      date: cleanStr(body.date, 20) || new Date().toISOString().slice(0, 10),
    };
    db.movements.unshift(movement);
    saveLocalDb(db);
    return { movement, product } as T;
  }

  // Batches
  if (url === '/api/admin/batches' && method === 'POST') {
    const product = db.products.find((p) => p.id === body.productId);
    const presentation = cleanStr(body.presentation, 60);
    const quantity = Math.floor(cleanPositiveNum(body.quantity, 0));
    if (!product || !presentation || quantity <= 0) {
      throw new Error('Completa producto, presentación y cantidad del lote.');
    }
    const batch: ProductionBatch = {
      id: `LOT-${Date.now().toString().slice(-6)}`,
      batchCode: cleanStr(body.batchCode, 40) || `LOT-${product.code}-${Date.now().toString().slice(-4)}`,
      productId: product.id,
      productName: product.name,
      presentation,
      quantity,
      startDate: new Date().toISOString().slice(0, 10),
      readinessDate: new Date().toISOString().slice(0, 10),
      responsible: cleanStr(body.responsible, 120) || db.settings.teacherName,
      qualityPassed: Boolean(body.qualityPassed),
      safetyChecked: Boolean(body.safetyChecked),
      notes: cleanStr(body.notes, 250),
    };
    db.batches.unshift(batch);
    saveLocalDb(db);
    return batch as T;
  }

  const batchMatch = url.match(/^\/api\/admin\/batches\/([^/]+)$/);
  if (batchMatch && method === 'PATCH') {
    const batch = db.batches.find((b) => b.id === batchMatch[1]);
    if (!batch) throw new Error('Lote no encontrado.');
    if (typeof body.qualityPassed === 'boolean') batch.qualityPassed = body.qualityPassed;
    if (typeof body.safetyChecked === 'boolean') batch.safetyChecked = body.safetyChecked;
    saveLocalDb(db);
    return batch as T;
  }

  // Clients
  if (url === '/api/admin/clients' && method === 'POST') {
    const name = cleanStr(body.name, 120);
    if (!name) throw new Error('El nombre del cliente es obligatorio.');
    const client: Client = {
      id: `CLI-${Date.now().toString().slice(-6)}`,
      name,
      type: body.type || 'Familia / Comunidad',
      phone: cleanStr(body.phone, 30),
      notes: cleanStr(body.notes, 250),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    db.clients.unshift(client);
    saveLocalDb(db);
    return client as T;
  }

  const clientMatch = url.match(/^\/api\/admin\/clients\/([^/]+)$/);
  if (clientMatch && method === 'DELETE') {
    db.clients = db.clients.filter((c) => c.id !== clientMatch[1]);
    saveLocalDb(db);
    return { ok: true } as T;
  }

  // Expenses
  if (url === '/api/admin/expenses' && method === 'POST') {
    const description = cleanStr(body.description, 200);
    const amount = cleanPositiveNum(body.amount, 0);
    if (!description || amount <= 0) throw new Error('Ingresa descripción y monto mayor a cero.');
    const expense: OperatingExpense = {
      id: `GAS-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().slice(0, 10),
      category: body.category || 'Otro',
      description,
      amount,
      supplier: cleanStr(body.supplier, 120) || 'Proveedor local',
    };
    db.expenses.unshift(expense);
    saveLocalDb(db);
    return expense as T;
  }

  const expMatch = url.match(/^\/api\/admin\/expenses\/([^/]+)$/);
  if (expMatch && method === 'DELETE') {
    db.expenses = db.expenses.filter((e) => e.id !== expMatch[1]);
    saveLocalDb(db);
    return { ok: true } as T;
  }

  // Sowings
  if (url === '/api/admin/sowings' && method === 'POST') {
    const sowing: Sowing = {
      id: `SIE-${Date.now().toString().slice(-6)}`,
      cropId: cleanStr(body.cropId, 40),
      cropName: cleanStr(body.cropName, 80),
      bed: cleanStr(body.bed, 80),
      startDate: cleanStr(body.startDate, 20) || new Date().toISOString().slice(0, 10),
      plants: Math.max(1, Math.floor(cleanPositiveNum(body.plants, 10))),
      notes: cleanStr(body.notes, 250),
      completedTasks: [],
    };
    db.sowings.unshift(sowing);
    saveLocalDb(db);
    return sowing as T;
  }

  const sowingTasksMatch = url.match(/^\/api\/admin\/sowings\/([^/]+)\/tasks$/);
  if (sowingTasksMatch && method === 'PATCH') {
    const sowing = db.sowings.find((s) => s.id === sowingTasksMatch[1]);
    if (!sowing) throw new Error('Siembra no encontrada.');
    const taskId = cleanStr(body.taskId, 40);
    if (sowing.completedTasks.includes(taskId)) {
      sowing.completedTasks = sowing.completedTasks.filter((t) => t !== taskId);
    } else {
      sowing.completedTasks.push(taskId);
    }
    saveLocalDb(db);
    return sowing as T;
  }

  const sowingMatch = url.match(/^\/api\/admin\/sowings\/([^/]+)$/);
  if (sowingMatch && method === 'DELETE') {
    db.sowings = db.sowings.filter((s) => s.id !== sowingMatch[1]);
    saveLocalDb(db);
    return { ok: true } as T;
  }

  // Field Logs
  if (url === '/api/admin/field-logs' && method === 'POST') {
    const entry: FieldLog = {
      id: `BIT-${Date.now().toString().slice(-6)}`,
      date: cleanStr(body.date, 20) || new Date().toISOString().slice(0, 10),
      studentName: cleanStr(body.studentName, 100) || db.settings.teacherName,
      cropOrArea: cleanStr(body.cropOrArea, 100) || 'Huerta escolar',
      observation: cleanStr(body.observation, 350),
      actionTaken: cleanStr(body.actionTaken, 250),
    };
    db.fieldLogs.unshift(entry);
    saveLocalDb(db);
    return entry as T;
  }

  const logMatch = url.match(/^\/api\/admin\/field-logs\/([^/]+)$/);
  if (logMatch && method === 'DELETE') {
    db.fieldLogs = db.fieldLogs.filter((l) => l.id !== logMatch[1]);
    saveLocalDb(db);
    return { ok: true } as T;
  }

  // Custom Reminders
  if (url === '/api/admin/reminders' && method === 'POST') {
    const rem: CustomReminder = {
      id: `REM-${Date.now().toString().slice(-6)}`,
      date: cleanStr(body.date, 20) || new Date().toISOString().slice(0, 10),
      title: cleanStr(body.title, 140),
      category: body.category || 'otro',
      area: cleanStr(body.area, 80) || 'Huerta escolar',
      instructions: cleanStr(body.instructions, 320),
      done: false,
    };
    db.customReminders.unshift(rem);
    saveLocalDb(db);
    return rem as T;
  }

  const remMatch = url.match(/^\/api\/admin\/reminders\/([^/]+)$/);
  if (remMatch) {
    if (method === 'PATCH') {
      const rem = db.customReminders.find((r) => r.id === remMatch[1]);
      if (!rem) throw new Error('Recordatorio no encontrado.');
      if (typeof body.done === 'boolean') rem.done = body.done;
      saveLocalDb(db);
      return rem as T;
    }
    if (method === 'DELETE') {
      db.customReminders = db.customReminders.filter((r) => r.id !== remMatch[1]);
      saveLocalDb(db);
      return { ok: true } as T;
    }
  }

  // Settings
  if (url === '/api/admin/settings' && method === 'PUT') {
    db.settings = { ...db.settings, ...(body as Partial<PlatformSettings>) };
    saveLocalDb(db);
    return db.settings as T;
  }

  // Reset
  if (url === '/api/admin/reset' && method === 'POST') {
    if (body.resetSales !== false) db.sales = [];
    if (body.resetExpenses !== false) db.expenses = [];
    if (body.resetMovements !== false) db.movements = [];
    if (body.resetBatches !== false) db.batches = [];
    if (body.resetClients === true) db.clients = [];
    if (body.resetSowings === true) db.sowings = [];
    if (body.resetLogs === true) db.fieldLogs = [];
    if (body.resetStock === true) {
      db.products = db.products.map((p) => {
        const zeroStock: Record<string, number> = {};
        for (const k of Object.keys(p.prices || {})) zeroStock[k] = 0;
        return { ...p, stockByPresentation: zeroStock };
      });
    }
    saveLocalDb(db);
    return db as T;
  }

  // Restore
  if (url === '/api/admin/backup/restore' && method === 'POST') {
    const fallback = createInitialPlatformData();
    const restored: PlatformData = {
      products: Array.isArray(body.products) ? body.products : fallback.products,
      clients: Array.isArray(body.clients) ? body.clients : [],
      movements: Array.isArray(body.movements) ? body.movements : [],
      sales: Array.isArray(body.sales) ? body.sales : [],
      expenses: Array.isArray(body.expenses) ? body.expenses : [],
      batches: Array.isArray(body.batches) ? body.batches : [],
      sowings: Array.isArray(body.sowings) ? body.sowings : [],
      fieldLogs: Array.isArray(body.fieldLogs) ? body.fieldLogs : [],
      customReminders: Array.isArray(body.customReminders) ? body.customReminders : [],
      settings: body.settings ? { ...fallback.settings, ...body.settings } : fallback.settings,
    };
    saveLocalDb(restored);
    return restored as T;
  }

  throw new Error('Operación no disponible.');
}

export async function adminApiRequest<T>(
  url: string,
  options: RequestInit = {},
  authToken = ''
): Promise<T> {
  if (detectedMode === 'local') {
    return handleLocalApi<T>(url, options, authToken);
  }
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      ...(options.headers || {}),
    },
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (res.status === 404 || res.status === 405) {
      detectedMode = 'local';
      return handleLocalApi<T>(url, options, authToken);
    }
    throw new Error(`El servidor respondió inesperadamente (HTTP ${res.status}).`);
  }
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(body.error || 'Error al guardar en el servidor.');
  }
  return body;
}
