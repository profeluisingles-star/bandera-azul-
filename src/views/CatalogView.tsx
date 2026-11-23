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
      <div className="rounded-xl border border-[#DCE5DD] bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-wider text-[#166534]">
              Catálogo Comercial y Fichas Técnicas · {settings.enterpriseName}
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-[#14241B]">
              Productos en Sacos y Botellas Plásticas Reutilizadas
            </h1>
            <p className="mt-1.5 text-sm text-[#33473B]">
              Catálogo diseñado para aprovechar los <strong>sacos de 10 kg, 25 kg y 45 kg</strong> (lombricompost,
              bokashi y compost) y las <strong>botellas plásticas limpias y rotuladas</strong> (bioinsecticidas,
              caldos minerales, biofermentos y macetas circulares).
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCatalogHtml}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#C8D6CB] bg-[#F7FAF7] px-3.5 py-2 text-xs font-semibold text-[#14241B] hover:bg-[#EBF3EC]"
          >
            <Download className="h-4 w-4 text-[#166534]" />
            Exportar catálogo HTML
          </button>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#FCD34D] bg-[#FEF3C7]/55 p-3.5 text-xs text-[#78350F]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]" />
          <span>
            <strong>Regla Bandera Azul para botellas reutilizadas:</strong> Toda botella plástica debe pasar por triple
            lavado, secado, <strong>retiro completo de etiquetas de bebidas</strong> y colocación de etiqueta ECOTRON con
            fecha de lote y aviso de uso agrícola. En productos en ensayo o caldos, verificar normativa MAG/SFE antes de
            venta masiva externa.
          </span>
        </div>

        {/* Search & Filters */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4B6153]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar lombricompost, bokashi, caldo, saco, botella..."
              className="w-full rounded-lg border border-[#C8D6CB] bg-[#FAFBF9] py-2 pl-9 pr-3 text-sm text-[#14241B] focus:border-[#14532D] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'todos', label: 'Todos' },
                { id: 'sacos', label: 'En sacos / Sólidos' },
                { id: 'botellas', label: 'En botellas / Caldos y líquidos' },
                { id: 'kits', label: 'Kits circulares' },
                { id: 'venta', label: 'Habilitados para venta' },
              ] as const
            ).map((btn) => {
              const active = filter === btn.id;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setFilter(btn.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[#14532D] text-white'
                      : 'border border-[#DCE5DD] bg-[#F7FAF7] text-[#33473B] hover:bg-[#EBF2EC]'
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
        <div className="rounded-xl border border-[#DCE5DD] bg-white p-10 text-center">
          <Package className="mx-auto h-9 w-9 text-[#4B6153]" />
          <p className="mt-2 text-sm font-semibold text-[#14241B]">
            No hay productos que coincidan con tu búsqueda.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setFilter('todos');
            }}
            className="mt-3 rounded-lg bg-[#14532D] px-4 py-2 text-xs font-semibold text-white"
          >
            Ver todo el catálogo
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => {
            const totalStock = totalProductStock(product);
            const pricesList = Object.entries(product.prices || {});
            return (
              <article
                key={product.id}
                className="flex flex-col overflow-hidden rounded-xl border border-[#DCE5DD] bg-white"
              >
                <div className="relative aspect-[16/10] bg-[#EDF4EE]">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute left-3 top-3">
                    {product.status === 'activo' && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#86EFAC] bg-[#F0FDF4] px-2 py-1 text-[11px] font-bold text-[#166534]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Habilitado para venta
                      </span>
                    )}
                    {product.status === 'ensayo' && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#FCD34D] bg-[#FEF3C7] px-2 py-1 text-[11px] font-bold text-[#92400E]">
                        <FlaskConical className="h-3.5 w-3.5" />
                        Ensayo escolar
                      </span>
                    )}
                    {product.status === 'desarrollo' && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] px-2 py-1 text-[11px] font-bold text-[#334155]">
                        <Sparkles className="h-3.5 w-3.5" />
                        Validación técnica
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider text-[#166534]">
                    <span>
                      {product.code} · {product.category}
                    </span>
                    <span className="font-mono tabular-nums text-[#4B6153]">Stock: {totalStock} u.</span>
                  </div>

                  <h2 className="mt-1 text-lg font-extrabold text-[#14241B]">{product.name}</h2>
                  <p className="mt-0.5 text-xs font-semibold text-[#166534]">{product.slogan}</p>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#4B6153]">{product.purpose}</p>

                  {/* Presentations & Prices */}
                  <div className="mt-3 flex-1 space-y-1.5 border-t border-[#E6EFE7] pt-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#4B6153]">
                      Presentaciones y precios
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {pricesList.slice(0, 4).map(([pack, price]) => (
                        <div
                          key={pack}
                          className="rounded-lg border border-[#E6EFE7] bg-[#F8FAF8] px-2.5 py-1.5"
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
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#14532D] px-3 py-2 text-xs font-semibold text-white hover:bg-[#166534]"
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
