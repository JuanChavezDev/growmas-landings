const STAGES = [
  { label: 'Atracción', x: 150, y: 30 },
  { label: 'Conversión', x: 264, y: 113 },
  { label: 'Operación', x: 220, y: 247 },
  { label: 'Relación', x: 80, y: 247 },
  { label: 'Crecimiento', x: 36, y: 113 },
]

function arcPath(x1: number, y1: number, x2: number, y2: number) {
  return `M ${x1} ${y1} A 120 120 0 0 1 ${x2} ${y2}`
}

export function CycleDiagram() {
  return (
    <div className="relative mx-auto h-[300px] w-[300px]">
      <div className="absolute inset-0 rounded-full bg-brand-glow blur-2xl" />

      <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="8"
            refX="4"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="#e07bc0" />
          </marker>
          <linearGradient id="arc-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b45cff" />
            <stop offset="100%" stopColor="#e07bc0" />
          </linearGradient>
        </defs>

        {STAGES.map((stage, i) => {
          const next = STAGES[(i + 1) % STAGES.length]
          return (
            <path
              key={stage.label}
              d={arcPath(stage.x, stage.y, next.x, next.y)}
              fill="none"
              stroke="url(#arc-gradient)"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
              opacity={0.6}
            />
          )
        })}
      </svg>

      <div
        className="absolute h-3 w-3 rounded-full bg-magenta shadow-[0_0_12px_4px_rgba(224,123,192,0.8)]"
        style={{
          offsetPath: 'circle(120px at 150px 150px)',
          animation: 'travel-cycle 9s linear infinite',
        }}
      />

      {STAGES.map((stage, i) => (
        <div
          key={stage.label}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{ left: stage.x, top: stage.y }}
        >
          <div
            className="h-3 w-3 rounded-full bg-violeta"
            style={{
              animation: 'pulse-node 9s ease-in-out infinite',
              animationDelay: `${(i * 9) / STAGES.length}s`,
            }}
          />
          <span className="mt-2 whitespace-nowrap rounded-full border border-berenjena bg-onix/80 px-3 py-1 text-xs font-medium text-hueso">
            {stage.label}
          </span>
        </div>
      ))}
    </div>
  )
}
