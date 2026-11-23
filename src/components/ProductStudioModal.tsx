import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Megaphone,
  Package,
  Printer,
  QrCode,
  Tag,
  X,
} from 'lucide-react';
import type { PlatformSettings, Product } from '../types.ts';
import { formatCRC } from '../utils/format.ts';
import { buildQrSvgString, generateQrData } from '../utils/qr.ts';
import { LogoStrip } from './LogoStrip.tsx';

interface ProductStudioModalProps {
  product: Product | null;
  settings: PlatformSettings;
  onClose: () => void;
}

type StudioTab = 'ficha' | 'afiche' | 'infografia' | 'qr';

export function ProductStudioModal({ product, settings, onClose }: ProductStudioModalProps) {
  const [tab, setTab] = useState<StudioTab>('ficha');
  const [qrTarget, setQrTarget] = useState(() => settings.catalogUrl || 'https://ctptronadora.ed.cr/ecotron');

  const qrData = useMemo(() => {
    try {
      return generateQrData(qrTarget);
    } catch {
      return generateQrData('https://ctptronadora.ed.cr/ecotron');
    }
  }, [qrTarget]);

  if (!product) return null;

  const priceEntries = Object.entries(product.prices || {});

  function handleDownloadQr() {
    const svg = buildQrSvgString(qrTarget || 'https://ctptronadora.ed.cr/ecotron');
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${product!.code.toLowerCase()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-[#DCE5DD] bg-white shadow-2xl">
        {/* Top bar */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE5DD] bg-[#F7FAF7] px-5 py-3.5">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#166534]">
              {product.code} · {product.category}
            </div>
            <h2 className="text-lg font-bold text-[#14241B]">{product.name}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#C8D6CB] bg-white px-3 py-1.5 text-xs font-semibold text-[#14241B] hover:bg-[#EDF4EE]"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir vista
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#4B6153] hover:bg-[#E6EFE7] hover:text-[#14241B]"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div className="no-print flex flex-wrap gap-1.5 border-b border-[#DCE5DD] bg-white px-5 py-2.5">
          {(
            [
              { id: 'ficha', label: 'Ficha y empaque', icon: FileText },
              { id: 'afiche', label: 'Publicidad / Afiche', icon: Megaphone },
              { id: 'infografia', label: 'Infografía (5 pasos)', icon: Package },
              { id: 'qr', label: 'Etiqueta y QR', icon: QrCode },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
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

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'ficha' && (
            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-5">
                <div className="md:col-span-2">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl border border-[#DCE5DD] bg-[#EDF4EE]">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-3 rounded-lg border border-[#DCE5DD] bg-[#F7FAF7] p-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#166534]">
                      Protocolo de empaque (Sacos / Botellas)
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#33473B]">
                      {product.packagingNote || product.pack}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 md:col-span-3">
                  <div>
                    <p className="text-sm font-semibold text-[#166534]">{product.slogan}</p>
                    <p className="mt-1 text-sm leading-relaxed text-[#33473B]">{product.purpose}</p>
                  </div>

                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#4B6153]">
                      Presentaciones, precios y existencias
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {priceEntries.map(([pack, price]) => {
                        const qty = product.stockByPresentation?.[pack] ?? 0;
                        return (
                          <div
                            key={pack}
                            className="flex items-center justify-between rounded-lg border border-[#DCE5DD] bg-[#F8FAF8] px-3 py-2"
                          >
                            <div>
                              <div className="text-xs font-semibold text-[#14241B]">{pack}</div>
                              <div className="text-[11px] font-mono tabular-nums text-[#4B6153]">
                                Stock: {qty} u.
                              </div>
                            </div>
                            <div className="font-mono text-sm font-bold tabular-nums text-[#14532D]">
                              {formatCRC(price)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-[#DCE5DD] bg-white p-3">
                      <div className="text-xs font-bold text-[#14241B]">Cómo aplicar</div>
                      <p className="mt-1 text-xs leading-relaxed text-[#4B6153]">{product.how}</p>
                    </div>
                    <div className="rounded-lg border border-[#DCE5DD] bg-white p-3">
                      <div className="text-xs font-bold text-[#14241B]">Dosis orientativa</div>
                      <p className="mt-1 text-xs leading-relaxed text-[#4B6153]">{product.dose}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-lg border border-[#FCD34D] bg-[#FEF3C7]/60 p-3 text-xs text-[#78350F]">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]" />
                    <span>
                      <strong>Seguridad y normativa:</strong> {product.caution}
                    </span>
                  </div>
                </div>
              </div>

              {product.process.length > 0 && (
                <div className="rounded-xl border border-[#DCE5DD] bg-[#F7FAF7] p-4">
                  <h3 className="text-sm font-bold text-[#14241B]">Proceso de elaboración estudiantil</h3>
                  <ol className="mt-2.5 grid gap-2 sm:grid-cols-2">
                    {product.process.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#33473B]">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#14532D] font-mono text-[11px] font-bold text-white">
                          {i + 1}
                        </span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {tab === 'afiche' && (
            <div className="print-surface mx-auto max-w-2xl overflow-hidden rounded-xl border border-[#DCE5DD] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#14532D] px-6 py-4 text-white">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-[#BBF7D0]">
                    {settings.enterpriseName} · {settings.schoolName}
                  </div>
                  <div className="text-sm font-medium text-white/90">{settings.locationLabel}</div>
                </div>
                <LogoStrip settings={settings} compact />
              </div>

              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#EBF3EC]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-6">
                <div className="text-xs font-bold uppercase tracking-wider text-[#166534]">
                  {product.marketingCategory} · {product.code}
                </div>
                <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-[#14241B]">
                  {product.name}
                </h3>
                <p className="mt-1 text-base font-semibold text-[#166534]">{product.slogan}</p>
                <p className="mt-2 text-sm text-[#33473B]">{product.purpose}</p>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  {priceEntries.map(([pack, price]) => (
                    <div
                      key={pack}
                      className="rounded-lg border border-[#C8DEC9] bg-[#F2F8F3] px-3.5 py-2"
                    >
                      <div className="text-xs text-[#4B6153]">{pack}</div>
                      <div className="font-mono text-lg font-extrabold tabular-nums text-[#14532D]">
                        {formatCRC(price)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#DCE5DD] pt-4">
                  <div className="max-w-md text-xs text-[#4B6153]">
                    <p className="font-semibold text-[#14241B]">Empaque responsable con recursos recuperados</p>
                    <p className="mt-0.5">{product.packagingNote || product.pack}</p>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-lg border border-[#DCE5DD] bg-[#F8FAF8] p-2">
                    <svg viewBox={qrData.viewBox} className="h-16 w-16 shrink-0" role="img" aria-label="QR Catálogo">
                      <rect width={qrData.size} height={qrData.size} fill="#ffffff" />
                      <path d={qrData.pathD} fill="#14532D" />
                    </svg>
                    <div className="text-[11px] leading-tight text-[#33473B]">
                      <strong className="block text-[#14532D]">Catálogo digital</strong>
                      <span>Escanea para fichas y pedidos</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'infografia' && (
            <div className="print-surface mx-auto max-w-2xl rounded-xl border border-[#DCE5DD] bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE5DD] pb-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#166534]">
                    Guía rápida de uso en 5 pasos · {product.code}
                  </div>
                  <h3 className="text-2xl font-bold text-[#14241B]">{product.name}</h3>
                </div>
                <LogoStrip settings={settings} compact />
              </div>

              <div className="mt-4 divide-y divide-[#E6EFE7]">
                {(product.infosteps.length > 0 ? product.infosteps : product.process).map((step, i) => (
                  <div key={i} className="flex items-start gap-3.5 py-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF3EC] font-mono text-sm font-bold text-[#14532D]">
                      {i + 1}
                    </div>
                    <p className="pt-1 text-sm text-[#14241B]">{step}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#DCE5DD] bg-[#F7FAF7] p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#14532D]">
                    <CheckCircle2 className="h-4 w-4" />
                    Dosis orientativa
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#33473B]">{product.dose}</p>
                </div>
                <div className="rounded-lg border border-[#FCD34D] bg-[#FEF3C7]/60 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#92400E]">
                    <AlertTriangle className="h-4 w-4" />
                    Precaución obligatoria
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#78350F]">{product.caution}</p>
                </div>
              </div>
            </div>
          )}

          {tab === 'qr' && (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4 rounded-xl border border-[#DCE5DD] bg-[#F7FAF7] p-4">
                <div>
                  <label htmlFor="qr-url-input" className="block text-xs font-bold uppercase tracking-wider text-[#14241B]">
                    Enlace de destino del código QR
                  </label>
                  <input
                    id="qr-url-input"
                    type="url"
                    value={qrTarget}
                    onChange={(e) => setQrTarget(e.target.value)}
                    placeholder="https://ctptronadora.ed.cr/ecotron"
                    className="mt-1.5 w-full rounded-lg border border-[#C8D6CB] bg-white px-3 py-2 text-sm text-[#14241B] focus:border-[#14532D] focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-[#4B6153]">
                    Imprime este código para pegarlo en sacos o botellas plásticas reutilizadas junto con la etiqueta ECOTRON.
                  </p>
                </div>

                <div className="flex flex-col items-center rounded-xl border border-[#DCE5DD] bg-white p-5">
                  <svg viewBox={qrData.viewBox} className="h-44 w-44" role="img" aria-label="Código QR ECOTRON">
                    <rect width={qrData.size} height={qrData.size} fill="#ffffff" />
                    <path d={qrData.pathD} fill="#14532D" />
                  </svg>
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#166534]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Descargar QR (.SVG)
                  </button>
                </div>
              </div>

              {/* Label preview for bottles / sacos */}
              <div className="print-surface flex flex-col justify-between rounded-xl border-2 border-dashed border-[#9DB8A2] bg-white p-5">
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-[#DCE5DD] pb-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#14532D]">
                      <Tag className="h-4 w-4" />
                      Modelo de etiqueta ({product.type === 'solido' ? 'Saco' : 'Botella reutilizada'})
                    </div>
                    <LogoStrip settings={settings} compact />
                  </div>

                  <div className="mt-3">
                    <div className="font-mono text-xs font-bold text-[#4B6153]">
                      {product.code} · {product.category}
                    </div>
                    <h4 className="mt-0.5 text-xl font-extrabold text-[#14241B]">{product.name}</h4>
                    <p className="mt-1 text-xs font-semibold text-[#166534]">{product.slogan}</p>
                  </div>

                  <div className="mt-3 rounded-lg bg-[#F7FAF7] p-3 text-xs text-[#33473B]">
                    <div>
                      <strong>Presentación base:</strong> {product.pack}
                    </div>
                    <div className="mt-1">
                      <strong>Aplicación:</strong> {product.dose}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#DCE5DD] pt-3">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[#991B1B]">
                    USO AGRÍCOLA · NO INGERIR · LOTE: ______
                  </div>
                  <svg viewBox={qrData.viewBox} className="h-14 w-14 shrink-0" role="img" aria-label="QR Etiqueta">
                    <rect width={qrData.size} height={qrData.size} fill="#ffffff" />
                    <path d={qrData.pathD} fill="#14532D" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
