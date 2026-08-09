const ROWS = [80, 170, 260, 350]

export function HeroWaves() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
      viewBox="0 0 1440 440"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="wave-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#B45CFF" stopOpacity="0" />
          <stop offset="50%" stopColor="#B45CFF" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#E07BC0" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ROWS.map((y, i) => (
        <path
          key={y}
          d={`M -400 ${y} C -200 ${y - 60}, 0 ${y + 60}, 200 ${y} S 600 ${y - 60}, 800 ${y} S 1200 ${y - 60}, 1400 ${y} S 1800 ${y - 60}, 2000 ${y}`}
          fill="none"
          stroke="url(#wave-gradient)"
          strokeWidth="1.5"
          style={{
            animation: `wave-drift ${14 + i * 2}s linear infinite`,
            animationDelay: `${i * -3}s`,
          }}
        />
      ))}
    </svg>
  )
}
