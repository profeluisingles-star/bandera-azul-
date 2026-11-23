import { useState, type FormEvent } from 'react';
import {
  CloudRain,
  Droplets,
  Lock,
  Plus,
  Ruler,
  ShieldAlert,
  Sprout,
  Sun,
  Wind,
} from 'lucide-react';
import { TILARAN_CROPS } from '../data/agronomyData.ts';
import type { Sowing } from '../types.ts';
import { CropSvgDiagram } from '../components/CropSvgDiagram.tsx';

interface CropsViewProps {
  isTeacher: boolean;
  onAddSowing: (sowing: Omit<Sowing, 'id' | 'completedTasks'>) => Promise<void>;
  onOpenAuth: () => void;
}

export function CropsView({ isTeacher, onAddSowing, onOpenAuth }: CropsViewProps) {
  const [selectedId, setSelectedId] = useState<string>(TILARAN_CROPS[0].id);
  const [bed, setBed] = useState('Era Alta #1');
  const [plants, setPlants] = useState(25);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState('');

  const crop = TILARAN_CROPS.find((c) => c.id === selectedId) || TILARAN_CROPS[0];

  async function handleQuickSowing(e: FormEvent) {
    e.preventDefault();
    if (!bed.trim()) return;
    setSaving(true);
    setSavedBanner('');
    try {
      await onAddSowing({
        cropId: crop.id,
        cropName: crop.name,
        bed: bed.trim(),
        startDate: new Date().toISOString().slice(0, 10),
        plants: Math.max(1, Number(plants) || 10),
        notes: notes.trim() || `Siembra de ${crop.name} adaptada a Tilarán`,
      });
      setNotes('');
      setSavedBanner(`Siembra de ${crop.name} registrada en "${bed}".`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-[#D9E2D7] bg-white p-6 shadow-xs sm:p-8">
        <div className="text-xs font-bold uppercase tracking-wider text-[#166534]">
          Guías Agronómicas · Tilarán, Guanacaste
        </div>
        <h1 className="font-display mt-1.5 text-2xl font-bold text-[#14241B] sm:text-3xl">
          Cómo cultivar hortalizas en nuestra zona y prevenir enfermedades
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#33473B]">
          Selecciona un cultivo para consultar época en Tilarán, distancia, profundidad, manejo del viento alisio y
          prevención de plagas y hongos.
        </p>

        {/* Segmented crop selector */}
        <div className="mt-5 inline-flex flex-wrap gap-1 rounded-xl bg-[#E7ECE5] p-1">
          {TILARAN_CROPS.map((c) => {
            const active = c.id === crop.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedId(c.id);
                  setSavedBanner('');
                }}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-150 ${
                  active
                    ? 'bg-[#14532D] text-white shadow-xs'
                    : 'text-[#33473B] hover:bg-white/70 hover:text-[#14241B]'
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected Crop Detail */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="rounded-2xl border border-[#D9E2D7] bg-white p-6 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E6EFE7] pb-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#166534]">
                  {crop.family} · <em>{crop.scientific}</em> · Nivel {crop.difficulty}
                </div>
                <h2 className="font-display mt-1 text-2xl font-bold text-[#14241B] sm:text-3xl">{crop.name}</h2>
              </div>
              <div className="rounded-xl border border-[#D9E2D7] bg-[#F5F6F2] px-3.5 py-2 text-right">
                <div className="text-[11px] font-semibold text-[#4B6153]">Cosecha estimada</div>
                <div className="font-mono text-sm font-bold tabular-nums text-[#14532D]">
                  {crop.harvestDays[0]}–{crop.harvestDays[1]} días
                </div>
              </div>
            </div>

            {/* Tilaran adaptation grid */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[#DCE5DD] bg-[#F7FAF7] p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#14241B]">
                  <Sun className="h-4 w-4 text-[#D97706]" />
                  Época en Tilarán
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#33473B]">{crop.tilaranWindow}</p>
              </div>
              <div className="rounded-lg border border-[#DCE5DD] bg-[#F7FAF7] p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#14241B]">
                  <Wind className="h-4 w-4 text-[#0284C7]" />
                  Sensibilidad al viento: {crop.windSensitivity}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#33473B]">{crop.sun}</p>
              </div>
              <div className="rounded-lg border border-[#DCE5DD] bg-[#F7FAF7] p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#14241B]">
                  <CloudRain className="h-4 w-4 text-[#15803D]" />
                  Manejo de lluvia
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#33473B]">{crop.rainManagement}</p>
              </div>
            </div>

            {/* Agronomic Specs */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[#E6EFE7] p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#14532D]">
                  <Ruler className="h-4 w-4" />
                  Espaciamiento y profundidad
                </div>
                <p className="mt-1 text-xs text-[#33473B]">
                  <strong>Distancia:</strong> {crop.spacing}
                </p>
                <p className="mt-1 text-xs text-[#33473B]">
                  <strong>Profundidad:</strong> {crop.depth}
                </p>
              </div>
              <div className="rounded-lg border border-[#E6EFE7] p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#14532D]">
                  <Droplets className="h-4 w-4" />
                  Riego y suelo
                </div>
                <p className="mt-1 text-xs text-[#33473B]">
                  <strong>Suelo:</strong> {crop.soil}
                </p>
                <p className="mt-1 text-xs text-[#33473B]">
                  <strong>Riego:</strong> {crop.water}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[#E6EFE7] bg-[#FAFBF9] p-3.5 text-xs text-[#33473B]">
              <div>
                <strong className="text-[#14241B]">Nutrición recomendada:</strong> {crop.nutrition}
              </div>
              <div className="mt-1.5">
                <strong className="text-[#14241B]">Cosecha:</strong> {crop.harvestText}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4B6153]">
                Consejos clave en finca escolar
              </h3>
              <ul className="mt-2 space-y-1.5">
                {crop.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#14241B]">
                    <Sprout className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#166534]" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Diseases & Prevention */}
          <div className="rounded-2xl border border-[#D9E2D7] bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[#E6EFE7] pb-3.5">
              <ShieldAlert className="h-5 w-5 text-[#D97706]" />
              <h3 className="font-display text-xl font-bold text-[#14241B]">
                Plagas, síntomas y cómo prevenir en {crop.name}
              </h3>
            </div>
            <div className="mt-4 space-y-3">
              {crop.diseases.map((dis) => (
                <div
                  key={dis.name}
                  className="flex flex-col gap-3 rounded-xl border border-[#E6EFE7] bg-[#FAFBF9] p-4 sm:flex-row sm:items-start"
                >
                  <CropSvgDiagram type={dis.diagramType} />
                  <div className="flex-1 text-xs">
                    <div className="text-sm font-bold text-[#14241B]">{dis.name}</div>
                    <p className="mt-1 text-[#4B6153]">
                      <strong className="text-[#14241B]">Síntoma:</strong> {dis.symptom}
                    </p>
                    <p className="mt-1.5 rounded-lg border border-[#D4E7D7] bg-[#F2F8F3] p-2.5 text-[#14532D]">
                      <strong>Cómo prevenir y actuar:</strong> {dis.prevention}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Sowing Sidebar */}
        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-2xl border border-[#D9E2D7] bg-white p-6 shadow-xs">
            <h3 className="font-display text-lg font-bold text-[#14241B]">Registrar siembra de {crop.name}</h3>
            <p className="mt-1 text-xs text-[#4B6153]">
              Agrega este cultivo al calendario escolar para calcular tareas de revisión y cosecha.
            </p>

            {isTeacher ? (
              <form onSubmit={handleQuickSowing} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#14241B]">Era o sector</label>
                  <input
                    type="text"
                    value={bed}
                    onChange={(e) => setBed(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 text-xs text-[#14241B] focus:border-[#14532D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14241B]">Cantidad de plantas / puntos</label>
                  <input
                    type="number"
                    min={1}
                    value={plants}
                    onChange={(e) => setPlants(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 font-mono text-xs text-[#14241B] focus:border-[#14532D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14241B]">Observación inicial</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej. bajo malla contra viento, con TierraViva"
                    className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 text-xs text-[#14241B] focus:border-[#14532D] focus:outline-none"
                  />
                </div>
                {savedBanner && (
                  <div className="rounded-lg border border-[#86EFAC] bg-[#F0FDF4] px-3 py-2 text-xs font-medium text-[#166534]">
                    {savedBanner}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#14532D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#166534] disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {saving ? 'Guardando...' : 'Agregar a Siembras'}
                </button>
              </form>
            ) : (
              <div className="mt-4 space-y-3 rounded-lg border border-[#DCE5DD] bg-[#F7FAF7] p-3.5 text-xs text-[#4B6153]">
                <p>El registro oficial de siembras en el calendario del colegio está habilitado en Modo Docente.</p>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#14532D] px-3 py-2 font-semibold text-white hover:bg-[#166534]"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Desbloquear Modo Docente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
