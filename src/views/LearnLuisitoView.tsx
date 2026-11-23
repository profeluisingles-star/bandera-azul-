import { useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  CloudRain,
  Download,
  Lock,
  Plus,
  Trash2,
  Wind,
} from 'lucide-react';
import { APRENDE_STEPS, TILARAN_CLIMATE_PROFILE } from '../data/agronomyData.ts';
import type { FieldLog, PlatformSettings } from '../types.ts';
import { downloadTextFile, escapeCsvCell, formatDateCR } from '../utils/format.ts';

interface LearnLuisitoViewProps {
  settings: PlatformSettings;
  fieldLogs: FieldLog[];
  isTeacher: boolean;
  onAddFieldLog: (entry: Omit<FieldLog, 'id'>) => Promise<void>;
  onDeleteFieldLog: (id: string) => Promise<void>;
  onOpenAuth: () => void;
}

const GLOSSARY = [
  {
    term: 'Lomillo o era alta',
    meaning:
      'Cama de cultivo elevada 20–30 cm sobre el pasillo para evacuar exceso de lluvia y evitar pudrición de raíces en Tilarán.',
  },
  {
    term: 'Acolchado (Mulch)',
    meaning:
      'Capa de pasto seco sin semilla u hojarasca sobre la tierra que reduce evaporación en época ventosa y frena salpicadura de hongos al llover.',
  },
  {
    term: 'Prueba del puño / dedo',
    meaning:
      'Revisar humedad a 2–3 cm antes de regar. Si la tierra forma bolita húmeda o sale fresca en el dedo, no se riega.',
  },
  {
    term: 'Chupón (en tomate)',
    meaning:
      'Brote secundario que nace en la axila entre el tallo principal y una rama; podarlo mejora ventilación y tamaño del fruto.',
  },
  {
    term: 'Período de carencia',
    meaning:
      'Días mínimos que deben pasar entre aplicar un caldo mineral o extracto botánico y cosechar el alimento.',
  },
  {
    term: 'Triple lavado',
    meaning:
      'Lavar y enjuagar tres veces cada botella plástica reutilizada, retirar 100 % la etiqueta original de bebida y rotular "USO AGRÍCOLA".',
  },
];

export function LearnLuisitoView({
  settings,
  fieldLogs,
  isTeacher,
  onAddFieldLog,
  onDeleteFieldLog,
  onOpenAuth,
}: LearnLuisitoViewProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);
  const [studentName, setStudentName] = useState('');
  const [cropOrArea, setCropOrArea] = useState('');
  const [observation, setObservation] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [saving, setSaving] = useState(false);

  const currentStep = APRENDE_STEPS.find((s) => s.step === activeStep) || APRENDE_STEPS[0];

  function toggleCompleted(stepNum: number) {
    setCompletedSteps((prev) =>
      prev.includes(stepNum) ? prev.filter((n) => n !== stepNum) : [...prev, stepNum]
    );
  }

  async function handleSaveLog(e: FormEvent) {
    e.preventDefault();
    if (!observation.trim()) return;
    setSaving(true);
    try {
      await onAddFieldLog({
        date: new Date().toISOString().slice(0, 10),
        studentName: studentName.trim() || 'Estudiante / Práctica',
        cropOrArea: cropOrArea.trim() || 'Huerta CTP Tronadora',
        observation: observation.trim(),
        actionTaken: actionTaken.trim(),
      });
      setObservation('');
      setActionTaken('');
    } finally {
      setSaving(false);
    }
  }

  function handleExportCsv() {
    const header = ['Fecha', 'Estudiante/Responsable', 'Cultivo o Área', 'Observación', 'Acción realizada'];
    const rows = fieldLogs.map((l) =>
      [l.date, l.studentName, l.cropOrArea, l.observation, l.actionTaken].map(escapeCsvCell).join(',')
    );
    downloadTextFile('bitacora-huerta-tronadora.csv', [header.join(','), ...rows].join('\n'), 'text/csv;charset=utf-8');
  }

  return (
    <div className="space-y-8">
      {/* Split Editorial Header */}
      <section className="overflow-hidden rounded-2xl border border-[#D9E2D7] bg-white shadow-xs">
        <div className="grid items-stretch lg:grid-cols-12">
          <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-7">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#166534]">
                Programa Práctico · {settings.locationLabel} · {settings.teacherName}
              </div>
              <h1 className="font-display mt-2 text-2xl font-bold leading-tight text-[#14241B] sm:text-3xl">
                Aprende con {settings.teacherName}: Agricultura desde cero para Tilarán
              </h1>
              <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-[#33473B]">
                Ruta paso a paso pensada para estudiantes y principiantes. Aprende cómo diseñar eras resistentes a los{' '}
                <strong>vientos alisios</strong> y a las <strong>lluvias intensas</strong> de Tilarán, cómo prevenir
                plagas y cómo llevar una bitácora real de campo.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-[#E6EFE7] pt-4 text-xs text-[#4B6153]">
              <div>
                Progreso practicado:{' '}
                <strong className="font-mono tabular-nums text-[#14532D]">
                  {completedSteps.length}/{APRENDE_STEPS.length} pasos
                </strong>
              </div>
              <span aria-hidden="true">·</span>
              <div>
                Registros de campo:{' '}
                <strong className="font-mono tabular-nums text-[#14532D]">{fieldLogs.length}</strong>
              </div>
            </div>
          </div>

          <div className="relative min-h-[220px] bg-[#14241B] lg:col-span-5">
            <img
              src="/src/assets/images/aprende_siembra_manos_1795456305998.jpg"
              alt="Manos estudiantiles trasplantando plántulas de huerta en tierra fértil"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#BBF7D0]">
                Práctica guiada desde cero
              </div>
              <div className="mt-0.5 text-sm font-semibold">
                Observación diaria, acolchado y manejo preventivo en campo
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive 9-step sandbox */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Step list */}
        <div className="space-y-2 lg:col-span-4">
          <div className="flex items-center justify-between px-1 text-xs font-bold uppercase tracking-wider text-[#4B6153]">
            <span>Ruta de aprendizaje (9 pasos)</span>
            <span className="font-mono tabular-nums text-[#14532D]">
              {completedSteps.length}/{APRENDE_STEPS.length} listos
            </span>
          </div>
          <div className="space-y-1.5">
            {APRENDE_STEPS.map((st) => {
              const isActive = st.step === activeStep;
              const isDone = completedSteps.includes(st.step);
              return (
                <button
                  key={st.step}
                  type="button"
                  onClick={() => setActiveStep(st.step)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                    isActive
                      ? 'border-[#14532D] bg-[#EAF3EC] text-[#14241B]'
                      : 'border-[#DCE5DD] bg-white text-[#33473B] hover:bg-[#F7FAF7]'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                      isDone
                        ? 'bg-[#14532D] text-white'
                        : isActive
                          ? 'bg-[#166534] text-white'
                          : 'bg-[#EDF3EE] text-[#14532D]'
                    }`}
                  >
                    {st.step}
                  </span>
                  <span className="flex-1 text-xs font-semibold leading-snug">{st.title}</span>
                  {isDone && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Step Detail */}
        <div className="rounded-2xl border border-[#D9E2D7] bg-white p-6 shadow-xs lg:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E6EFE7] pb-4">
            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#166534]">
                Paso {currentStep.step} de {APRENDE_STEPS.length}
              </div>
              <h2 className="font-display mt-1 text-2xl font-bold text-[#14241B]">{currentStep.title}</h2>
            </div>
            <button
              type="button"
              onClick={() => toggleCompleted(currentStep.step)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold ${
                completedSteps.includes(currentStep.step)
                  ? 'bg-[#14532D] text-white'
                  : 'border border-[#C8D6CB] bg-[#F7FAF7] text-[#14241B] hover:bg-[#EBF3EC]'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {completedSteps.includes(currentStep.step) ? 'Paso practicado' : 'Marcar como practicado'}
            </button>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[#33473B]">{currentStep.summary}</p>

          <div className="mt-4 rounded-xl border border-[#BFD8C4] bg-[#F2F8F3] p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#14532D]">
              Aplicación en Tilarán, Guanacaste
            </div>
            <p className="mt-1 text-sm leading-relaxed text-[#14241B]">{currentStep.tilaranNote}</p>
          </div>

          <div className="mt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#4B6153]">
              Lista de verificación en campo
            </h3>
            <ul className="mt-2.5 space-y-2">
              {currentStep.actionChecklist.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 rounded-lg border border-[#E6EFE7] bg-[#FAFBF9] px-3.5 py-2.5 text-sm text-[#14241B]"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#166534]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#FCD34D] bg-[#FEF3C7]/60 p-3.5 text-xs text-[#78350F]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#D97706]" />
            <span>
              <strong>Error común a evitar:</strong> {currentStep.mistakeToAvoid}
            </span>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-[#E6EFE7] pt-4">
            <button
              type="button"
              disabled={activeStep <= 1}
              onClick={() => setActiveStep((s) => Math.max(1, s - 1))}
              className="rounded-lg border border-[#DCE5DD] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#14241B] disabled:opacity-40"
            >
              Paso anterior
            </button>
            <button
              type="button"
              disabled={activeStep >= APRENDE_STEPS.length}
              onClick={() => setActiveStep((s) => Math.min(APRENDE_STEPS.length, s + 1))}
              className="rounded-lg bg-[#14532D] px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              Siguiente paso
            </button>
          </div>
        </div>
      </div>

      {/* Tilaran Seasons Guide */}
      <div className="grid gap-5 md:grid-cols-2">
        {TILARAN_CLIMATE_PROFILE.seasons.map((season, i) => (
          <div key={season.name} className="rounded-2xl border border-[#D9E2D7] bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2.5">
              {i === 0 ? (
                <Wind className="h-5 w-5 text-[#0284C7]" />
              ) : (
                <CloudRain className="h-5 w-5 text-[#15803D]" />
              )}
              <h3 className="font-display text-lg font-bold text-[#14241B]">{season.name}</h3>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[#4B6153]">{season.conditions}</p>
            <ul className="mt-3.5 space-y-2 border-t border-[#E6EFE7] pt-3.5">
              {season.actions.map((act, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-[#33473B]">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#166534]" />
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bitácora de Campo + Glosario */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-[#D9E2D7] bg-white p-6 shadow-xs lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6EFE7] pb-3.5">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#166534]" />
              <h2 className="font-display text-xl font-bold text-[#14241B]">Bitácora de observación en campo</h2>
            </div>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#C8D6CB] bg-[#F5F6F2] px-3 py-1.5 text-xs font-semibold text-[#14241B] transition-colors hover:bg-[#E7ECE5]"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar CSV
            </button>
          </div>

          {isTeacher ? (
            <form onSubmit={handleSaveLog} className="mt-4 grid gap-3 rounded-xl border border-[#E6EFE7] bg-[#F8FAF8] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Estudiante o grupo (ej. 10-B)"
                  className="rounded-lg border border-[#C8D6CB] bg-white px-3 py-2 text-xs text-[#14241B] focus:border-[#14532D] focus:outline-none"
                />
                <input
                  type="text"
                  value={cropOrArea}
                  onChange={(e) => setCropOrArea(e.target.value)}
                  placeholder="Cultivo o era (ej. Era #1 Tomate)"
                  className="rounded-lg border border-[#C8D6CB] bg-white px-3 py-2 text-xs text-[#14241B] focus:border-[#14532D] focus:outline-none"
                />
              </div>
              <textarea
                rows={2}
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="¿Qué observaste? (humedad, viento, manchas, insectos benéficos o plagas)"
                required
                className="rounded-lg border border-[#C8D6CB] bg-white px-3 py-2 text-xs text-[#14241B] focus:border-[#14532D] focus:outline-none"
              />
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="Acción realizada (ej. se colocó mulch y se amarraron tutores)"
                  className="min-w-[220px] flex-1 rounded-lg border border-[#C8D6CB] bg-white px-3 py-2 text-xs text-[#14241B] focus:border-[#14532D] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#166534] disabled:opacity-60"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {saving ? 'Guardando...' : 'Registrar nota'}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DCE5DD] bg-[#F7FAF7] p-3.5 text-xs text-[#4B6153]">
              <span>Inicia sesión como docente para guardar nuevas entradas en la bitácora oficial del colegio.</span>
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#14532D] px-3 py-1.5 font-semibold text-white hover:bg-[#166534]"
              >
                <Lock className="h-3.5 w-3.5" />
                Acceso Docente
              </button>
            </div>
          )}

          <div className="mt-4 space-y-2.5">
            {fieldLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-lg border border-[#E6EFE7] bg-[#FAFBF9] p-3 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-[#14241B]">
                    {log.cropOrArea} · <span className="font-medium text-[#166534]">{log.studentName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums text-[#4B6153]">{formatDateCR(log.date)}</span>
                    {isTeacher && (
                      <button
                        type="button"
                        onClick={() => onDeleteFieldLog(log.id)}
                        className="rounded p-1 text-[#991B1B] hover:bg-[#FEE2E2]"
                        title="Eliminar registro"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-[#33473B]">{log.observation}</p>
                {log.actionTaken && (
                  <p className="mt-1 font-medium text-[#14532D]">Acción: {log.actionTaken}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Glossary */}
        <div className="rounded-2xl border border-[#D9E2D7] bg-white p-6 shadow-xs lg:col-span-5">
          <div className="flex items-center gap-2 border-b border-[#E6EFE7] pb-3.5">
            <BookOpen className="h-5 w-5 text-[#166534]" />
            <h2 className="font-display text-xl font-bold text-[#14241B]">Glosario práctico de huerta</h2>
          </div>
          <div className="mt-3 divide-y divide-[#E6EFE7]">
            {GLOSSARY.map((item) => (
              <div key={item.term} className="py-2.5">
                <div className="text-xs font-bold text-[#14532D]">{item.term}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-[#4B6153]">{item.meaning}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
