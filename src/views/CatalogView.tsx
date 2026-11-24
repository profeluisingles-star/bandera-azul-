import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  Edit3,
  FlaskConical,
  Megaphone,
  Package,
  Search,
  Sparkles,
  Sprout,
} from 'lucide-react';
import { HUERTA_STARTER_IDS } from '../data/defaultCatalog.ts';
import type { PlatformSettings, Product } from '../types.ts';
import {
  buildStandaloneCatalogHtml,
  downloadTextFile,
  formatCRC,
  totalProductStock,
} from '../utils/format.ts';

interface CatalogViewProps {
  products: Product[];
  settings: PlatformSettings;
  isTeacher: boolean;
  onSelectProduct: (product: Product) => void;
  onEditInAdmin: (productId: string) => void;
}

type CatalogFilter = 'todos' | 'lanzamiento' | 'huerta' | 'sacos' | 'botellas' | 'venta';

const STARTER_SET = new Set<string>(HUERTA_STARTER_IDS);

export function CatalogView({
  products,
  settings,
  isTeacher,
  onSelectProduct,
  onEditInAdmin,
}: CatalogViewProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CatalogFilter>('todos');

  const starterProducts = useMemo(
    () =>
      products.filter(
        (p) => STARTER_SET.has(p.id) || p.marketingCategory.toLowerCase().includes('lanzamiento inicial')
      ),
    [products]
  );

  const huertaCatalogProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.id.startsWith('HR-') ||
          p.code.startsWith('HR-') ||
          p.marketingCategory.toLowerCase().includes('huerta') ||
          STARTER_SET.has(p.id)
      ),
    [products]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const packs = Object.keys(p.prices || {}).join(' ').toLowerCase();
      const isStarter =
        STARTER_SET.has(p.id) || p.marketingCategory.toLowerCase().includes('lanzamiento inicial');
      const isHuerta =
        p.id.startsWith('HR-') ||
        p.code.startsWith('HR-') ||
        p.marketingCategory.toLowerCase().includes('huerta') ||
        isStarter;

      if (filter === 'lanzamiento' && !isStarter) return false;
      if (filter === 'huerta' && !isHuerta) return false;
      if (filter === 'sacos' && !packs.includes('saco') && p.type !== 'solido') return false;
      if (filter === 'botellas' && !packs.includes('botella') && p.type !== 'liquido') return false;
      if (filter === 'venta' && p.status !== 'activo') return false;

      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.marketingCategory.toLowerCase().includes(q) ||
        p.slogan.toLowerCase().includes(q) ||
        p.purpose.toLowerCase().includes(q) ||
        p.dose.toLowerCase().includes(q) ||
        packs.includes(q)
      );
    });
  }, [products, search, filter]);

  function handleExportCatalogHtml() {
    const html = buildStandaloneCatalogHtml(products, settings);
    downloadTextFile('catalogo-ecotron-tronadora.html', html, 'text/html;charset=utf-8');
  }

  return (
    <div className="space-y-6">
      {/* Header & Packaging Highlight */}
      <div className="overflow-hidden rounded-2xl border border-[#D9E2D7] bg-white shadow-xs">
        <div className="grid items-stretch lg:grid-cols-12">
          <div className="p-6 sm:p-8 lg:col-span-8">
            <div className="text-xs font-semibold text-[#166534]">
              Catálogo Comercial y Fichas Técnicas · {settings.enterpriseName}
            </div>
            <h1 className="font-display mt-1.5 text-2xl font-bold text-[#14241B] sm:text-3xl">
              Catálogo para la Huerta, Sacos y Botellas Reutilizadas
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#33473B]">
              Incluimos los <strong>12 productos de huerta escolar</strong> (con prioridad de arranque en 4 líneas más{' '}
              <strong>fertilizante líquido extra</strong>) junto a nuestros <strong>sacos de 10, 25 y 45 kg</strong> y{' '}
              <strong>botellas reutilizadas con triple lavado</strong>.
            </p>

            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#F3D28A] bg-[#FEF9EC] p-3.5 text-xs text-[#78350F]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]" />
              <span>
                <strong>Regla Bandera Azul para botellas reutilizadas:</strong> Toda botella debe pasar por triple lavado,
                secado, <strong>retiro completo de etiquetas de bebidas</strong> y colocación de etiqueta ECOTRON con lote y
                aviso agrícola.
              </span>
            </div>
          </div>

          <div className="relative hidden min-h-[210px] bg-[#EEF2EC] lg:col-span-4 lg:block">
            <img
              src="/src/assets/images/empaques_sacos_botellas_1795456305852.jpg"
              alt="Presentaciones en sacos agrícolas y botellas reutilizadas"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 right-4">
              <button
                type="button"
                onClick={handleExportCatalogHtml}
                className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-3.5 py-2 text-xs font-semibold whitespace-nowrap text-[#14241B] shadow-sm transition-colors hover:bg-white"
              >
                <Download className="h-3.5 w-3.5 text-[#14532D]" />
                Exportar catálogo HTML
              </button>
            </div>
          </div>
        </div>

        {/* Starter Launch Spotlight */}
        {starterProducts.length > 0 && (
          <div className="border-t border-[#E7EDE5] bg-[#F7FAF7] px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#14532D]">
                <Sprout className="h-4 w-4 text-[#166534]" />
                <span>
                  Lanzamiento inicial sugerido: 4 productos estrella + fertilizante líquido como extra
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFilter(filter === 'lanzamiento' ? 'todos' : 'lanzamiento')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#14532D] hover:underline"
              >
                {filter === 'lanzamiento' ? 'Ver todo el catálogo' : 'Filtrar solo lanzamiento'}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
              {starterProducts.map((item) => {
                const firstEntry = Object.entries(item.prices || {})[0];
                const isExtra = item.id === 'HR-FER';
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectProduct(item)}
                    className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-colors hover:border-[#14532D]/50 hover:bg-white ${
                      isExtra
                        ? 'border-[#C8DEC9] bg-[#EEF6EF]'
                        : 'border-[#D9E2D7] bg-white'
                    }`}
                  >
                    <div>
                      <div className="text-[11px] font-semibold text-[#166534]">
                        {isExtra ? 'Extra opcional' : item.code}
                      </div>
                      <div className="mt-0.5 text-xs font-bold text-[#14241B]">{item.name}</div>
                    </div>
                    {firstEntry && (
                      <div className="mt-2 flex items-baseline justify-between gap-2 border-t border-[#EDF1EC] pt-2">
                        <span className="truncate text-[11px] text-[#4B6153]">
                          {isExtra ? 'Individual / Extra' : 'Desde'}
                        </span>
                        <span className="font-mono text-xs font-bold tabular-nums text-[#14532D]">
                          {formatCRC(firstEntry[1])}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search & Segmented Filters */}
        <div className="flex flex-col gap-3 border-t border-[#E7EDE5] bg-[#FAFBF9] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4B6153]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar mata, culantro, rábano, trasplante, fertilizante, saco..."
              className="w-full rounded-xl border border-[#C8D6CB] bg-white py-2 pl-9 pr-3 text-sm text-[#14241B] focus:border-[#14532D] focus:outline-none focus:ring-2 focus:ring-[#14532D]/15"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-[#E7ECE5] p-1">
            {(
              [
                { id: 'todos', label: 'Todos' },
                { id: 'lanzamiento', label: 'Para empezar (4 + extra)' },
                { id: 'huerta', label: 'Huerta (12)' },
                { id: 'sacos', label: 'En sacos' },
                { id: 'botellas', label: 'En botellas' },
                { id: 'venta', label: 'En venta' },
              ] as const
            ).map((btn) => {
              const active = filter === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setFilter(btn.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                    active
                      ? 'bg-white text-[#14241B] shadow-xs'
                      : 'text-[#4B6153] hover:text-[#14241B]'
                  }`}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#D9E2D7] bg-white p-12 text-center">
          <Package className="mx-auto h-9 w-9 text-[#4B6153]" />
          <p className="mt-2.5 text-sm font-semibold text-[#14241B]">
            No hay productos que coincidan con tu búsqueda.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setFilter('todos');
            }}
            className="mt-4 rounded-xl bg-[#14532D] px-4 py-2 text-xs font-semibold text-white"
          >
            Ver todo el catálogo
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => {
            const totalStock = totalProductStock(product);
            const pricesList = Object.entries(product.prices || {});
            const statusText =
              product.status === 'activo'
                ? 'Disponible'
                : product.status === 'ensayo'
                  ? 'Ensayo escolar'
                  : 'Validación técnica';
            return (
              <article
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#D9E2D7] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-[#EEF2EC]">
                  <img
                    src={product.image}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-semibold text-white">
                    {product.status === 'activo' && <CheckCircle2 className="h-3.5 w-3.5 text-[#86EFAC]" />}
                    {product.status === 'ensayo' && <FlaskConical className="h-3.5 w-3.5 text-[#FDE68A]" />}
                    {product.status === 'desarrollo' && <Sparkles className="h-3.5 w-3.5 text-[#E2E8F0]" />}
                    <span>{statusText}</span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#4B6153]">
                    <span>
                      <span className="font-mono font-semibold text-[#14532D]">{product.code}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{product.category}</span>
                    </span>
                    <span className="font-mono tabular-nums">Stock: {totalStock} u.</span>
                  </div>

                  <h2 className="font-display mt-1.5 text-xl font-bold text-[#14241B]">{product.name}</h2>
                  <p className="mt-1 text-xs font-semibold text-[#166534]">{product.slogan}</p>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#4B6153]">{product.purpose}</p>

                  {/* Presentations & Prices */}
                  <div className="mt-4 flex-1 space-y-2 border-t border-[#E7EDE5] pt-3.5">
                    <div className="text-[11px] font-semibold text-[#4B6153]">Presentaciones y precios</div>
                    <div className="grid grid-cols-2 gap-2">
                      {pricesList.slice(0, 4).map(([pack, price]) => (
                        <div
                          key={pack}
                          className="rounded-xl border border-[#E7EDE5] bg-[#FAFBF9] px-3 py-2"
                        >
                          <div className="truncate text-[11px] text-[#4B6153]" title={pack}>
                            {pack}
                          </div>
                          <div className="font-mono text-xs font-bold tabular-nums text-[#14532D]">
                            {formatCRC(price)}
                          </div>
                        </div>
                      ))}
                    </div>
                    {pricesList.length > 4 && (
                      <div className="text-[11px] font-medium text-[#4B6153]">
                        +{pricesList.length - 4} presentación adicional en ficha
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#14532D] px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#166534]"
                    >
                      <Megaphone className="h-3.5 w-3.5" />
                      Ficha, Afiche y QR
                    </button>
                    {isTeacher && (
                      <button
                        type="button"
                        onClick={() => onEditInAdmin(product.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#C8D6CB] bg-[#F7FAF7] px-3 py-2 text-xs font-semibold text-[#14241B] hover:bg-[#EBF3EC]"
                        title="Editar precios, stock y estado"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Compact 12-Product Huerta Reference Table */}
      {huertaCatalogProducts.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-[#D9E2D7] bg-white shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7EDE5] bg-[#FAFBF9] px-6 py-4">
            <div>
              <h2 className="font-display text-lg font-bold text-[#14241B]">
                Resumen del catálogo de productos para la huerta ({huertaCatalogProducts.length} productos)
              </h2>
              <p className="mt-0.5 text-xs text-[#4B6153]">
                Haz clic en cualquier producto para abrir su ficha técnica o ajustar su precio desde Acceso Docente.
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-[#14532D]">
              Inicio sugerido: 4 líneas + Fertilizante extra
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#E7EDE5] bg-[#F7FAF7] text-[11px] font-bold uppercase tracking-wider text-[#4B6153]">
                  <th className="px-6 py-3">Producto</th>
                  <th className="px-4 py-3">Qué incluye</th>
                  <th className="px-6 py-3 text-right">Precio base</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF1EC]">
                {huertaCatalogProducts.map((item) => {
                  const firstEntry = Object.entries(item.prices || {})[0];
                  const isStarter = STARTER_SET.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectProduct(item)}
                      className="cursor-pointer transition-colors hover:bg-[#F5F9F5]"
                    >
                      <td className="px-6 py-3.5 align-top">
                        <div className="font-bold text-[#14241B]">{item.name}</div>
                        <div className="mt-0.5 font-mono text-[11px] text-[#166534]">
                          {item.code}
                          {isStarter ? ' · Lanzamiento inicial' : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-top leading-relaxed text-[#33473B]">
                        {item.purpose}
                      </td>
                      <td className="px-6 py-3.5 text-right align-top font-mono font-bold tabular-nums whitespace-nowrap text-[#14532D]">
                        {firstEntry ? formatCRC(firstEntry[1]) : '—'}
                        {item.prices && Object.keys(item.prices).length > 1 && (
                          <div className="mt-0.5 font-sans text-[11px] font-normal text-[#4B6153]">
                            +{Object.keys(item.prices).length - 1} opción
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

