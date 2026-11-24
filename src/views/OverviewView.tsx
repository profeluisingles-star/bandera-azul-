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
    <div className="space-y-8">
      {/* Split Editorial Hero */}
      <section className="overflow-hidden rounded-2xl border border-[#D9E2D7] bg-white shadow-xs">
        <div className="grid items-stretch lg:grid-cols-12">
          {/* Left Narrative & Primary Actions */}
          <div className="flex flex-col justify-between p-6 sm:p-10 lg:col-span-7">
            <div className="space-y-5">
              <LogoStrip settings={settings} />

              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#4B6153]">
                <span className="font-semibold text-[#14532D]">{settings.enterpriseName}</span>
                <span aria-hidden="true">·</span>
                <span>{settings.locationLabel}</span>
                <span aria-hidden="true">·</span>
                <span>Bandera Azul Ecológica</span>
              </div>

              <h1 className="font-display max-w-2xl text-3xl font-bold leading-[1.12] text-[#14241B] sm:text-4xl lg:text-[2.65rem]">
                Huerta agroecológica escolar y economía circular desde cero
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-[#33473B]">
                {settings.slogan} Aprende a sembrar paso a paso con alarmas reales para{' '}
                <strong className="font-semibold text-[#14532D]">{settings.locationLabel}</strong> y aprovecha nuestros{' '}
                <strong>sacos agrícolas</strong> y <strong>botellas reutilizadas</strong> en la empresa estudiantil{' '}
                {settings.enterpriseName}.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('aprende')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#14532D] px-5 py-3 text-sm font-semibold whitespace-nowrap text-white shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#166534]"
              >
                <BookOpen className="h-4 w-4" />
                Aprende con {settings.teacherName}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('catalogo')}
                className="inline-flex items-center gap-2 rounded-xl border border-[#C8D6CB] bg-[#F5F6F2] px-5 py-3 text-sm font-semibold whitespace-nowrap text-[#14241B] transition-colors duration-150 hover:bg-[#E7ECE5]"
              >
                <Package className="h-4 w-4 text-[#14532D]" />
                Explorar catálogo
              </button>
              {isTeacher ? (
                <button
                  type="button"
                  onClick={() => onNavigate('docente')}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#14532D]/30 bg-[#EAF3EC] px-4 py-3 text-sm font-semibold whitespace-nowrap text-[#14532D] transition-colors duration-150 hover:bg-[#DCFCE7]"
                >
                  <Unlock className="h-4 w-4" />
                  Gestión Docente
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="inline-flex items-center gap-2 px-3 py-3 text-sm font-semibold whitespace-nowrap text-[#4B6153] transition-colors duration-150 hover:text-[#14532D]"
                >
                  <Lock className="h-4 w-4" />
                  Acceso docente
                </button>
              )}
            </div>
          </div>

          {/* Right Full-Bleed Tilaran Garden Photography + Scrim Climate Card */}
          <div className="relative min-h-[290px] bg-[#14241B] lg:col-span-5 lg:min-h-[420px]">
            <img
              src="/src/assets/images/hero_tilaran_huerta_1795456306014.jpg"
              alt="Huerta agroecológica estudiantil en las montañas de Tilarán, Guanacaste"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 space-y-3 p-6 text-white">
              <div className="text-xs font-semibold text-[#BBF7D0]">
                Perfil climático · {TILARAN_CLIMATE_PROFILE.zone}
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="rounded-xl bg-black/45 p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Wind className="h-3.5 w-3.5 text-[#7DD3FC]" />
                    Alisios (Nov – Abr)
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/85">
                    Barreras rompevientos, mulch seco y tutores firmes en tomate y chile.
                  </p>
                </div>
                <div className="rounded-xl bg-black/45 p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <CloudRain className="h-3.5 w-3.5 text-[#86EFAC]" />
                    Lluvias (May – Oct)
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/85">
                    Lomillos altos de 20–30 cm, drenajes y techo en almácigos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-Width 4-Column KPI Strip */}
      <section className="grid divide-y divide-[#E2E8E0] overflow-hidden rounded-2xl border border-[#D9E2D7] bg-white sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        <div className="p-5">
          <div className="text-xs font-medium text-[#4B6153]">Catálogo ECOTRON</div>
          <div className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[#14241B]">
            {products.length} productos
          </div>
          <div className="mt-1 text-xs font-medium text-[#166534]">
            {activeProducts.length} habilitados para venta directa
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-[#4B6153]">Empaques circulares</div>
          <div className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[#14241B]">
            {sacosProducts.length} sacos · {bottleProducts.length} botellas
          </div>
          <div className="mt-1 text-xs text-[#4B6153]">
            Stock actual: <span className="font-mono font-semibold tabular-nums">{totalUnits} u.</span>
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-[#4B6153]">Huerta de Tilarán</div>
          <div className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[#14241B]">
            {TILARAN_CROPS.length} guías · {sowings.length} activas
          </div>
          <div className="mt-1 text-xs text-[#4B6153]">
            Culanto, tomate, rábano, chile y más
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-[#4B6153]">Control Docente</div>
          <div className="mt-1.5 flex items-center gap-2 text-xl font-bold text-[#14241B]">
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
            {isTeacher ? 'Edición completa y comprobantes WhatsApp' : 'Solo lectura educativa; gestión privada'}
          </div>
        </div>
      </section>

      {/* Featured Collection + Craftsmanship Photography */}
      <section className="grid items-stretch gap-6 lg:grid-cols-12">
        <div className="flex flex-col overflow-hidden rounded-2xl border border-[#D9E2D7] bg-white lg:col-span-4">
          <div className="aspect-[4/3] w-full overflow-hidden bg-[#EEF2EC]">
            <img
              src="/src/assets/images/empaques_sacos_botellas_1795456305852.jpg"
              alt="Sacos agrícolas con compostaje orgánico y botellas reutilizadas con biofertilizante ECOTRON"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col justify-between p-6">
            <div>
              <div className="text-xs font-semibold text-[#166534]">Especialización en compostaje y sacos</div>
              <h2 className="font-display mt-1.5 text-xl font-bold text-[#14241B]">
                4 líneas de abono orgánico seguro
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#4B6153]">
                Nos especializamos en <strong>compost vegetal maduro</strong>, <strong>lombricompost</strong>,{' '}
                <strong>compost de boñiga/gallinaza verificada</strong> y <strong>bokashi</strong> en sacos de 10, 25 y
                45 kg, junto a botellas reutilizadas con triple lavado.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate('compost')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#14532D] hover:underline"
              >
                Ver guía de compost <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('catalogo')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4B6153] hover:text-[#14532D] hover:underline"
              >
                Catálogo
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#D9E2D7] bg-white p-6 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7EDE5] pb-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#14241B]">Productos destacados</h2>
              <p className="mt-0.5 text-xs text-[#4B6153]">
                Haz clic en cualquier insumo para abrir su ficha técnica, dosis, afiche imprimible y código QR.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('catalogo')}
              className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold whitespace-nowrap text-[#14532D] hover:underline"
            >
              Ver todos ({products.length}) <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
            {(() => {
              const priorityOrder = ['HR-FLO', 'HR-CUL', 'HR-RAB', 'HR-TRA', 'HR-FER', 'ECO-COM'];
              const prioritized = priorityOrder
                .map((id) => products.find((item) => item.id === id))
                .filter((item): item is Product => Boolean(item));
              const used = new Set(prioritized.map((item) => item.id));
              const featured = [...prioritized, ...products.filter((item) => !used.has(item.id))].slice(0, 6);
              return featured;
            })().map((p) => {
              const firstEntry = Object.entries(p.prices)[0];
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectProduct(p)}
                  className="group flex items-center gap-3.5 rounded-xl border border-[#E2E8E0] bg-[#FAFBF9] p-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-[#14532D]/40 hover:bg-white hover:shadow-sm"
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="h-16 w-16 shrink-0 rounded-lg border border-[#E2E8E0] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium text-[#4B6153]">
                      <span className="font-mono font-semibold text-[#14532D]">{p.code}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{p.category}</span>
                    </div>
                    <div className="mt-0.5 truncate text-sm font-bold text-[#14241B] group-hover:text-[#14532D]">
                      {p.name}
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-xs text-[#4B6153]">
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
      </section>

      {/* Bottom 2-Column Rhythm: Active Sowings & Field Notes */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#D9E2D7] bg-white p-6">
          <div className="flex items-center justify-between border-b border-[#E7EDE5] pb-3.5">
            <div className="flex items-center gap-2">
              <Sprout className="h-4 w-4 text-[#166534]" />
              <h2 className="font-display text-xl font-bold text-[#14241B]">Siembras y alarmas activas</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('plan')}
              className="text-xs font-bold whitespace-nowrap text-[#14532D] hover:underline"
            >
              Calendario y alarmas
            </button>
          </div>
          <div className="mt-4 divide-y divide-[#EDF1EC]">
            {sowings.slice(0, 3).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 py-3 text-xs">
                <div>
                  <div className="font-bold text-[#14241B]">{s.cropName}</div>
                  <div className="mt-0.5 text-[#4B6153]">
                    {s.bed} · Inicio {formatDateCR(s.startDate)}
                  </div>
                </div>
                <span className="font-mono font-semibold tabular-nums text-[#14532D]">{s.plants} plantas</span>
              </div>
            ))}
            {sowings.length === 0 && (
              <p className="py-4 text-xs text-[#4B6153]">No hay siembras registradas todavía.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#D9E2D7] bg-white p-6">
          <div className="flex items-center justify-between border-b border-[#E7EDE5] pb-3.5">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#166534]" />
              <h2 className="font-display text-xl font-bold text-[#14241B]">Últimas notas de campo</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('aprende')}
              className="text-xs font-bold whitespace-nowrap text-[#14532D] hover:underline"
            >
              Bitácora completa
            </button>
          </div>
          <div className="mt-4 divide-y divide-[#EDF1EC]">
            {fieldLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="py-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#14241B]">{log.cropOrArea}</span>
                  <span className="font-mono tabular-nums text-[#4B6153]">{formatDateCR(log.date)}</span>
                </div>
                <p className="mt-1 line-clamp-2 leading-relaxed text-[#4B6153]">{log.observation}</p>
              </div>
            ))}
            {fieldLogs.length === 0 && (
              <p className="py-4 text-xs text-[#4B6153]">Aún no hay observaciones registradas en la bitácora.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
