const COLUMNS = ['Captación', 'Atención', 'Seguimiento', 'Fidelización']

export function PipelineMockup() {
  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-berenjena bg-noche/80 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-2 border-b border-berenjena px-4 py-3">
        <div className="h-2.5 w-2.5 rounded-full bg-magenta" />
        <div className="h-2.5 w-2.5 rounded-full bg-violeta" />
        <div className="h-2.5 w-2.5 rounded-full bg-niebla" />
        <span className="ml-2 text-xs text-niebla">Sistema MAS — flujo del cliente</span>
      </div>
      <div className="relative grid grid-cols-4 gap-px bg-berenjena/40 p-px">
        {COLUMNS.map((col) => (
          <div key={col} className="bg-noche px-2 py-6 sm:px-3">
            <p className="text-center text-[10px] font-medium uppercase tracking-wide text-niebla sm:text-[11px]">
              {col}
            </p>
          </div>
        ))}
        <div className="pointer-events-none absolute top-1/2 h-7 w-7 -translate-y-1/2 animate-[chip-move_8s_ease-in-out_infinite] rounded-lg bg-brand-gradient shadow-[0_0_16px_rgba(180,92,255,0.6)] sm:h-8 sm:w-8" />
      </div>
    </div>
  )
}
