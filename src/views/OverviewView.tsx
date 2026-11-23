import {
  ArrowRight,
  BookOpen,
  Calendar,
  CloudRain,
  Lock,
  Package,
  ShieldCheck,
  Sprout,
  Unlock,
  Wind,
} from 'lucide-react';
import { TILARAN_CLIMATE_PROFILE, TILARAN_CROPS } from '../data/agronomyData.ts';
import type { FieldLog, PlatformSettings, Product, Sowing } from '../types.ts';
import { formatCRC, formatDateCR, totalProductStock } from '../utils/format.ts';
import { LogoStrip } from '../components/LogoStrip.tsx';

export type AppSection =
  | 'inicio'
  | 'aprende'
  | 'cultivos'
  | 'catalogo'
  | 'compost'
  | 'plan'
  | 'docente';

interface OverviewViewProps {
  settings: PlatformSettings;
  products: Product[];
  sowings: Sowing[];
  fieldLogs: FieldLog[];
  isTeacher: boolean;
  onNavigate: (section: AppSection) => void;
  onOpenAuth: () => void;
  onSelectProduct: (product: Product) => void;
}

export function OverviewView({
  settings,
  products,
  sowings,
  fieldLogs,
  isTeacher,
  onNavigate,
  onOpenAuth,
  onSelectProduct,
}: OverviewViewProps) {
  const activeProducts = products.filter((p) => p.status === 'activo');
  const sacosProducts = products.filter((p) =>
    Object.keys(p.prices).some((k) => k.toLowerCase().includes('saco'))
  );
  const bottleProducts = products.filter((p) =>
    Object.keys(p.prices).some((k) => k.toLowerCase().includes('botella'))
  );
  const totalUnits = products.reduce((sum, p) => sum + totalProductStock(p), 0);

  return (
    <div className="space-y-6">
      {/* Institutional Hero */}
      <section className="rounded-xl border border-[#DCE5DD] bg-white p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-3">
            <LogoStrip settings={settings} />
            <h1 className="pt-1 text-2xl font-extrabold tracking-tight text-[#14241B] sm:text-3xl">
              Plataforma Agroecológica Escolar y Empresa Estudiantil {settings.enterpriseName}
            </h1>
            <p className="text-sm leading-relaxed text-[#33473B] sm:text-base">
              {settings.slogan} Espacio integrado para aprender agricultura adaptada a{' '}
              <strong className="font-semibold text-[#14532D]">{settings.locationLabel}</strong>, cuidar la huerta del
              colegio y gestionar la producción y venta en <strong>sacos</strong> y{' '}
              <strong>botellas plásticas reutilizadas</strong>.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('aprende')}
                className="inline-flex items-center gap-2 rounded-lg bg-[#14532D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#166534]"
              >
                <BookOpen className="h-4 w-4" />
                Aprende con {settings.teacherName}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('catalogo')}
                className="inline-flex items-center gap-2 rounded-lg border border-[#C8D6CB] bg-[#F7FAF7] px-4 py-2.5 text-sm font-semibold text-[#14241B] hover:bg-[#EBF3EC]"
              >
                <Package className="h-4 w-4 text-[#166534]" />
                Ver catálogo comercial
              </button>
              {isTeacher ? (
                <button
                  type="button"
                  onClick={() => onNavigate('docente')}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#14532D] bg-[#EAF3EC] px-4 py-2.5 text-sm font-semibold text-[#14532D] hover:bg-[#DCFCE7]"
                >
                  <Unlock className="h-4 w-4" />
                  Ir a Gestión Docente
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#C8D6CB] bg-white px-4 py-2.5 text-sm font-semibold text-[#33473B] hover:bg-[#F3F6F3]"
                >
                  <Lock className="h-4 w-4" />
                  Iniciar sesión docente
                </button>
              )}
            </div>
          </div>

          {/* Tilaran Climate Snapshot Card */}
          <div className="w-full rounded-xl border border-[#DCE5DD] bg-[#F7FAF7] p-4 lg:max-w-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-[#166534]">
              Condiciones de Tilarán, Guanacaste
            </div>
            <div className="mt-1 text-xs text-[#4B6153]">{TILARAN_CLIMATE_PROFILE.zone}</div>
            <div className="mt-3 space-y-2.5">
              <div className="flex items-start gap-2.5 rounded-lg border border-[#DCE5DD] bg-white p-2.5">
                <Wind className="mt-0.5 h-4 w-4 shrink-0 text-[#0284C7]" />
                <div className="text-xs">
                  <div className="font-semibold text-[#14241B]">Vientos alisios (Nov – Abr)</div>
                  <div className="text-[#4B6153]">
                    Usar barreras rompevientos, acolchado (mulch) y tutores firmes en tomate y chile.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2.5 rounded-lg border border-[#DCE5DD] bg-white p-2.5">
                <CloudRain className="mt-0.5 h-4 w-4 shrink-0 text-[#15803D]" />
                <div className="text-xs">
                  <div className="font-semibold text-[#14241B]">Época lluviosa (May – Oct)</div>
                  <div className="text-[#4B6153]">
                    Construir lomillos altos (20–30 cm), drenajes y techo en tomate/almácigos.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Strip */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#DCE5DD] bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#4B6153]">
            Catálogo ECOTRON
          </div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#14241B]">
            {products.length} productos
          </div>
          <div className="mt-1 text-xs text-[#166534]">
            {activeProducts.length} habilitados para venta directa
          </div>
        </div>
        <div className="rounded-xl border border-[#DCE5DD] bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#4B6153]">
            Empaques circulares
          </div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#14241B]">
            {sacosProducts.length} sacos · {bottleProducts.length} botellas
          </div>
          <div className="mt-1 text-xs text-[#4B6153]">
            Stock total registrado: <span className="font-mono tabular-nums">{totalUnits} u.</span>
          </div>
        </div>
        <div className="rounded-xl border border-[#DCE5DD] bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#4B6153]">
            Cultivos de Tilarán
          </div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#14241B]">
            {TILARAN_CROPS.length} guías · {sowings.length} activas
          </div>
          <div className="mt-1 text-xs text-[#4B6153]">
            Incluye tomate, culantro, rábano, chile y más
          </div>
        </div>
        <div className="rounded-xl border border-[#DCE5DD] bg-white p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#4B6153]">
            Control Docente
          </div>
          <div className="mt-1 flex items-center gap-2 text-lg font-bold text-[#14241B]">
            {isTeacher ? (
              <>
                <ShieldCheck className="h-5 w-5 text-[#16A34A]" />
                <span>Sesión activa</span>
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 text-[#4B6153]" />
                <span>Protegido</span>
              </>
            )}
          </div>
          <div className="mt-1 text-xs text-[#4B6153]">
            {isTeacher
              ? 'Acceso completo habilitado en toda la plataforma'
              : 'Solo lectura educativa; gestión protegida con clave'}
          </div>
        </div>
      </section>

      {/* Main 2-column grid */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Featured Commercial Products */}
        <div className="rounded-xl border border-[#DCE5DD] bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-[#E6EFE7] pb-3">
            <div>
              <h2 className="text-lg font-bold text-[#14241B]">
                Productos destacados en Sacos y Botellas Reutilizadas
              </h2>
              <p className="text-xs text-[#4B6153]">
                Abonos sólidos en sacos de 10/25/45 kg y bioinsumos/caldos en botellas PET limpias y rotuladas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('catalogo')}
              className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#14532D] hover:underline"
            >
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {products.slice(0, 6).map((p) => {
              const firstEntry = Object.entries(p.prices)[0];
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectProduct(p)}
                  className="flex items-center gap-3 rounded-xl border border-[#DCE5DD] bg-[#FAFBF9] p-3 text-left transition-colors hover:border-[#166534] hover:bg-[#F2F8F3]"
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-14 w-14 shrink-0 rounded-lg border border-[#DCE5DD] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#166534]">
                      {p.code} · {p.category}
                    </div>
                    <div className="truncate text-sm font-bold text-[#14241B]">{p.name}</div>
                    <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-[#4B6153]">
                      <span className="truncate">{firstEntry ? firstEntry[0] : p.pack}</span>
                      {firstEntry && (
                        <span className="font-mono font-bold tabular-nums text-[#14532D]">
                          {formatCRC(firstEntry[1])}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Sowings & Recent Bitácora */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[#DCE5DD] bg-white p-5">
            <div className="flex items-center justify-between border-b border-[#E6EFE7] pb-3">
              <div className="flex items-center gap-2">
                <Sprout className="h-4 w-4 text-[#166534]" />
                <h2 className="text-base font-bold text-[#14241B]">Siembras activas</h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('plan')}
                className="text-xs font-bold text-[#14532D] hover:underline"
              >
                Calendario y alarmas
              </button>
            </div>
            <div className="mt-3 space-y-2.5">
              {sowings.slice(0, 3).map((s) => (
                <div
                  key={s.id}
                  className="rounded-lg border border-[#E6EFE7] bg-[#F8FAF8] px-3 py-2.5 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-[#14241B]">
                    <span>{s.cropName}</span>
                    <span className="font-mono tabular-nums text-[#4B6153]">{s.plants} plantas</span>
                  </div>
                  <div className="mt-0.5 text-[#4B6153]">
                    {s.bed} · Inicio {formatDateCR(s.startDate)}
                  </div>
                </div>
              ))}
              {sowings.length === 0 && (
                <p className="text-xs text-[#4B6153]">No hay siembras registradas todavía.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#DCE5DD] bg-white p-5">
            <div className="flex items-center justify-between border-b border-[#E6EFE7] pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#166534]" />
                <h2 className="text-base font-bold text-[#14241B]">Últimas notas de campo</h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('aprende')}
                className="text-xs font-bold text-[#14532D] hover:underline"
              >
                Bitácora
              </button>
            </div>
            <div className="mt-3 space-y-2.5">
              {fieldLogs.slice(0, 2).map((log) => (
                <div key={log.id} className="rounded-lg border border-[#E6EFE7] bg-[#F8FAF8] p-2.5 text-xs">
                  <div className="font-semibold text-[#14241B]">{log.cropOrArea}</div>
                  <p className="mt-0.5 line-clamp-2 text-[#4B6153]">{log.observation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
