export type ProductType = 'solido' | 'liquido' | 'kit';
export type ProductStatus = 'activo' | 'ensayo' | 'desarrollo';

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  type: ProductType;
  status: ProductStatus;
  pack: string;
  purpose: string;
  how: string;
  dose: string;
  caution: string;
  packagingNote: string;
  recipe: string;
  process: string[];
  reg: string;
  tech: string;
  tests: string;
  labelok: boolean;
  packok: boolean;
  image: string;
  slogan: string;
  prices: Record<string, number>;
  stockByPresentation: Record<string, number>;
  marketingCategory: string;
  infosteps: string[];
}

export interface Client {
  id: string;
  name: string;
  type: 'Docente' | 'Estudiante' | 'Familia / Comunidad' | 'Productor local' | 'Institución';
  phone: string;
  notes: string;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  presentation: string;
  type: 'entrada' | 'ajuste' | 'venta';
  quantity: number;
  batchCode: string;
  note: string;
  date: string;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  date: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  productId: string;
  productName: string;
  presentation: string;
  quantity: number;
  unitPrice: number;
  total: number;
  paymentMethod: 'Efectivo' | 'SINPE Móvil' | 'Transferencia' | 'Crédito interno';
  notes: string;
}

export interface OperatingExpense {
  id: string;
  date: string;
  category:
    | 'Sacos y empaques'
    | 'Etiquetas e impresión'
    | 'Insumos de huerta'
    | 'Botellas y limpieza'
    | 'Herramientas'
    | 'Otro';
  description: string;
  amount: number;
  supplier: string;
}

export interface ProductionBatch {
  id: string;
  batchCode: string;
  productId: string;
  productName: string;
  presentation: string;
  quantity: number;
  startDate: string;
  readinessDate: string;
  responsible: string;
  qualityPassed: boolean;
  safetyChecked: boolean;
  notes: string;
}

export interface Sowing {
  id: string;
  cropId: string;
  cropName: string;
  bed: string;
  startDate: string;
  plants: number;
  notes: string;
  completedTasks: string[];
}

export interface FieldLog {
  id: string;
  date: string;
  studentName: string;
  cropOrArea: string;
  observation: string;
  actionTaken: string;
}

export interface CustomReminder {
  id: string;
  date: string;
  title: string;
  category: 'riego' | 'producto' | 'siembra' | 'compost' | 'otro';
  area: string;
  instructions: string;
  done: boolean;
}

export interface PlatformSettings {
  schoolName: string;
  enterpriseName: string;
  locationLabel: string;
  slogan: string;
  teacherName: string;
  reinvestPercent: number;
  catalogUrl: string;
  ctpLogoUrl: string;
  banderaLogoUrl: string;
  ecotronLogoUrl: string;
}

export interface PlatformData {
  products: Product[];
  clients: Client[];
  movements: InventoryMovement[];
  sales: Sale[];
  expenses: OperatingExpense[];
  batches: ProductionBatch[];
  sowings: Sowing[];
  fieldLogs: FieldLog[];
  customReminders: CustomReminder[];
  settings: PlatformSettings;
}

export interface PublicPlatformData {
  products: Product[];
  sowings: Sowing[];
  fieldLogs: FieldLog[];
  customReminders: CustomReminder[];
  settings: PlatformSettings;
}

export interface AuthStatus {
  configured: boolean;
  envManaged: boolean;
  authenticated: boolean;
}
