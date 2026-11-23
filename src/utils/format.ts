import type { CustomReminder, PlatformSettings, Product, Sale, Sowing } from '../types.ts';
import { TILARAN_CROPS } from '../data/agronomyData.ts';

export function formatCRC(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `₡${safe.toLocaleString('es-CR')}`;
}

export function formatDateCR(isoDate: string): string {
  if (!isoDate) return '—';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function addDaysIso(isoDate: string, days: number): string {
  const base = new Date(`${isoDate || new Date().toISOString().slice(0, 10)}T12:00:00`);
  if (Number.isNaN(base.getTime())) return new Date().toISOString().slice(0, 10);
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

export function totalProductStock(product: Product): number {
  return Object.values(product.stockByPresentation || {}).reduce(
    (sum, qty) => sum + (Number.isFinite(qty) ? qty : 0),
    0
  );
}

export function normalizeCrPhone(rawPhone: string | undefined): string {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 8) return `506${digits}`;
  return digits;
}

export function buildWhatsAppReceiptText(sale: Sale, settings: PlatformSettings): string {
  const lines = [
    `*${settings.enterpriseName} · ${settings.schoolName}*`,
    `📍 ${settings.locationLabel}`,
    `────────────────────`,
    `🧾 *Comprobante:* ${sale.receiptNumber}`,
    `📅 *Fecha:* ${formatDateCR(sale.date)}`,
    `👤 *Cliente:* ${sale.clientName}`,
    ``,
    `📦 *Producto:* ${sale.productName}`,
    `📐 *Presentación:* ${sale.presentation}`,
    `🔢 *Cantidad:* ${sale.quantity}`,
    `💵 *Precio unitario:* ${formatCRC(sale.unitPrice)}`,
    `✅ *Total pagado:* ${formatCRC(sale.total)}`,
    `💳 *Método de pago:* ${sale.paymentMethod}`,
  ];
  if (sale.notes) {
    lines.push(`📝 *Nota:* ${sale.notes}`);
  }
  lines.push(
    `────────────────────`,
    `Responsable: ${settings.teacherName}`,
    `_"${settings.slogan}"_`,
    `¡Gracias por apoyar la huerta agroecológica estudiantil!`
  );
  return lines.join('\n');
}

export function buildWhatsAppReceiptUrl(
  sale: Sale,
  settings: PlatformSettings,
  phoneOverride?: string
): string {
  const text = encodeURIComponent(buildWhatsAppReceiptText(sale, settings));
  const cleanPhone = normalizeCrPhone(phoneOverride !== undefined ? phoneOverride : sale.clientPhone);
  return cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function escapeCsvCell(raw: unknown): string {
  const str = String(raw ?? '');
  const guarded = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export function downloadTextFile(filename: string, content: string, mimeType = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function escapeHtml(raw: unknown): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildStandaloneCatalogHtml(products: Product[], settings: PlatformSettings): string {
  const cards = products
    .map((p) => {
      const priceRows = Object.entries(p.prices)
        .map(
          ([pack, price]) =>
            `<div class="price-box"><span>${escapeHtml(pack)}</span><strong>${escapeHtml(formatCRC(price))}</strong></div>`
        )
        .join('');
      const statusLabel =
        p.status === 'activo'
          ? 'Disponible'
          : p.status === 'ensayo'
            ? 'Ensayo escolar'
            : 'En validación técnica';
      return `<article class="card">
        <div class="meta">${escapeHtml(p.code)} · ${escapeHtml(p.category)} · ${escapeHtml(statusLabel)}</div>
        <h2>${escapeHtml(p.name)}</h2>
        <p class="slogan">${escapeHtml(p.slogan)}</p>
        <p>${escapeHtml(p.purpose)}</p>
        <div class="prices">${priceRows}</div>
        <p class="note"><strong>Empaque:</strong> ${escapeHtml(p.packagingNote || p.pack)}</p>
        <p class="note"><strong>Uso y dosis:</strong> ${escapeHtml(p.dose)}</p>
        <p class="warn"><strong>Precaución:</strong> ${escapeHtml(p.caution)}</p>
      </article>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(settings.enterpriseName)} · Catálogo Comercial</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;background:#f6f8f5;color:#14241b;margin:0;padding:24px;line-height:1.5}
  .wrap{max-width:1040px;margin:auto}
  header{background:#14532d;color:#fff;padding:24px;border-radius:16px;margin-bottom:20px}
  header h1{margin:0 0 6px;font-size:28px}
  header p{margin:0;opacity:.92}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}
  .card{background:#fff;border:1px solid #dce5dd;border-radius:14px;padding:18px}
  .meta{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#166534}
  h2{margin:6px 0 4px;font-size:20px}
  .slogan{font-weight:600;color:#166534;margin:0 0 8px}
  .prices{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
  .price-box{background:#f0f6f1;border:1px solid #d5e4d8;border-radius:8px;padding:8px 10px;font-size:12px}
  .price-box strong{display:block;font-size:15px;color:#14532d;margin-top:2px}
  .note{font-size:13px;color:#33473b;margin:6px 0}
  .warn{font-size:12px;background:#fef3c7;border:1px solid #fcd34d;padding:8px 10px;border-radius:8px;color:#78350f;margin-top:10px}
  footer{margin-top:24px;text-align:center;font-size:12px;color:#52665a}
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>${escapeHtml(settings.enterpriseName)} · Catálogo Agroecológico</h1>
      <p>${escapeHtml(settings.schoolName)} · ${escapeHtml(settings.locationLabel)} · "${escapeHtml(settings.slogan)}"</p>
    </header>
    <section class="grid">${cards}</section>
    <footer>Generado desde la plataforma educativa ${escapeHtml(settings.enterpriseName)} · ${escapeHtml(settings.teacherName)}</footer>
  </div>
</body>
</html>`;
}

export interface CalendarEventItem {
  id: string;
  date: string;
  title: string;
  category: 'riego' | 'producto' | 'siembra' | 'compost' | 'cosecha' | 'otro';
  area: string;
  instructions: string;
  source: 'auto' | 'manual';
  sowingId?: string;
  taskKey?: string;
  reminderId?: string;
  done: boolean;
}

export function buildBeginnerCalendarEvents(
  sowings: Sowing[],
  customReminders: CustomReminder[]
): CalendarEventItem[] {
  const events: CalendarEventItem[] = [];

  for (const s of sowings) {
    const crop = TILARAN_CROPS.find((c) => c.id === s.cropId);
    const start = s.startDate || new Date().toISOString().slice(0, 10);

    // Day 0: Planting & compost prep
    events.push({
      id: `${s.id}-day0`,
      date: start,
      title: `Día 0 · Sembrar ${s.cropName} en lomillo con compost maduro`,
      category: 'siembra',
      area: s.bed,
      instructions: crop
        ? `Profundidad: ${crop.depth}. Distancia: ${crop.spacing}. Si hay viento fuerte en Tilarán, coloca barrera o malla.`
        : 'Prepara la era alta (20–30 cm), mezcla TierraViva maduro y siembra sin enterrar de más.',
      source: 'auto',
      sowingId: s.id,
      taskKey: 'prep',
      done: s.completedTasks.includes('prep'),
    });

    // Watering checks at days 2, 5, 9, 14, 21
    for (const offset of [2, 5, 9, 14, 21]) {
      const key = `water-${offset}`;
      events.push({
        id: `${s.id}-${key}`,
        date: addDaysIso(start, offset),
        title: `Revisar humedad y regar ${s.cropName} (si hace falta)`,
        category: 'riego',
        area: s.bed,
        instructions:
          'Prueba del dedo para principiantes: mete el dedo 2–3 cm en la tierra. Si sale húmeda o llovió hoy, NO riegues. Si está seca, riega suave directo al pie temprano o al caer la tarde.',
        source: 'auto',
        sowingId: s.id,
        taskKey: key,
        done: s.completedTasks.includes(key),
      });
    }

    // Day 8: Germination / thinning / wind protection
    events.push({
      id: `${s.id}-germ`,
      date: addDaysIso(start, 8),
      title: `Revisar nacimientos, raleo y acolchado (${s.cropName})`,
      category: 'siembra',
      area: s.bed,
      instructions:
        'Observa si germinó parejo. Coloca pasto seco sin semilla (mulch) alrededor dejando 2 cm libres junto al tallito para cuidar la humedad.',
      source: 'auto',
      sowingId: s.id,
      taskKey: 'mulch',
      done: s.completedTasks.includes('mulch'),
    });

    // Transplant milestone if applicable
    if (crop?.transplantDays) {
      const tDay = crop.transplantDays[0];
      events.push({
        id: `${s.id}-transplant`,
        date: addDaysIso(start, tDay),
        title: `Trasplantar y tutorear ${s.cropName}`,
        category: 'siembra',
        area: s.bed,
        instructions: `Cuando tenga 4 hojas verdaderas, trasplanta al final de la tarde al lomillo definitivo (${crop.spacing}) y coloca tutor contra el viento de Tilarán.`,
        source: 'auto',
        sowingId: s.id,
        taskKey: 'transplant',
        done: s.completedTasks.includes('transplant'),
      });
    }

    // Day 18: First MIP observation + optional product / nutrition check
    events.push({
      id: `${s.id}-mip1`,
      date: addDaysIso(start, 18),
      title: `Revisar hojas (MIP) y valorar abono o repelente en ${s.cropName}`,
      category: 'producto',
      area: s.bed,
      instructions: crop
        ? `Voltea 5 hojas por el envés buscando plagas o manchas. Nutrición: ${crop.nutrition} No apliques productos al sol fuerte ni sin revisar primero.`
        : 'Revisa el envés de las hojas; si el cultivo pide vigor o hay plaga inicial, coordina con el docente aplicar VermiVida o RepelVerde diluido al atardecer.',
      source: 'auto',
      sowingId: s.id,
      taskKey: 'mip',
      done: s.completedTasks.includes('mip'),
    });

    // Day 30: Preventive check (rain / fungi / reinforcement)
    events.push({
      id: `${s.id}-prod30`,
      date: addDaysIso(start, 30),
      title: `Chequeo preventivo de hongos y refuerzo en ${s.cropName}`,
      category: 'producto',
      area: s.bed,
      instructions:
        'Si estamos en época lluviosa de Tilarán, retira hojas bajas tocando suelo y consulta con el docente si corresponde aplicar preventivo (ej. CaldoBordelés o NutriVerde al pie).',
      source: 'auto',
      sowingId: s.id,
      taskKey: 'prod30',
      done: s.completedTasks.includes('prod30'),
    });

    // Harvest window
    const hDay = crop ? crop.harvestDays[0] : 45;
    events.push({
      id: `${s.id}-harvest`,
      date: addDaysIso(start, hDay),
      title: `¡Ventana de cosecha! Revisar ${s.cropName}`,
      category: 'cosecha',
      area: s.bed,
      instructions: crop
        ? `${crop.harvestText} Cosecha temprano con manos y herramientas limpias, y registra los resultados en la bitácora.`
        : 'Revisa madurez para cosechar temprano en la mañana y anota el rendimiento en la bitácora.',
      source: 'auto',
      sowingId: s.id,
      taskKey: 'harvest',
      done: s.completedTasks.includes('harvest'),
    });
  }

  for (const rem of customReminders) {
    events.push({
      id: rem.id,
      date: rem.date,
      title: rem.title,
      category: rem.category,
      area: rem.area,
      instructions: rem.instructions || 'Recordatorio programado para la huerta escolar.',
      source: 'manual',
      reminderId: rem.id,
      done: rem.done,
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export function buildSowingsIcs(events: CalendarEventItem[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ECOTRON CTP Tronadora//Huerta 2027//ES',
    'CALSCALE:GREGORIAN',
  ];
  for (const ev of events) {
    const dt = (ev.date || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.id}@ecotron.tronadora`,
      `DTSTART;VALUE=DATE:${dt}`,
      `SUMMARY:${ev.title} (${ev.area})`,
      `DESCRIPTION:${ev.instructions.replace(/\r?\n/g, ' ')}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:Alarma Huerta CTP Tronadora: ${ev.title}`,
      'TRIGGER:-PT12H',
      'END:VALARM',
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
