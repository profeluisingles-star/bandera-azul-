import { useState } from 'react';
import { Leaf, ShieldCheck } from 'lucide-react';
import type { PlatformSettings } from '../types.ts';

interface LogoStripProps {
  settings: PlatformSettings;
  compact?: boolean;
}

function LogoImage({
  src,
  alt,
  fallbackLabel,
}: {
  src: string;
  alt: string;
  fallbackLabel: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-[#EDF4EE] text-[10px] font-bold tracking-tight text-[#14532D]"
        title={alt}
      >
        {fallbackLabel}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-full w-full object-contain"
    />
  );
}

export function LogoStrip({ settings, compact = false }: LogoStripProps) {
  const boxSize = compact ? 'h-9 w-9 p-1' : 'h-14 w-14 p-1.5';
  return (
    <div className="flex items-center gap-2">
      <div
        className={`${boxSize} shrink-0 overflow-hidden rounded-lg border border-[#DCE5DD] bg-white`}
        title="Colegio Técnico Profesional de Tronadora"
      >
        <LogoImage src={settings.ctpLogoUrl} alt="Logo CTP Tronadora" fallbackLabel="CTP" />
      </div>
      <div
        className={`${boxSize} shrink-0 overflow-hidden rounded-lg border border-[#DCE5DD] bg-white`}
        title="ECOTRON · Empresa Estudiantil Agroecológica"
      >
        <LogoImage src={settings.ecotronLogoUrl} alt="Logo ECOTRON" fallbackLabel="ECO" />
      </div>
      <div
        className={`${boxSize} shrink-0 overflow-hidden rounded-lg border border-[#DCE5DD] bg-white`}
        title="Programa Bandera Azul Ecológica"
      >
        <LogoImage src={settings.banderaLogoUrl} alt="Logo Bandera Azul Ecológica" fallbackLabel="BAE" />
      </div>
      {!compact && (
        <div className="hidden pl-2 sm:block">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#166534]">
            <Leaf className="h-3.5 w-3.5" />
            <span>{settings.schoolName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#4B6153]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#0284C7]" />
            <span>{settings.locationLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}
