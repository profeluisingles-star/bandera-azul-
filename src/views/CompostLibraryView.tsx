import { useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, Calculator, CheckCircle2, Layers, Search, ShieldAlert } from 'lucide-react';
import { AGRO_LIBRARY, COMPOST_RECIPES } from '../data/agronomyData.ts';

export function CompostLibraryView() {
  const [bedLength, setBedLength] = useState(4);
  const [bedWidth, setBedWidth] = useState(1);
  const [bedCount, setBedCount] = useState(2);
  const [dosePerSqm, setDosePerSqm] = useState(3);
  const [libCategory, setLibCategory] = useState<string>('Todas');
  const [libSearch, setLibSearch] = useState('');

  const calc = useMemo(() => {
    const area = Math.max(0, bedLength) * Math.max(0, bedWidth) * Math.max(1, bedCount);
    const totalKg = Math.round(area * Math.max(0.5, dosePerSqm));
    const sacos25 = Math.ceil(totalKg / 25);
    const sacos10 = Math.ceil(totalKg / 10);
    return { area: area.toFixed(1), totalKg, sacos25, sacos10 };
  }, [bedLength, bedWidth, bedCount, dosePerSqm]);

  const categories = ['Todas', ...Array.from(new Set(AGRO_LIBRARY.map((c) => c.category)))];

  const filteredLibrary = useMemo(() => {
    const q = libSearch.trim().toLowerCase();
    return AGRO_LIBRARY.filter((item) => {
      if (libCategory !== 'Todas' && item.category !== libCategory) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [libCategory, libSearch]);

  return (
    <div className="space-y-6">
      {/* Compost Calculator */}
      <section className="rounded-xl border border-[#DCE5DD] bg-white p-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#166534]">
          <Calculator className="h-4 w-4" />
          Calculadora de Compost y Sacos para Eras
        </div>
        <h1 className="mt-1 text-2xl font-extrabold text-[#14241B]">
          Compostaje, Sustratos y Biblioteca Agroecológica
        </h1>
        <p className="mt-1 text-sm text-[#33473B]">
          Calcula cuántos kilos y sacos de TierraViva, VermiVida o BokaSuelo necesitas para preparar las eras antes
          de sembrar.
        </p>

        <div className="mt-5 grid gap-5 lg:grid-cols-12">
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
            <div>
              <label className="block text-xs font-semibold text-[#14241B]">Largo de cada era (m)</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={bedLength}
                onChange={(e) => setBedLength(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 font-mono text-sm text-[#14241B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#14241B]">Ancho de cada era (m)</label>
              <input
                type="number"
                min={0.5}
                step={0.1}
                value={bedWidth}
                onChange={(e) => setBedWidth(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 font-mono text-sm text-[#14241B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#14241B]">Cantidad de eras</label>
              <input
                type="number"
                min={1}
                step={1}
                value={bedCount}
                onChange={(e) => setBedCount(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-[#C8D6CB] px-3 py-2 font-mono text-sm text-[#14241B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#14241B]">Dosis estimada (kg/m²)</label>
              <select
                value={dosePerSqm}
                onChange={(e) => setDosePerSqm(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-[#C8D6CB] bg-white px-3 py-2 text-sm text-[#14241B]"
              >
                <option value={2}>2 kg/m² · Mantenimiento ligero</option>
                <option value={3}>3 kg/m² · Preparación estándar</option>
                <option value={4}>4 kg/m² · Suelo pobre / tomate y chile</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-[#BFD8C4] bg-[#F2F8F3] p-5 lg:col-span-5">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#166534]">
                Resultado estimado
              </div>
              <div className="mt-2 font-mono text-3xl font-extrabold tabular-nums text-[#14532D]">
                {calc.totalKg} kg de compost
              </div>
              <div className="mt-1 text-xs text-[#33473B]">
                Superficie total: <strong className="font-mono tabular-nums">{calc.area} m²</strong>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5 border-t border-[#C8DEC9] pt-3">
              <div className="rounded-lg bg-white px-3 py-2">
                <div className="text-[11px] text-[#4B6153]">Equivalente en sacos 25 kg</div>
                <div className="font-mono text-lg font-bold tabular-nums text-[#14241B]">
                  {calc.sacos25} sacos
                </div>
              </div>
              <div className="rounded-lg bg-white px-3 py-2">
                <div className="text-[11px] text-[#4B6153]">Equivalente en sacos 10 kg</div>
                <div className="font-mono text-lg font-bold tabular-nums text-[#14241B]">
                  {calc.sacos10} sacos
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Compost Recipes */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Layers className="h-5 w-5 text-[#166534]" />
          <h2 className="text-xl font-bold text-[#14241B]">Recetas de Compostaje y Sustratos</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {COMPOST_RECIPES.map((rec) => (
            <article key={rec.id} className="rounded-xl border border-[#DCE5DD] bg-white p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#166534]">
                    {rec.duration} · Nivel {rec.difficulty}
                  </div>
                  <h3 className="mt-0.5 text-lg font-bold text-[#14241B]">{rec.name}</h3>
                </div>
              </div>
              <p className="mt-1 text-xs text-[#4B6153]">{rec.bestFor}</p>

              <div className="mt-3 rounded-lg bg-[#F7FAF7] p-3">
                <div className="text-xs font-bold text-[#14241B]">Materiales base</div>
                <ul className="mt-1 space-y-1 text-xs text-[#33473B]">
                  {rec.ingredients.map((ing, i) => (
                    <li key={i}>• {ing}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-3">
                <div className="text-xs font-bold text-[#14241B]">Pasos clave</div>
                <ol className="mt-1 space-y-1 text-xs text-[#33473B]">
                  {rec.steps.map((st, i) => (
                    <li key={i}>
                      <span className="font-mono font-bold text-[#14532D]">{i + 1}.</span> {st}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-3 space-y-2 border-t border-[#E6EFE7] pt-3 text-xs">
                <div className="flex items-start gap-1.5 text-[#166534]">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    <strong>Señal de madurez:</strong> {rec.readySign}
                  </span>
                </div>
                <div className="flex items-start gap-1.5 text-[#92400E]">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    <strong>Cuidado:</strong> {rec.caution}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Biblioteca Agroecológica */}
      <section className="rounded-xl border border-[#DCE5DD] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6EFE7] pb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#166534]" />
            <div>
              <h2 className="text-xl font-bold text-[#14241B]">
                Biblioteca Agroecológica (Caldos, Empaques Seguros y MIP)
              </h2>
              <p className="text-xs text-[#4B6153]">
                Fichas técnicas con nivel de seguridad para estudiantes y trabajo supervisado por el docente.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4B6153]" />
            <input
              type="search"
              value={libSearch}
              onChange={(e) => setLibSearch(e.target.value)}
              placeholder="Buscar caldo, botella, saco, MIP..."
              className="w-full rounded-lg border border-[#C8D6CB] bg-[#FAFBF9] py-1.5 pl-9 pr-3 text-xs text-[#14241B]"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setLibCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                libCategory === cat
                  ? 'bg-[#14532D] text-white'
                  : 'border border-[#DCE5DD] bg-[#F7FAF7] text-[#33473B] hover:bg-[#EBF2EC]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {filteredLibrary.map((card) => (
            <article key={card.id} className="rounded-xl border border-[#DCE5DD] bg-[#FAFBF9] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#166534]">
                  {card.category}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                    card.riskLevel === 'Bajo riesgo'
                      ? 'border border-[#86EFAC] bg-[#F0FDF4] text-[#166534]'
                      : card.riskLevel === 'Con supervisión docente'
                        ? 'border border-[#FCD34D] bg-[#FEF3C7] text-[#92400E]'
                        : 'border border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B]'
                  }`}
                >
                  <ShieldAlert className="h-3 w-3" />
                  {card.riskLevel}
                </span>
              </div>

              <h3 className="mt-1.5 text-base font-bold text-[#14241B]">{card.title}</h3>
              <p className="mt-1 text-xs text-[#4B6153]">{card.summary}</p>

              <div className="mt-3 space-y-1 text-xs text-[#14241B]">
                <div className="font-bold">Materiales / Ingredientes:</div>
                {card.ingredientsOrTools.map((x, idx) => (
                  <div key={idx} className="text-[#33473B]">
                    • {x}
                  </div>
                ))}
              </div>

              <div className="mt-3 space-y-1 text-xs text-[#14241B]">
                <div className="font-bold">Procedimiento:</div>
                {card.preparationOrMethod.map((x, idx) => (
                  <div key={idx} className="text-[#33473B]">
                    {idx + 1}. {x}
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-lg border border-[#FCD34D] bg-[#FEF3C7]/60 px-3 py-2 text-xs text-[#78350F]">
                <strong>Regla preventiva:</strong> {card.preventionRule}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
