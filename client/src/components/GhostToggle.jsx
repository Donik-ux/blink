import { Ghost, Eye } from 'lucide-react';

export const GhostToggle = ({ enabled, onChange }) => {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
          enabled ? 'bg-ghost/15 text-ghost shadow-[0_0_15px_rgba(255,214,10,0.25)]' : 'bg-white/5 text-accent'
        }`}>
          {enabled ? <Ghost size={18} /> : <Eye size={18} />}
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm leading-tight">Режим призрака</p>
          <p className="text-white/50 text-[11px] mt-0.5 truncate">
            {enabled ? 'Ты невидим для всех' : 'Все видят твоё место'}
          </p>
        </div>
      </div>
      <button
        onClick={() => { onChange(!enabled); if (navigator.vibrate) navigator.vibrate(10); }}
        className={`press relative w-12 h-7 rounded-full transition-colors shrink-0 ${
          enabled ? 'bg-ghost' : 'bg-white/15'
        }`}
        aria-label="Переключить режим призрака"
        role="switch"
        aria-checked={enabled}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow-md ${
            enabled ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
};
