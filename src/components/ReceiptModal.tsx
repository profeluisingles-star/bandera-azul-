import { useEffect, useState } from 'react';
import { Check, Copy, MessageCircle, Printer, X } from 'lucide-react';
import type { PlatformSettings, Sale } from '../types.ts';
import {
  buildWhatsAppReceiptText,
  buildWhatsAppReceiptUrl,
  formatCRC,
  formatDateCR,
} from '../utils/format.ts';
import { LogoStrip } from './LogoStrip.tsx';

interface ReceiptModalProps {
  sale: Sale | null;
  settings: PlatformSettings;
  onClose: () => void;
}

export function ReceiptModal({ sale, settings, onClose }: ReceiptModalProps) {
  const [phoneInput, setPhoneInput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPhoneInput(sale?.clientPhone || '');
    setCopied(false);
  }, [sale]);

  if (!sale) return null;

  const whatsappUrl = buildWhatsAppReceiptUrl(sale, settings, phoneInput);

  async function handleCopyMessage() {
    if (!sale) return;
    try {
      await navigator.clipboard.writeText(buildWhatsAppReceiptText(sale, settings));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked in restricted browser contexts
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[#DCE5DD] bg-white shadow-2xl">
        <div className="no-print flex items-center justify-between border-b border-[#DCE5DD] bg-[#F7FAF7] px-5 py-3">
          <h2 className="text-sm font-bold text-[#14241B]">Comprobante de Venta · {sale.receiptNumber}</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#14532D] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#166534]"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#4B6153] hover:bg-[#E6EFE7]"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="print-surface space-y-4 p-6 text-xs text-[#14241B]">
            <div className="flex items-start justify-between gap-3 border-b border-[#DCE5DD] pb-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#166534]">
                  {settings.enterpriseName} · Empresa Estudiantil
                </div>
                <div className="text-base font-extrabold">{settings.schoolName}</div>
                <div className="text-[#4B6153]">{settings.locationLabel}</div>
              </div>
              <LogoStrip settings={settings} compact />
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg border border-[#E6EFE7] bg-[#FAFBF9] p-3">
              <div>
                <div className="text-[#4B6153]">Recibo N.°</div>
                <div className="font-mono font-bold text-[#14532D]">{sale.receiptNumber}</div>
              </div>
              <div>
                <div className="text-[#4B6153]">Fecha</div>
                <div className="font-mono font-bold tabular-nums">{formatDateCR(sale.date)}</div>
              </div>
              <div>
                <div className="text-[#4B6153]">Cliente</div>
                <div className="font-semibold">{sale.clientName}</div>
              </div>
              <div>
                <div className="text-[#4B6153]">Forma de pago</div>
                <div className="font-semibold">{sale.paymentMethod}</div>
              </div>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#DCE5DD] text-left text-[#4B6153]">
                  <th className="py-2">Producto / Presentación</th>
                  <th className="py-2 text-right">Cant.</th>
                  <th className="py-2 text-right">Precio</th>
                  <th className="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#E6EFE7]">
                  <td className="py-2.5">
                    <div className="font-bold">{sale.productName}</div>
                    <div className="text-[#4B6153]">{sale.presentation}</div>
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums">{sale.quantity}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums">{formatCRC(sale.unitPrice)}</td>
                  <td className="py-2.5 text-right font-mono font-bold tabular-nums">{formatCRC(sale.total)}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex items-center justify-between rounded-lg bg-[#F2F8F3] px-4 py-3">
              <span className="text-sm font-bold text-[#14241B]">Total recibido</span>
              <span className="font-mono text-lg font-extrabold tabular-nums text-[#14532D]">
                {formatCRC(sale.total)}
              </span>
            </div>

            {sale.notes && (
              <div className="text-[#4B6153]">
                <strong>Nota:</strong> {sale.notes}
              </div>
            )}

            <div className="border-t border-dashed border-[#C8D6CB] pt-3 text-center text-[11px] text-[#4B6153]">
              Comprobante educativo y comunitario · Responsable: {settings.teacherName} · &quot;{settings.slogan}&quot;
            </div>
          </div>

          {/* WhatsApp Invoice Sender */}
          <div className="no-print border-t border-[#DCE5DD] bg-[#F7FAF7] px-6 py-4">
            <div className="text-xs font-bold text-[#14241B]">Enviar comprobante por WhatsApp al cliente</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="Teléfono WhatsApp (ej. 8800-1234)"
                className="min-w-[170px] flex-1 rounded-lg border border-[#C8D6CB] bg-white px-3 py-2 font-mono text-xs text-[#14241B]"
              />
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#15803D] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#166534]"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Enviar por WhatsApp
              </a>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#C8D6CB] bg-white px-3 py-2 text-xs font-semibold text-[#14241B] hover:bg-[#EDF4EE]"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-[#16A34A]" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copiado' : 'Copiar texto'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
