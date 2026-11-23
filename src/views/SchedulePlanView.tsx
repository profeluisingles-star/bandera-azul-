import { useMemo, useState, type FormEvent } from 'react';
import {
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Download,
  Droplets,
  FlaskConical,
  Lock,
  Plus,
  Sprout,
  Square,
  Trash2,
} from 'lucide-react';
import { ANNUAL_PLAN_2027, TILARAN_CROPS } from '../data/agronomyData.ts';
import type { CustomReminder, Sowing } from '../types.ts';
import {
  buildBeginnerCalendarEvents,
  buildSowingsIcs,
  downloadTextFile,
  formatDateCR,
  type CalendarEventItem,
} from '../utils/format.ts';

interface SchedulePlanViewProps {
  sowings: Sowing[];
  customReminders: CustomReminder[];
  isTeacher: boolean;
  onAddSowing: (sowing: Omit<Sowing, 'id' | 'completedTasks'>) => Promise<void>;
  onToggleTask: (sowingId: string, taskId: string) => Promise<void>;
  onDeleteSowing: (sowingId: string) => Promise<void>;
  onAddReminder: (rem: Omit<CustomReminder, 'id' | 'done'>) => Promise<void>;
  onToggleReminder: (id: string, done: boolean) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
  onOpenAuth: () => void;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function categoryStyle(cat: CalendarEventItem['category']) {
  switch (cat) {
    case 'riego':
      return { label: 'Riego / Humedad', cls: 'border-[#BAE6FD] bg-[#F0F9FF] text-[#0369A1]', dot: 'bg-[#0284C7]' };
    case 'producto':
      return { label: 'Producto / Abono / MIP', cls: 'border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]', dot: 'bg-[#D97706]' };
    case 'cosecha':
      return { label: 'Cosecha', cls: 'border-[#BBF7D0] bg-[#DCFCE7] text-[#14532D]', dot: 'bg-[#15803D]' };
    case 'compost':
      return { label: 'Compostaje', cls: 'border-[#E2E8F0] bg-[#F8FAFC] text-[#334155]', dot: 'bg-[#475569]' };
    default:
      return { label: 'Siembra / Trasplante', cls: 'border-[#C8DEC9] bg-[#EAF3EC] text-[#166534]', dot: 'bg-[#166534]' };
  }
}

export function SchedulePlanView({
  sowings,
  customReminders,
  isTeacher,
  onAddSowing,
  onToggleTask,
  onDeleteSowing,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onOpenAuth,
}: SchedulePlanViewProps) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [viewYear, setViewYear] = useState(() => Number(todayIso.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => Number(todayIso.slice(5, 7)) - 1); // 0-indexed
  const [notifStatus, setNotifStatus] = useState('');

  // New sowing form
  const [cropId, setCropId] = useState(TILARAN_CROPS[0].id);
  const [bed, setBed] = useState('Era Alta #1');
  const [startDate, setStartDate] = useState(todayIso);
  const [plants, setPlants] = useState(25);
  const [notes, setNotes] = useState('');
  const [savingSowing, setSavingSowing] = useState(false);

  // New custom reminder form
  const [remTitle, setRemTitle] = useState('');
  const [remDate, setRemDate] = useState(todayIso);
  const [remCategory, setRemCategory] = useState<CustomReminder['category']>('riego');
  const [remArea, setRemArea] = useState('Era #1');
  const [remInstructions, setRemInstructions] = useState('');
  const [savingRem, setSavingRem] = useState(false);

  const allEvents = useMemo(
    () => buildBeginnerCalendarEvents(sowings, customReminders),
    [sowings, customReminders]
  );

  const pendingUrgent = useMemo(() => {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + 7);
    const limitIso = limitDate.toISOString().slice(0, 10);
    return allEvents.filter((ev) => !ev.done && ev.date <= limitIso);
  }, [allEvents]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>();
    for (const ev of allEvents) {
      const arr = map.get(ev.date) || [];
      arr.push(ev);
      map.set(ev.date, arr);
    }
    return map;
  }, [allEvents]);

  const selectedDayEvents = eventsByDate.get(selectedDate) || [];

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    // Monday = 0 ... Sunday = 6
    const offset = (firstDay.getDay() + 6) % 7;
    const cells: Array<{ iso: string; day: number } | null> = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(viewMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({ iso: `${viewYear}-${mStr}-${dStr}`, day: d });
    }
    return cells;
  }, [viewYear, viewMonth]);

  function shiftMonth(delta: number) {
    const dt = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(dt.getFullYear());
    setViewMonth(dt.getMonth());
  }

  async function handleToggleEvent(ev: CalendarEventItem) {
    if (!isTeacher) return;
    if (ev.source === 'auto' && ev.sowingId && ev.taskKey) {
      await onToggleTask(ev.sowingId, ev.taskKey);
    } else if (ev.source === 'manual' && ev.reminderId) {
      await onToggleReminder(ev.reminderId, !ev.done);
    }
  }

  async function handleCreateSowing(e: FormEvent) {
    e.preventDefault();
    const crop = TILARAN_CROPS.find((c) => c.id === cropId) || TILARAN_CROPS[0];
    setSavingSowing(true);
    try {
      await onAddSowing({
        cropId: crop.id,
        cropName: crop.name,
        bed: bed.trim() || 'Era principal',
        startDate,
        plants: Math.max(1, plants),
        notes: notes.trim(),
      });
      setNotes('');
      setSelectedDate(startDate);
    } finally {
      setSavingSowing(false);
    }
  }

  async function handleCreateReminder(e: FormEvent) {
    e.preventDefault();
    if (!remTitle.trim()) return;
    setSavingRem(true);
    try {
      await onAddReminder({
        date: remDate,
        title: remTitle.trim(),
        category: remCategory,
        area: remArea.trim() || 'Huerta escolar',
        instructions: remInstructions.trim(),
      });
      setRemTitle('');
      setRemInstructions('');
      setSelectedDate(remDate);
    } finally {
      setSavingRem(false);
    }
  }

  async function handleBrowserAlarm() {
    if (typeof Notification === 'undefined') {
      setNotifStatus('Tu navegador no admite notificaciones locales; usa el botón "Exportar alarmas (.ICS)" para tu celular.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      setNotifStatus('Permiso de notificaciones denegado. Puedes descargar el archivo .ICS para el calendario del teléfono.');
      return;
    }
    const todayTasks = allEvents.filter((ev) => !ev.done && ev.date <= todayIso);
    const body =
      todayTasks.length > 0
        ? `Tienes ${todayTasks.length} tarea(s) pendientes hoy (ej. ${todayTasks[0].title}).`
        : '¡Todo al día! No hay riegos ni aplicaciones atrasadas hoy.';
    new Notification('Alarma Huerta · CTP Tronadora', { body });
    setNotifStatus('Aviso activado y enviado a este dispositivo.');
  }

  function handleDownloadIcs() {
    const ics = buildSowingsIcs(allEvents);
    downloadTextFile('alarmas-huerta-tronadora.ics', ics, 'text/calendar;charset=utf-8');
  }

  return (
    <div className="space-y-8">
      {/* Urgent Alarms Panel */}
      <section className="rounded-2xl border border-[#D9E2D7] bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E6EFE7] pb-5">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#166534]">
              <Bell className="h-4 w-4" />
              Calendario Guiado y Alarmas desde Cero
            </div>
            <h1 className="font-display mt-1.5 text-2xl font-bold text-[#14241B] sm:text-3xl">
              ¿Cuándo sembrar, regar o aplicar productos en la huerta?
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#33473B]">
              Cada vez que registras una siembra, la plataforma calcula automáticamente las fechas de{' '}
              <strong>revisión de humedad/riego</strong>, <strong>acolchado</strong>,{' '}
              <strong>trasplante</strong>, <strong>revisión de hojas o aplicación preventiva</strong> y{' '}
              <strong>cosecha</strong>, explicadas paso a paso para principiantes.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleBrowserAlarm}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#C8D6CB] bg-[#F7FAF7] px-3.5 py-2 text-xs font-semibold text-[#14241B] hover:bg-[#EBF3EC]"
            >
              <Bell className="h-3.5 w-3.5 text-[#D97706]" />
              Probar alarma hoy
            </button>
            <button
              type="button"
              onClick={handleDownloadIcs}
              disabled={allEvents.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#14532D] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#166534] disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar alarmas al celular (.ICS)
            </button>
          </div>
        </div>

        {notifStatus && (
          <div className="mt-3 rounded-lg border border-[#BAE6FD] bg-[#F0F9FF] px-3.5 py-2 text-xs font-medium text-[#0369A1]">
            {notifStatus}
          </div>
        )}

        {/* Today & Next 7 Days Alarm Cards */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#4B6153]">
            <span>Alarmas activas (hoy y próximos 7 días)</span>
            <span className="font-mono tabular-nums text-[#14532D]">{pendingUrgent.length} pendientes</span>
          </div>

          {pendingUrgent.length === 0 ? (
            <div className="rounded-xl border border-[#DCE5DD] bg-[#F7FAF7] p-4 text-xs text-[#4B6153]">
              No hay tareas urgentes pendientes para estos 7 días. Registra una nueva siembra o crea un recordatorio abajo.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {pendingUrgent.slice(0, 6).map((ev) => {
                const st = categoryStyle(ev.category);
                const isOverdue = ev.date < todayIso;
                const isToday = ev.date === todayIso;
                return (
                  <div
                    key={ev.id}
                    className="flex flex-col justify-between rounded-xl border border-[#DCE5DD] bg-[#FAFBF9] p-3.5 text-xs"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-bold ${st.cls}`}>
                          {ev.category === 'riego' ? (
                            <Droplets className="h-3 w-3" />
                          ) : ev.category === 'producto' ? (
                            <FlaskConical className="h-3 w-3" />
                          ) : (
                            <Sprout className="h-3 w-3" />
                          )}
                          {st.label}
                        </span>
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            isOverdue
                              ? 'text-[#DC2626]'
                              : isToday
                                ? 'text-[#D97706]'
                                : 'text-[#4B6153]'
                          }`}
                        >
                          {isOverdue ? `Atrasada (${formatDateCR(ev.date)})` : isToday ? 'PARA HOY' : formatDateCR(ev.date)}
                        </span>
                      </div>

                      <h3 className="mt-2 text-sm font-bold text-[#14241B]">{ev.title}</h3>
                      <div className="text-[11px] font-semibold text-[#166534]">{ev.area}</div>
                      <p className="mt-1.5 leading-relaxed text-[#33473B]">{ev.instructions}</p>
                    </div>

                    {isTeacher && (
                      <div className="mt-3 flex items-center justify-end gap-2 border-t border-[#E6EFE7] pt-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleEvent(ev)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#14532D] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#166534]"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Marcar realizada
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Interactive Monthly Visual Calendar + Selected Day Detail */}
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-[#D9E2D7] bg-white p-6 shadow-xs lg:col-span-7">
          <div className="flex items-center justify-between border-b border-[#E6EFE7] pb-3.5">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-[#166534]" />
              <h2 className="font-display text-xl font-bold text-[#14241B]">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="rounded-lg border border-[#DCE5DD] p-1.5 hover:bg-[#F2F8F3]"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewYear(Number(todayIso.slice(0, 4)));
                  setViewMonth(Number(todayIso.slice(5, 7)) - 1);
                  setSelectedDate(todayIso);
                }}
                className="rounded-lg border border-[#DCE5DD] px-2.5 py-1 text-xs font-semibold hover:bg-[#F2F8F3]"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="rounded-lg border border-[#DCE5DD] p-1.5 hover:bg-[#F2F8F3]"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#4B6153]">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              if (!cell) return <div key={`empty-${idx}`} className="h-14 rounded-lg bg-[#FAFBF9]" />;
              const dayEvents = eventsByDate.get(cell.iso) || [];
              const pendingCount = dayEvents.filter((e) => !e.done).length;
              const isSelected = cell.iso === selectedDate;
              const isToday = cell.iso === todayIso;
              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => setSelectedDate(cell.iso)}
                  className={`flex h-14 flex-col items-start justify-between rounded-lg border p-1.5 text-left transition-colors ${
                    isSelected
                      ? 'border-[#14532D] bg-[#EAF3EC]'
                      : isToday
                        ? 'border-[#0284C7] bg-[#F0F9FF]'
                        : 'border-[#E6EFE7] bg-white hover:bg-[#F7FAF7]'
                  }`}
                >
                  <span className="font-mono text-xs font-bold text-[#14241B]">{cell.day}</span>
                  {dayEvents.length > 0 && (
                    <div className="flex w-full items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <span
                            key={ev.id}
                            className={`h-1.5 w-3 rounded-xs ${
                              ev.done ? 'bg-[#CBD5E1]' : categoryStyle(ev.category).dot
                            }`}
                          />
                        ))}
                      </div>
                      {pendingCount > 0 && (
                        <span className="font-mono text-[10px] font-bold text-[#14532D]">{pendingCount}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-3 border-t border-[#E6EFE7] pt-3 text-[11px] text-[#4B6153]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-3.5 rounded-xs bg-[#0284C7]" /> Riego / humedad
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-3.5 rounded-xs bg-[#D97706]" /> Producto / abono / MIP
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-3.5 rounded-xs bg-[#166534]" /> Siembra / trasplante
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-3.5 rounded-xs bg-[#15803D]" /> Cosecha
            </span>
          </div>
        </div>

        {/* Selected Day Tasks + Custom Alarm Form */}
        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-2xl border border-[#D9E2D7] bg-white p-6 shadow-xs">
            <div className="border-b border-[#E6EFE7] pb-3">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#166534]">
                Actividades del {formatDateCR(selectedDate)}
              </div>
              <h3 className="font-display text-lg font-bold text-[#14241B]">Qué hacer este día (guía paso a paso)</h3>
            </div>

            <div className="mt-3 space-y-2.5">
              {selectedDayEvents.length === 0 ? (
                <p className="text-xs text-[#4B6153]">
                  No hay tareas programadas exactamente para esta fecha. Selecciona otro día marcado o crea un
                  recordatorio abajo.
                </p>
              ) : (
                selectedDayEvents.map((ev) => {
                  const st = categoryStyle(ev.category);
                  return (
                    <div key={ev.id} className="rounded-lg border border-[#E6EFE7] bg-[#FAFBF9] p-3 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${st.cls}`}>
                            {st.label}
                          </span>
                          <div className={`mt-1 font-bold ${ev.done ? 'line-through text-[#64748B]' : 'text-[#14241B]'}`}>
                            {ev.title}
                          </div>
                          <div className="text-[11px] text-[#166534]">{ev.area}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {isTeacher && (
                            <button
                              type="button"
                              onClick={() => handleToggleEvent(ev)}
                              className="rounded p-1 text-[#14532D] hover:bg-[#EAF3EC]"
                              title={ev.done ? 'Marcar pendiente' : 'Marcar hecha'}
                            >
                              {ev.done ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                            </button>
                          )}
                          {isTeacher && ev.source === 'manual' && ev.reminderId && (
                            <button
                              type="button"
                              onClick={() => onDeleteReminder(ev.reminderId!)}
                              className="rounded p-1 text-[#991B1B] hover:bg-[#FEE2E2]"
                              title="Eliminar alarma"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-1.5 leading-relaxed text-[#33473B]">{ev.instructions}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Add Custom Reminder */}
          <div className="rounded-2xl border border-[#D9E2D7] bg-white p-6 shadow-xs">
            <h3 className="font-display text-base font-bold text-[#14241B]">Programar alarma o recordatorio manual</h3>
            {isTeacher ? (
              <form onSubmit={handleCreateReminder} className="mt-3 space-y-2.5 text-xs">
                <input
                  type="text"
                  required
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  placeholder="Ej. Aplicar RepelVerde diluido al atardecer / Regar almácigo"
                  className="w-full rounded-lg border border-[#C8D6CB] px-3 py-2"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="date"
                    value={remDate}
                    onChange={(e) => setRemDate(e.target.value)}
                    className="rounded-lg border border-[#C8D6CB] px-2 py-1.5 font-mono"
                  />
                  <select
                    value={remCategory}
                    onChange={(e) => setRemCategory(e.target.value as CustomReminder['category'])}
                    className="rounded-lg border border-[#C8D6CB] bg-white px-2 py-1.5"
                  >
                    <option value="riego">Riego</option>
                    <option value="producto">Producto / Abono</option>
                    <option value="siembra">Siembra</option>
                    <option value="compost">Compost</option>
                    <option value="otro">Otro</option>
                  </select>
                  <input
                    type="text"
                    value={remArea}
                    onChange={(e) => setRemArea(e.target.value)}
                    placeholder="Era / Sector"
                    className="rounded-lg border border-[#C8D6CB] px-2 py-1.5"
                  />
                </div>
                <textarea
                  rows={2}
                  value={remInstructions}
                  onChange={(e) => setRemInstructions(e.target.value)}
                  placeholder="Instrucción simple para estudiantes (dosis, prueba del dedo, horario fresco)..."
                  className="w-full rounded-lg border border-[#C8D6CB] px-3 py-1.5"
                />
                <button
                  type="submit"
                  disabled={savingRem}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#14532D] px-3 py-2 font-semibold text-white hover:bg-[#166534]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {savingRem ? 'Guardando...' : 'Agregar alarma al calendario'}
                </button>
              </form>
            ) : (
              <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-[#4B6153]">
                <span>Inicia sesión como docente para crear nuevas alarmas.</span>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#14532D] px-3 py-1.5 font-semibold text-white"
                >
                  <Lock className="h-3 w-3" /> Iniciar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Register Sowing + Active Sowings List */}
      <section className="rounded-2xl border border-[#D9E2D7] bg-white p-6 shadow-xs sm:p-8">
        <h2 className="font-display text-xl font-bold text-[#14241B]">
          Registrar nueva siembra (genera alarmas automáticas)
        </h2>
        <p className="mt-0.5 text-xs text-[#4B6153]">
          Al elegir un cultivo y fecha de inicio, la plataforma programa automáticamente las revisiones de riego,
          trasplante, monitoreo de plagas y cosecha.
        </p>

        <div className="mt-4">
          {isTeacher ? (
            <form
              onSubmit={handleCreateSowing}
              className="grid gap-3 rounded-xl border border-[#E6EFE7] bg-[#F8FAF8] p-4 sm:grid-cols-2 lg:grid-cols-5"
            >
              <div>
                <label className="block text-xs font-semibold text-[#14241B]">Cultivo</label>
                <select
                  value={cropId}
                  onChange={(e) => setCropId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#C8D6CB] bg-white px-2.5 py-2 text-xs"
                >
                  {TILARAN_CROPS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.difficulty})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#14241B]">Era / Sector</label>
                <input
                  type="text"
                  value={bed}
                  onChange={(e) => setBed(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-[#C8D6CB] bg-white px-2.5 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#14241B]">Fecha inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#C8D6CB] bg-white px-2.5 py-2 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#14241B]">Plantas</label>
                <input
                  type="number"
                  min={1}
                  value={plants}
                  onChange={(e) => setPlants(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-[#C8D6CB] bg-white px-2.5 py-2 font-mono text-xs"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={savingSowing}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#14532D] px-3 py-2 text-xs font-semibold text-white hover:bg-[#166534]"
                >
                  <Plus className="h-4 w-4" />
                  Registrar siembra
                </button>
              </div>
              <div className="sm:col-span-2 lg:col-span-5">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas opcionales: abono usado, techo, barrera rompeviento..."
                  className="w-full rounded-lg border border-[#C8D6CB] bg-white px-3 py-1.5 text-xs"
                />
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DCE5DD] bg-[#F7FAF7] p-3.5 text-xs text-[#4B6153]">
              <span>Inicia sesión como docente para registrar siembras nuevas o marcar tareas completadas.</span>
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#14532D] px-3 py-1.5 font-semibold text-white"
              >
                <Lock className="h-3.5 w-3.5" />
                Iniciar sesión
              </button>
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {sowings.map((s) => (
            <article key={s.id} className="rounded-xl border border-[#DCE5DD] bg-[#FAFBF9] p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-xs font-semibold text-[#166534]">
                    {s.bed} · {formatDateCR(s.startDate)}
                  </div>
                  <h3 className="text-base font-bold text-[#14241B]">
                    {s.cropName}{' '}
                    <span className="font-mono text-xs font-medium text-[#4B6153]">({s.plants} pl.)</span>
                  </h3>
                </div>
                {isTeacher && (
                  <button
                    type="button"
                    onClick={() => onDeleteSowing(s.id)}
                    className="rounded-lg p-1 text-[#991B1B] hover:bg-[#FEE2E2]"
                    title="Eliminar siembra"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              {s.notes && <p className="mt-1 text-xs text-[#4B6153]">{s.notes}</p>}
            </article>
          ))}
        </div>
      </section>

      {/* 12-Month Plan 2027 */}
      <section className="rounded-2xl border border-[#D9E2D7] bg-white p-6 shadow-xs sm:p-8">
        <div className="flex items-center gap-2 border-b border-[#E6EFE7] pb-3.5">
          <CalendarIcon className="h-5 w-5 text-[#166534]" />
          <h2 className="font-display text-xl font-bold text-[#14241B]">
            Plan Anual Huerta Escolar y ECOTRON (Calendario de Tilarán)
          </h2>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#DCE5DD] bg-[#F7FAF7] text-[#14241B]">
                <th className="px-3 py-2.5 font-bold">Mes</th>
                <th className="px-3 py-2.5 font-bold">Clima típico en Tilarán</th>
                <th className="px-3 py-2.5 font-bold">Enfoque de Huerta</th>
                <th className="px-3 py-2.5 font-bold">Producción ECOTRON</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6EFE7]">
              {ANNUAL_PLAN_2027.map((row) => (
                <tr key={row.month} className="hover:bg-[#FAFBF9]">
                  <td className="px-3 py-2.5 font-bold text-[#14532D]">{row.month}</td>
                  <td className="px-3 py-2.5 text-[#33473B]">{row.climateTilaran}</td>
                  <td className="px-3 py-2.5 text-[#14241B]">{row.huertaFocus}</td>
                  <td className="px-3 py-2.5 text-[#33473B]">{row.ecotronFocus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
