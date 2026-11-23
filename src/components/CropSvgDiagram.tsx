interface CropSvgDiagramProps {
  type: 'spots' | 'holes' | 'rot' | 'bugs' | 'wilt';
}

export function CropSvgDiagram({ type }: CropSvgDiagramProps) {
  return (
    <svg
      viewBox="0 0 120 84"
      className="h-20 w-28 shrink-0 rounded-lg border border-[#DCE5DD] bg-[#F7FAF7]"
      role="img"
      aria-label={`Diagrama visual de síntoma: ${type}`}
    >
      {/* Leaf base for spots / holes / bugs */}
      {(type === 'spots' || type === 'holes' || type === 'bugs') && (
        <g>
          <path
            d="M22 62 C20 34, 48 16, 94 20 C90 48, 66 72, 22 62 Z"
            fill="#C7E4CA"
            stroke="#166534"
            strokeWidth="2"
          />
          <path d="M22 62 Q58 40 94 20" fill="none" stroke="#166534" strokeWidth="1.5" />
        </g>
      )}

      {type === 'spots' && (
        <g>
          <circle cx="48" cy="40" r="6" fill="#92400E" opacity="0.85" />
          <circle cx="48" cy="40" r="8.5" fill="none" stroke="#D97706" strokeWidth="1.5" />
          <circle cx="67" cy="31" r="4.5" fill="#78350F" opacity="0.85" />
          <circle cx="63" cy="49" r="5" fill="#92400E" opacity="0.8" />
        </g>
      )}

      {type === 'holes' && (
        <g>
          <circle cx="46" cy="41" r="5" fill="#F7FAF7" stroke="#92400E" strokeWidth="1.5" />
          <circle cx="66" cy="34" r="4" fill="#F7FAF7" stroke="#92400E" strokeWidth="1.5" />
          <path d="M77 45 Q84 42 82 51 Q76 52 77 45 Z" fill="#F7FAF7" stroke="#92400E" strokeWidth="1.5" />
        </g>
      )}

      {type === 'bugs' && (
        <g>
          <ellipse cx="48" cy="39" rx="3.2" ry="2.2" fill="#DC2626" />
          <ellipse cx="56" cy="43" rx="3" ry="2" fill="#DC2626" />
          <ellipse cx="66" cy="33" rx="3.5" ry="2.2" fill="#D97706" />
          <circle cx="74" cy="41" r="2.2" fill="#B45309" />
        </g>
      )}

      {type === 'rot' && (
        <g>
          <rect x="10" y="58" width="100" height="18" rx="3" fill="#D6C7B2" />
          <path d="M60 16 L60 60" stroke="#166534" strokeWidth="5" strokeLinecap="round" />
          <path d="M60 32 Q42 22 32 30" fill="none" stroke="#166534" strokeWidth="3" />
          <path d="M60 28 Q78 18 88 26" fill="none" stroke="#166534" strokeWidth="3" />
          <ellipse cx="60" cy="57" rx="10" ry="6" fill="#78350F" opacity="0.9" />
          <path d="M40 60 Q50 56 60 60 Q70 64 82 59" fill="none" stroke="#0284C7" strokeWidth="1.8" />
        </g>
      )}

      {type === 'wilt' && (
        <g>
          <rect x="10" y="60" width="100" height="16" rx="3" fill="#D6C7B2" />
          <path d="M60 60 Q58 36 46 28" fill="none" stroke="#65A30D" strokeWidth="4" strokeLinecap="round" />
          <path d="M52 34 Q36 38 34 52" fill="none" stroke="#A16207" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M56 42 Q76 44 80 55" fill="none" stroke="#A16207" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="60" cy="60" rx="8" ry="4" fill="#7F1D1D" />
        </g>
      )}
    </svg>
  );
}
