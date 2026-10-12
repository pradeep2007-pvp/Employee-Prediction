interface LogoProps {
  size?: number;
  showText?: boolean;
  light?: boolean;
}

export function Logo({ size = 36, showText = true, light = false }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex items-center justify-center rounded-xl bg-gradient-to-br from-navy-700 to-navy-900 shadow-sm"
        style={{ width: size, height: size }}
      >
        <svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Person/HR icon merged with chart bar */}
          <circle cx="9" cy="7" r="3" />
          <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
          <path d="M17 11v6" />
          <path d="M20 14v3" />
          <path d="M14 14v3" />
        </svg>
      </div>
      {showText && (
        <div className="leading-tight">
          <p className={`font-bold text-base ${light ? 'text-white' : 'text-navy-900'}`}>HR DataMiner</p>
          <p className={`text-[10px] ${light ? 'text-navy-200' : 'text-slate-400'}`}>Workforce Intelligence</p>
        </div>
      )}
    </div>
  );
}
