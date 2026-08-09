import { CheckCircle2 } from 'lucide-react'

export function ChatMockup() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-berenjena bg-noche/80 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-2 border-b border-berenjena pb-3">
        <div className="h-2.5 w-2.5 rounded-full bg-magenta" />
        <div className="h-2.5 w-2.5 rounded-full bg-violeta" />
        <div className="h-2.5 w-2.5 rounded-full bg-niebla" />
        <span className="ml-2 text-xs text-niebla">Sistema de Atención</span>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex justify-start">
          <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-berenjena/60 px-4 py-2 text-sm text-hueso">
            Hola, ¿cuánto cuesta el servicio?
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-brand-gradient px-4 py-2 text-sm text-onix">
            ¡Hola! Te respondo en segundos 👋 Te comparto la info ahora mismo.
          </div>
        </div>
        <div className="flex items-center gap-1 pl-1">
          <span className="h-1.5 w-1.5 animate-[typing-dot_1.2s_ease-in-out_infinite] rounded-full bg-niebla" />
          <span className="h-1.5 w-1.5 animate-[typing-dot_1.2s_ease-in-out_0.2s_infinite] rounded-full bg-niebla" />
          <span className="h-1.5 w-1.5 animate-[typing-dot_1.2s_ease-in-out_0.4s_infinite] rounded-full bg-niebla" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-full border border-berenjena bg-onix px-3 py-2 text-xs text-niebla">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-violeta" />
        Respondido automáticamente en 2 min
      </div>
    </div>
  )
}
