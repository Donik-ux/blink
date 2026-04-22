import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, Ghost } from 'lucide-react';

export const Toast = ({ message, type = 'info', duration = 3000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true); // reset visibility when new message comes
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [message, duration, type]);

  if (!visible) return null;

  const config = {
    info: {
      border: 'border-accent/40',
      bg: 'bg-accent/10',
      shadow: 'shadow-[0_0_20px_rgba(0,217,255,0.2)]',
      icon: <Info size={18} className="text-accent" />,
      text: 'text-accent'
    },
    success: {
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-500/10',
      shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
      icon: <CheckCircle size={18} className="text-emerald-400" />,
      text: 'text-emerald-400'
    },
    error: {
      border: 'border-red-500/40',
      bg: 'bg-red-500/10',
      shadow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
      icon: <AlertCircle size={18} className="text-red-400" />,
      text: 'text-red-400'
    },
    ghost: {
      border: 'border-amber-500/40',
      bg: 'bg-amber-500/10',
      shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
      icon: <Ghost size={18} className="text-amber-400" />,
      text: 'text-amber-400'
    },
  }[type];

  // If bad type passed
  if (!config) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none flex justify-center px-4 pt-4 safe-top">
      <div className={`flex items-center gap-3 ${config.bg} backdrop-blur-xl border ${config.border} px-4 py-3 rounded-2xl ${config.shadow} animate-slideDown w-full max-w-md`}>
        <div className="shrink-0">{config.icon}</div>
        <p className={`text-sm font-semibold tracking-wide ${config.text}`}>{message}</p>
      </div>
    </div>
  );
};
