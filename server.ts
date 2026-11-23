import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { createInitialPlatformData } from './src/data/defaultCatalog.ts';
import type {
  Client,
  CustomReminder,
  FieldLog,
  InventoryMovement,
  OperatingExpense,
  PlatformData,
  PlatformSettings,
  Product,
  ProductionBatch,
  Sale,
  Sowing,
} from './src/types.ts';

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'ecotron-platform.json');
const AUTH_PATH = path.join(DATA_DIR, 'teacher-auth.json');

interface StoredAuth {
  salt: string;
  hash: string;
  createdAt: string;
}

interface SessionRecord {
  expiresAt: number;
}

const sessions = new Map<string, SessionRecord>();
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_LOGIN_FAILS = 10;

function ensureDataDir(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function writeJsonAtomic(filePath: string, data: unknown): void {
  ensureDataDir();
  const tmpPath = `${filePath}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, filePath);
}

function loadPlatformData(): PlatformData {
  ensureDataDir();
  if (!fs.existsSync(DB_PATH)) {
    const initial = createInitialPlatformData();
    writeJsonAtomic(DB_PATH, initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<PlatformData>;
    const fallback = createInitialPlatformData();
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
    const initial = createInitialPlatformData();
    writeJsonAtomic(DB_PATH, initial);
    return initial;
  }
}

let platformDb: PlatformData = loadPlatformData();

function savePlatformData(): void {
  writeJsonAtomic(DB_PATH, platformDb);
}

function getEnvPasscode(): string {
  return String(process.env.TEACHER_PASSCODE || '').trim();
}

function loadStoredAuth(): StoredAuth | null {
  if (!fs.existsSync(AUTH_PATH)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(AUTH_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoredAuth>;
    if (typeof parsed.salt === 'string' && typeof parsed.hash === 'string') {
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

function hashPassword(password: string, saltHex?: string): { salt: string; hash: string } {
  const salt = saltHex || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash: derived };
}

function verifyPassword(password: string): boolean {
  const envPass = getEnvPasscode();
  if (envPass.length > 0) {
    const a = crypto.createHash('sha256').update(password).digest();
    const b = crypto.createHash('sha256').update(envPass).digest();
    return crypto.timingSafeEqual(a, b);
  }
  const stored = loadStoredAuth();
  if (!stored) {
    return false;
  }
  const candidate = crypto.scryptSync(password, stored.salt, 64);
  const expected = Buffer.from(stored.hash, 'hex');
  if (candidate.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(candidate, expected);
}

function isAuthConfigured(): { configured: boolean; envManaged: boolean } {
  const envPass = getEnvPasscode();
  if (envPass.length > 0) {
    return { configured: true, envManaged: true };
  }
  return { configured: loadStoredAuth() !== null, envManaged: false };
}

function createSession(): string {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice(7).trim() || null;
}

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  const rec = sessions.get(token);
  if (!rec) return false;
  if (Date.now() > rec.expiresAt) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function requireTeacherAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!isTokenValid(token)) {
    res.status(401).json({ error: 'Acceso docente requerido. Inicia sesión para continuar.' });
    return;
  }
  next();
}

function getClientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; retrySeconds: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    return { allowed: true, retrySeconds: 0 };
  }
  if (entry.count >= MAX_LOGIN_FAILS) {
    return { allowed: false, retrySeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, retrySeconds: 0 };
}

function recordLoginFailure(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

function clearLoginFailures(ip: string): void {
  loginAttempts.delete(ip);
}

function cleanStr(value: unknown, maxLen = 400): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

function cleanPositiveNum(value: unknown, fallback = 0): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

function isSafeImageSrc(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const s = value.trim();
  if (!s) return true;
  if (s.startsWith('/logos/') || s.startsWith('/products/') || s.startsWith('/assets/')) {
    return true;
  }
  if (/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/i.test(s) && s.length <= 2_500_000) {
    return true;
  }
  return false;
}

async function startServer(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '4mb' }));

  // Auth endpoints
  app.get('/api/auth/status', (req: Request, res: Response) => {
    const { configured, envManaged } = isAuthConfigured();
    const token = extractBearerToken(req);
    res.json({
      configured,
      envManaged,
      authenticated: isTokenValid(token),
    });
  });

  app.post('/api/auth/setup', (req: Request, res: Response) => {
    const { configured, envManaged } = isAuthConfigured();
    if (envManaged || configured) {
      res.status(409).json({ error: 'La clave docente ya está configurada. Utiliza el inicio de sesión.' });
      return;
    }
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (password.length < 6 || password.length > 128) {
      res.status(400).json({ error: 'La clave docente debe tener entre 6 y 128 caracteres.' });
      return;
    }
    ensureDataDir();
    const { salt, hash } = hashPassword(password);
    const payload: StoredAuth = {
      salt,
      hash,
      createdAt: new Date().toISOString(),
    };
    try {
      fs.writeFileSync(AUTH_PATH, JSON.stringify(payload, null, 2), { flag: 'wx', encoding: 'utf8' });
    } catch {
      res.status(409).json({ error: 'La clave docente ya fue establecida.' });
      return;
    }
    const token = createSession();
    res.status(201).json({ token, configured: true, envManaged: false, authenticated: true });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const ip = getClientIp(req);
    const limit = checkRateLimit(ip);
    if (!limit.allowed) {
      res.status(429).json({
        error: `Demasiados intentos fallidos. Espera ${limit.retrySeconds} segundos antes de intentar de nuevo.`,
      });
      return;
    }
    const { configured } = isAuthConfigured();
    if (!configured) {
      res.status(400).json({ error: 'Aún no se ha configurado la clave docente inicial.' });
      return;
    }
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!password || !verifyPassword(password)) {
      recordLoginFailure(ip);
      res.status(401).json({ error: 'Clave docente incorrecta.' });
      return;
    }
    clearLoginFailures(ip);
    const token = createSession();
    res.json({ token, authenticated: true });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const token = extractBearerToken(req);
    if (token) sessions.delete(token);
    res.json({ ok: true });
  });

  app.post('/api/auth/change-password', requireTeacherAuth, (req: Request, res: Response) => {
    const { envManaged } = isAuthConfigured();
    if (envManaged) {
      res.status(400).json({
        error: 'La clave está gestionada mediante variable de entorno TEACHER_PASSCODE en el servidor.',
      });
      return;
    }
    const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    if (!verifyPassword(currentPassword)) {
      res.status(401).json({ error: 'La clave actual no es correcta.' });
      return;
    }
    if (newPassword.length < 6 || newPassword.length > 128) {
      res.status(400).json({ error: 'La nueva clave debe tener entre 6 y 128 caracteres.' });
      return;
    }
    const { salt, hash } = hashPassword(newPassword);
    writeJsonAtomic(AUTH_PATH, {
      salt,
      hash,
      createdAt: new Date().toISOString(),
    });
    res.json({ ok: true });
  });

  // Public read-only data (excludes private client PII, sales ledger, expenses, internal notes)
  app.get('/api/public/data', (_req: Request, res: Response) => {
    res.json({
      products: platformDb.products,
      sowings: platformDb.sowings,
      fieldLogs: platformDb.fieldLogs,
      customReminders: platformDb.customReminders,
      settings: platformDb.settings,
    });
  });

  // Protected full teacher data
  app.get('/api/admin/data', requireTeacherAuth, (_req: Request, res: Response) => {
    res.json(platformDb);
  });

  // Products CRUD (teacher)
  app.post('/api/admin/products', requireTeacherAuth, (req: Request, res: Response) => {
    const b = req.body || {};
    const name = cleanStr(b.name, 120);
    const code = cleanStr(b.code, 40) || `PRD-${Date.now().toString().slice(-4)}`;
    if (!name) {
      res.status(400).json({ error: 'El nombre del producto es obligatorio.' });
      return;
    }
    const pricesInput = b.prices && typeof b.prices === 'object' ? (b.prices as Record<string, unknown>) : {};
    const prices: Record<string, number> = {};
    const stockByPresentation: Record<string, number> = {};
    for (const [k, v] of Object.entries(pricesInput)) {
      const label = cleanStr(k, 60);
      if (label) {
        prices[label] = cleanPositiveNum(v, 0);
        stockByPresentation[label] = cleanPositiveNum(b.stockByPresentation?.[k], 0);
      }
    }
    const firstPack = Object.keys(prices)[0] || cleanStr(b.pack, 60) || 'Saco de 25 kg';
    if (Object.keys(prices).length === 0) {
      prices[firstPack] = 2000;
      stockByPresentation[firstPack] = 0;
    }

    const image = isSafeImageSrc(b.image) && cleanStr(b.image, 2_500_000) ? cleanStr(b.image, 2_500_000) : '/products/eco-com.webp';
    const newProduct: Product = {
      id: `ECO-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      code,
      name,
      category: cleanStr(b.category, 80) || 'Insumo agroecológico',
      type: b.type === 'liquido' || b.type === 'kit' ? b.type : 'solido',
      status: b.status === 'activo' || b.status === 'ensayo' ? b.status : 'desarrollo',
      pack: firstPack,
      purpose: cleanStr(b.purpose, 400),
      how: cleanStr(b.how, 400),
      dose: cleanStr(b.dose, 300),
      caution: cleanStr(b.caution, 400),
      packagingNote: cleanStr(b.packagingNote, 400),
      recipe: cleanStr(b.recipe, 40) || 'compost',
      process: Array.isArray(b.process) ? b.process.map((s: unknown) => cleanStr(s, 220)).filter(Boolean) : [],
      reg: cleanStr(b.reg, 300),
      tech: cleanStr(b.tech, 300),
      tests: cleanStr(b.tests, 300),
      labelok: Boolean(b.labelok),
      packok: Boolean(b.packok),
      image,
      slogan: cleanStr(b.slogan, 200) || 'Producción agroecológica CTP Tronadora.',
      prices,
      stockByPresentation,
      marketingCategory: cleanStr(b.marketingCategory, 100) || 'Catálogo ECOTRON',
      infosteps: Array.isArray(b.infosteps) ? b.infosteps.map((s: unknown) => cleanStr(s, 220)).filter(Boolean) : [],
    };
    platformDb.products.push(newProduct);
    savePlatformData();
    res.status(201).json(newProduct);
  });

  app.put('/api/admin/products/:id', requireTeacherAuth, (req: Request, res: Response) => {
    const idx = platformDb.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Producto no encontrado.' });
      return;
    }
    const existing = platformDb.products[idx];
    const b = req.body || {};

    let nextPrices = existing.prices;
    let nextStock = { ...existing.stockByPresentation };
    if (b.prices && typeof b.prices === 'object') {
      const cleaned: Record<string, number> = {};
      for (const [k, v] of Object.entries(b.prices as Record<string, unknown>)) {
        const label = cleanStr(k, 60);
        if (label) {
          cleaned[label] = cleanPositiveNum(v, 0);
          if (typeof nextStock[label] !== 'number') {
            nextStock[label] = 0;
          }
        }
      }
      if (Object.keys(cleaned).length > 0) {
        nextPrices = cleaned;
      }
    }
    if (b.stockByPresentation && typeof b.stockByPresentation === 'object') {
      for (const [k, v] of Object.entries(b.stockByPresentation as Record<string, unknown>)) {
        const label = cleanStr(k, 60);
        if (label) {
          nextStock[label] = cleanPositiveNum(v, 0);
        }
      }
    }

    const updated: Product = {
      ...existing,
      name: cleanStr(b.name, 120) || existing.name,
      code: cleanStr(b.code, 40) || existing.code,
      category: cleanStr(b.category, 80) || existing.category,
      type: b.type === 'solido' || b.type === 'liquido' || b.type === 'kit' ? b.type : existing.type,
      status: b.status === 'activo' || b.status === 'ensayo' || b.status === 'desarrollo' ? b.status : existing.status,
      pack: cleanStr(b.pack, 60) || Object.keys(nextPrices)[0] || existing.pack,
      purpose: typeof b.purpose === 'string' ? cleanStr(b.purpose, 400) : existing.purpose,
      how: typeof b.how === 'string' ? cleanStr(b.how, 400) : existing.how,
      dose: typeof b.dose === 'string' ? cleanStr(b.dose, 300) : existing.dose,
      caution: typeof b.caution === 'string' ? cleanStr(b.caution, 400) : existing.caution,
      packagingNote: typeof b.packagingNote === 'string' ? cleanStr(b.packagingNote, 400) : existing.packagingNote,
      slogan: typeof b.slogan === 'string' ? cleanStr(b.slogan, 200) : existing.slogan,
      marketingCategory:
        typeof b.marketingCategory === 'string' ? cleanStr(b.marketingCategory, 100) : existing.marketingCategory,
      labelok: typeof b.labelok === 'boolean' ? b.labelok : existing.labelok,
      packok: typeof b.packok === 'boolean' ? b.packok : existing.packok,
      image: typeof b.image === 'string' && isSafeImageSrc(b.image) ? b.image.trim() : existing.image,
      prices: nextPrices,
      stockByPresentation: nextStock,
      infosteps: Array.isArray(b.infosteps)
        ? b.infosteps.map((s: unknown) => cleanStr(s, 220)).filter(Boolean)
        : existing.infosteps,
    };

    platformDb.products[idx] = updated;
    savePlatformData();
    res.json(updated);
  });

  app.delete('/api/admin/products/:id', requireTeacherAuth, (req: Request, res: Response) => {
    const before = platformDb.products.length;
    platformDb.products = platformDb.products.filter((p) => p.id !== req.params.id);
    if (platformDb.products.length === before) {
      res.status(404).json({ error: 'Producto no encontrado.' });
      return;
    }
    savePlatformData();
    res.json({ ok: true });
  });

  // Clients
  app.post('/api/admin/clients', requireTeacherAuth, (req: Request, res: Response) => {
    const name = cleanStr(req.body?.name, 120);
    if (!name) {
      res.status(400).json({ error: 'El nombre del cliente es obligatorio.' });
      return;
    }
    const validTypes = ['Docente', 'Estudiante', 'Familia / Comunidad', 'Productor local', 'Institución'] as const;
    const rawType = cleanStr(req.body?.type, 40);
    const type = validTypes.includes(rawType as (typeof validTypes)[number])
      ? (rawType as Client['type'])
      : 'Familia / Comunidad';
    const client: Client = {
      id: `CLI-${Date.now().toString().slice(-6)}`,
      name,
      type,
      phone: cleanStr(req.body?.phone, 30),
      notes: cleanStr(req.body?.notes, 250),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    platformDb.clients.unshift(client);
    savePlatformData();
    res.status(201).json(client);
  });

  app.delete('/api/admin/clients/:id', requireTeacherAuth, (req: Request, res: Response) => {
    platformDb.clients = platformDb.clients.filter((c) => c.id !== req.params.id);
    savePlatformData();
    res.json({ ok: true });
  });

  // Inventory movement (entrada / ajuste)
  app.post('/api/admin/inventory/move', requireTeacherAuth, (req: Request, res: Response) => {
    const productId = cleanStr(req.body?.productId, 40);
    const presentation = cleanStr(req.body?.presentation, 60);
    const quantity = Number(req.body?.quantity);
    const type = req.body?.type === 'ajuste' ? 'ajuste' : 'entrada';
    const product = platformDb.products.find((p) => p.id === productId);
    if (!product || !presentation || !Number.isFinite(quantity) || quantity === 0) {
      res.status(400).json({ error: 'Selecciona producto, presentación y cantidad válida.' });
      return;
    }
    const current = Number(product.stockByPresentation[presentation] || 0);
    const nextQty = type === 'entrada' ? current + Math.abs(quantity) : Math.max(0, current + quantity);
    product.stockByPresentation[presentation] = nextQty;

    const movement: InventoryMovement = {
      id: `MOV-${Date.now().toString().slice(-6)}`,
      productId: product.id,
      productName: product.name,
      presentation,
      type,
      quantity: type === 'entrada' ? Math.abs(quantity) : quantity,
      batchCode: cleanStr(req.body?.batchCode, 40) || `LOT-${new Date().toISOString().slice(0, 10)}`,
      note: cleanStr(req.body?.note, 220),
      date: cleanStr(req.body?.date, 20) || new Date().toISOString().slice(0, 10),
    };
    platformDb.movements.unshift(movement);
    savePlatformData();
    res.status(201).json({ movement, product });
  });

  // Sales & auto stock deduction
  app.post('/api/admin/sales', requireTeacherAuth, (req: Request, res: Response) => {
    const productId = cleanStr(req.body?.productId, 40);
    const presentation = cleanStr(req.body?.presentation, 60);
    const quantity = Math.floor(cleanPositiveNum(req.body?.quantity, 0));
    const clientId = cleanStr(req.body?.clientId, 40);
    const product = platformDb.products.find((p) => p.id === productId);
    if (!product || !presentation || quantity <= 0) {
      res.status(400).json({ error: 'Verifica producto, presentación y cantidad mayor a cero.' });
      return;
    }
    const currentStock = Number(product.stockByPresentation[presentation] || 0);
    if (currentStock < quantity) {
      res.status(400).json({
        error: `Stock insuficiente para ${product.name} (${presentation}). Disponible: ${currentStock}. Registra una entrada de inventario primero.`,
      });
      return;
    }
    const client = platformDb.clients.find((c) => c.id === clientId);
    const clientName = client ? client.name : cleanStr(req.body?.clientName, 120) || 'Cliente general';
    const clientPhone = cleanStr(req.body?.clientPhone, 30) || (client ? client.phone : '');
    const unitPrice =
      req.body?.unitPrice !== undefined
        ? cleanPositiveNum(req.body.unitPrice, product.prices[presentation] || 0)
        : Number(product.prices[presentation] || 0);

    const methods = ['Efectivo', 'SINPE Móvil', 'Transferencia', 'Crédito interno'] as const;
    const rawMethod = cleanStr(req.body?.paymentMethod, 30);
    const paymentMethod = methods.includes(rawMethod as (typeof methods)[number])
      ? (rawMethod as Sale['paymentMethod'])
      : 'Efectivo';

    const date = cleanStr(req.body?.date, 20) || new Date().toISOString().slice(0, 10);
    const seq = String(platformDb.sales.length + 1).padStart(3, '0');
    const receiptNumber = `REC-2027-${seq}`;

    product.stockByPresentation[presentation] = currentStock - quantity;

    const sale: Sale = {
      id: `VEN-${Date.now().toString().slice(-6)}`,
      receiptNumber,
      date,
      clientId: client ? client.id : 'GENERAL',
      clientName,
      clientPhone,
      productId: product.id,
      productName: product.name,
      presentation,
      quantity,
      unitPrice,
      total: quantity * unitPrice,
      paymentMethod,
      notes: cleanStr(req.body?.notes, 250),
    };

    const movement: InventoryMovement = {
      id: `MOV-${Date.now().toString().slice(-6)}`,
      productId: product.id,
      productName: product.name,
      presentation,
      type: 'venta',
      quantity: -quantity,
      batchCode: receiptNumber,
      note: `Venta a ${clientName}`,
      date,
    };

    platformDb.sales.unshift(sale);
    platformDb.movements.unshift(movement);
    savePlatformData();
    res.status(201).json({ sale, product, movement });
  });

  // Operating Expenses
  app.post('/api/admin/expenses', requireTeacherAuth, (req: Request, res: Response) => {
    const description = cleanStr(req.body?.description, 200);
    const amount = cleanPositiveNum(req.body?.amount, 0);
    if (!description || amount <= 0) {
      res.status(400).json({ error: 'Ingresa descripción y monto mayor a cero.' });
      return;
    }
    const categories = [
      'Sacos y empaques',
      'Etiquetas e impresión',
      'Insumos de huerta',
      'Botellas y limpieza',
      'Herramientas',
      'Otro',
    ] as const;
    const rawCat = cleanStr(req.body?.category, 40);
    const category = categories.includes(rawCat as (typeof categories)[number])
      ? (rawCat as OperatingExpense['category'])
      : 'Otro';

    const expense: OperatingExpense = {
      id: `GAS-${Date.now().toString().slice(-6)}`,
      date: cleanStr(req.body?.date, 20) || new Date().toISOString().slice(0, 10),
      category,
      description,
      amount,
      supplier: cleanStr(req.body?.supplier, 120) || 'Proveedor local',
    };
    platformDb.expenses.unshift(expense);
    savePlatformData();
    res.status(201).json(expense);
  });

  app.delete('/api/admin/expenses/:id', requireTeacherAuth, (req: Request, res: Response) => {
    platformDb.expenses = platformDb.expenses.filter((e) => e.id !== req.params.id);
    savePlatformData();
    res.json({ ok: true });
  });

  // Production Batches
  app.post('/api/admin/batches', requireTeacherAuth, (req: Request, res: Response) => {
    const productId = cleanStr(req.body?.productId, 40);
    const presentation = cleanStr(req.body?.presentation, 60);
    const quantity = Math.floor(cleanPositiveNum(req.body?.quantity, 0));
    const product = platformDb.products.find((p) => p.id === productId);
    if (!product || !presentation || quantity <= 0) {
      res.status(400).json({ error: 'Completa producto, presentación y cantidad del lote.' });
      return;
    }
    const batch: ProductionBatch = {
      id: `LOT-${Date.now().toString().slice(-6)}`,
      batchCode: cleanStr(req.body?.batchCode, 40) || `LOT-${product.code}-${Date.now().toString().slice(-4)}`,
      productId: product.id,
      productName: product.name,
      presentation,
      quantity,
      startDate: cleanStr(req.body?.startDate, 20) || new Date().toISOString().slice(0, 10),
      readinessDate: cleanStr(req.body?.readinessDate, 20) || new Date().toISOString().slice(0, 10),
      responsible: cleanStr(req.body?.responsible, 120) || platformDb.settings.teacherName,
      qualityPassed: Boolean(req.body?.qualityPassed),
      safetyChecked: Boolean(req.body?.safetyChecked),
      notes: cleanStr(req.body?.notes, 250),
    };
    platformDb.batches.unshift(batch);
    savePlatformData();
    res.status(201).json(batch);
  });

  app.patch('/api/admin/batches/:id', requireTeacherAuth, (req: Request, res: Response) => {
    const batch = platformDb.batches.find((b) => b.id === req.params.id);
    if (!batch) {
      res.status(404).json({ error: 'Lote no encontrado.' });
      return;
    }
    if (typeof req.body?.qualityPassed === 'boolean') batch.qualityPassed = req.body.qualityPassed;
    if (typeof req.body?.safetyChecked === 'boolean') batch.safetyChecked = req.body.safetyChecked;
    savePlatformData();
    res.json(batch);
  });

  // Sowings
  app.post('/api/admin/sowings', requireTeacherAuth, (req: Request, res: Response) => {
    const cropId = cleanStr(req.body?.cropId, 40);
    const cropName = cleanStr(req.body?.cropName, 80);
    const bed = cleanStr(req.body?.bed, 80);
    if (!cropId || !cropName || !bed) {
      res.status(400).json({ error: 'Selecciona cultivo y era de siembra.' });
      return;
    }
    const sowing: Sowing = {
      id: `SIE-${Date.now().toString().slice(-6)}`,
      cropId,
      cropName,
      bed,
      startDate: cleanStr(req.body?.startDate, 20) || new Date().toISOString().slice(0, 10),
      plants: Math.max(1, Math.floor(cleanPositiveNum(req.body?.plants, 10))),
      notes: cleanStr(req.body?.notes, 250),
      completedTasks: [],
    };
    platformDb.sowings.unshift(sowing);
    savePlatformData();
    res.status(201).json(sowing);
  });

  app.patch('/api/admin/sowings/:id/tasks', requireTeacherAuth, (req: Request, res: Response) => {
    const sowing = platformDb.sowings.find((s) => s.id === req.params.id);
    if (!sowing) {
      res.status(404).json({ error: 'Siembra no encontrada.' });
      return;
    }
    const taskId = cleanStr(req.body?.taskId, 40);
    if (!taskId) {
      res.status(400).json({ error: 'Tarea inválida.' });
      return;
    }
    if (sowing.completedTasks.includes(taskId)) {
      sowing.completedTasks = sowing.completedTasks.filter((t) => t !== taskId);
    } else {
      sowing.completedTasks.push(taskId);
    }
    savePlatformData();
    res.json(sowing);
  });

  app.delete('/api/admin/sowings/:id', requireTeacherAuth, (req: Request, res: Response) => {
    platformDb.sowings = platformDb.sowings.filter((s) => s.id !== req.params.id);
    savePlatformData();
    res.json({ ok: true });
  });

  // Field Logs
  app.post('/api/admin/field-logs', requireTeacherAuth, (req: Request, res: Response) => {
    const observation = cleanStr(req.body?.observation, 350);
    if (!observation) {
      res.status(400).json({ error: 'Escribe la observación de campo.' });
      return;
    }
    const entry: FieldLog = {
      id: `BIT-${Date.now().toString().slice(-6)}`,
      date: cleanStr(req.body?.date, 20) || new Date().toISOString().slice(0, 10),
      studentName: cleanStr(req.body?.studentName, 100) || platformDb.settings.teacherName,
      cropOrArea: cleanStr(req.body?.cropOrArea, 100) || 'Huerta escolar',
      observation,
      actionTaken: cleanStr(req.body?.actionTaken, 250),
    };
    platformDb.fieldLogs.unshift(entry);
    savePlatformData();
    res.status(201).json(entry);
  });

  app.delete('/api/admin/field-logs/:id', requireTeacherAuth, (req: Request, res: Response) => {
    platformDb.fieldLogs = platformDb.fieldLogs.filter((l) => l.id !== req.params.id);
    savePlatformData();
    res.json({ ok: true });
  });

  // Settings & Brand Logos
  app.put('/api/admin/settings', requireTeacherAuth, (req: Request, res: Response) => {
    const b = req.body || {};
    const cur = platformDb.settings;
    const next: PlatformSettings = {
      schoolName: cleanStr(b.schoolName, 140) || cur.schoolName,
      enterpriseName: cleanStr(b.enterpriseName, 80) || cur.enterpriseName,
      locationLabel: cleanStr(b.locationLabel, 120) || cur.locationLabel,
      slogan: cleanStr(b.slogan, 160) || cur.slogan,
      teacherName: cleanStr(b.teacherName, 100) || cur.teacherName,
      reinvestPercent:
        b.reinvestPercent !== undefined ? Math.min(100, Math.max(0, cleanPositiveNum(b.reinvestPercent, 30))) : cur.reinvestPercent,
      catalogUrl: cleanStr(b.catalogUrl, 250) || cur.catalogUrl,
      ctpLogoUrl: typeof b.ctpLogoUrl === 'string' && isSafeImageSrc(b.ctpLogoUrl) ? b.ctpLogoUrl.trim() : cur.ctpLogoUrl,
      banderaLogoUrl:
        typeof b.banderaLogoUrl === 'string' && isSafeImageSrc(b.banderaLogoUrl) ? b.banderaLogoUrl.trim() : cur.banderaLogoUrl,
      ecotronLogoUrl:
        typeof b.ecotronLogoUrl === 'string' && isSafeImageSrc(b.ecotronLogoUrl) ? b.ecotronLogoUrl.trim() : cur.ecotronLogoUrl,
    };
    platformDb.settings = next;
    savePlatformData();
    res.json(next);
  });

  // Custom Huerta Reminders & Alarms
  app.post('/api/admin/reminders', requireTeacherAuth, (req: Request, res: Response) => {
    const title = cleanStr(req.body?.title, 140);
    const date = cleanStr(req.body?.date, 20) || new Date().toISOString().slice(0, 10);
    if (!title) {
      res.status(400).json({ error: 'Escribe qué tarea o alarma deseas recordar.' });
      return;
    }
    const validCats = ['riego', 'producto', 'siembra', 'compost', 'otro'] as const;
    const rawCat = cleanStr(req.body?.category, 20);
    const category = validCats.includes(rawCat as (typeof validCats)[number])
      ? (rawCat as CustomReminder['category'])
      : 'otro';
    const rem: CustomReminder = {
      id: `REM-${Date.now().toString().slice(-6)}`,
      date,
      title,
      category,
      area: cleanStr(req.body?.area, 80) || 'Huerta escolar',
      instructions: cleanStr(req.body?.instructions, 320),
      done: false,
    };
    platformDb.customReminders.unshift(rem);
    savePlatformData();
    res.status(201).json(rem);
  });

  app.patch('/api/admin/reminders/:id', requireTeacherAuth, (req: Request, res: Response) => {
    const rem = platformDb.customReminders.find((r) => r.id === req.params.id);
    if (!rem) {
      res.status(404).json({ error: 'Recordatorio no encontrado.' });
      return;
    }
    if (typeof req.body?.done === 'boolean') rem.done = req.body.done;
    savePlatformData();
    res.json(rem);
  });

  app.delete('/api/admin/reminders/:id', requireTeacherAuth, (req: Request, res: Response) => {
    platformDb.customReminders = platformDb.customReminders.filter((r) => r.id !== req.params.id);
    savePlatformData();
    res.json({ ok: true });
  });

  // Reset accounting / demo records to zero (Teacher)
  app.post('/api/admin/reset', requireTeacherAuth, (req: Request, res: Response) => {
    const b = req.body || {};
    if (b.resetSales !== false) platformDb.sales = [];
    if (b.resetExpenses !== false) platformDb.expenses = [];
    if (b.resetMovements !== false) platformDb.movements = [];
    if (b.resetBatches !== false) platformDb.batches = [];
    if (b.resetClients === true) platformDb.clients = [];
    if (b.resetSowings === true) platformDb.sowings = [];
    if (b.resetLogs === true) platformDb.fieldLogs = [];
    if (b.resetStock === true) {
      platformDb.products = platformDb.products.map((p) => {
        const zeroStock: Record<string, number> = {};
        for (const k of Object.keys(p.prices || {})) {
          zeroStock[k] = 0;
        }
        return { ...p, stockByPresentation: zeroStock };
      });
    }
    savePlatformData();
    res.json(platformDb);
  });

  // JSON Backup Restore
  app.post('/api/admin/backup/restore', requireTeacherAuth, (req: Request, res: Response) => {
    const data = req.body as Partial<PlatformData>;
    if (!data || !Array.isArray(data.products) || !data.settings) {
      res.status(400).json({ error: 'El archivo de respaldo JSON no tiene la estructura válida de ECOTRON.' });
      return;
    }
    const fallback = createInitialPlatformData();
    platformDb = {
      products: data.products,
      clients: Array.isArray(data.clients) ? data.clients : [],
      movements: Array.isArray(data.movements) ? data.movements : [],
      sales: Array.isArray(data.sales) ? data.sales : [],
      expenses: Array.isArray(data.expenses) ? data.expenses : [],
      batches: Array.isArray(data.batches) ? data.batches : [],
      sowings: Array.isArray(data.sowings) ? data.sowings : [],
      fieldLogs: Array.isArray(data.fieldLogs) ? data.fieldLogs : [],
      customReminders: Array.isArray(data.customReminders) ? data.customReminders : [],
      settings: { ...fallback.settings, ...data.settings },
    };
    savePlatformData();
    res.json(platformDb);
  });

  // API 404 fallback
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Ruta API no encontrada.' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ECOTRON CTP Tronadora server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start ECOTRON server:', err);
  process.exit(1);
});
