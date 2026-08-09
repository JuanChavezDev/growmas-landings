import type { ComponentType } from 'react'

export function RadarIcon({ icon: Icon }: { icon: ComponentType<{ className?: string }> }) {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <span className="absolute h-16 w-16 animate-[radar-ping_3s_ease-out_infinite] rounded-full border border-violeta/40" />
      <span
        className="absolute h-11 w-11 animate-[radar-ping_3s_ease-out_infinite] rounded-full border border-magenta/40"
        style={{ animationDelay: '0.6s' }}
      />
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient">
        <Icon className="h-4 w-4 text-onix" />
      </span>
    </div>
  )
}
