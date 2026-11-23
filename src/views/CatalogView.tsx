import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Edit3,
  FlaskConical,
  Megaphone,
  Package,
  Search,
  Sparkles,
} from 'lucide-react';
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

type CatalogFilter = 'todos' | 'sacos' | 'botellas' | 'kits' | 'venta';

export function CatalogView({
  products,
  settings,
  isTeacher,
  onSelectProduct,
  onEditInAdmin,
}: CatalogViewProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CatalogFilter>('todos');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const packs = Object.keys(p.prices).join(' ').toLowerCase();
      if (filter === 'sacos' && !packs.includes('saco') && p.type !== 'solido') return false;
      if (filter === 'botellas' && !packs.includes('botella') && p.type !== 'liquido') return false;
      if (filter === 'kits' && p.type !== 'kit') return false;
      if (filter === 'venta' && p.status !== 'activo') return false;

      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.purpose.toLowerCase().includes(q) ||
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
              Productos en Sacos y Botellas Reutilizadas
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#33473B]">
              Aprovechamos <strong>sacos de 10 kg, 25 kg y 45 kg</strong> (lombricompost, bokashi y compost) y{' '}
              <strong>botellas plásticas limpias con triple lavado</strong> (bioinsecticidas, caldos minerales,
              biofermentos y kits circulares).
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

        {/* Search & Segmented Filters */}
        <div className="flex flex-col gap-3 border-t border-[#E7EDE5] bg-[#FAFBF9] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4B6153]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar lombricompost, bokashi, caldo, saco, botella..."
              className="w-full rounded-xl border border-[#C8D6CB] bg-white py-2 pl-9 pr-3 text-sm text-[#14241B] focus:border-[#14532D] focus:outline-none focus:ring-2 focus:ring-[#14532D]/15"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-[#E7ECE5] p-1">
            {(
              [
                { id: 'todos', label: 'Todos' },
                { id: 'sacos', label: 'En sacos' },
                { id: 'botellas', label: 'En botellas' },
                { id: 'kits', label: 'Kits' },
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
    </div>
  );
}
