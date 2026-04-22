import { Copy, Check, Share2, Sparkles } from 'lucide-react';
import { useState } from 'react';

const copyFallback = (text) => {
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {}
  document.body.removeChild(el);
  return ok;
};

export const InviteBox = ({ inviteCode }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteCode);
        ok = true;
      } else {
        ok = copyFallback(inviteCode);
      }
    } catch {
      ok = copyFallback(inviteCode);
    }
    if (ok) {
      setCopied(true);
      if (navigator.vibrate) navigator.vibrate(10);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const text = `Присоединяйся ко мне в Blink! Мой код: ${inviteCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Blink',
          text,
          url: window.location.origin,
        });
      } catch (error) {
        if (error?.name !== 'AbortError') console.warn('Share failed:', error);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/15 via-surface/60 to-accent3/15 border border-accent/20 p-4 backdrop-blur-xl">
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-accent3/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex items-center gap-2 mb-2">
        <Sparkles size={14} className="text-accent" />
        <p className="text-white/70 text-[11px] font-bold uppercase tracking-widest">Твой код приглашения</p>
      </div>

      <div className="relative flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="press flex-1 bg-black/40 hover:bg-black/60 rounded-xl py-3 transition-colors"
          title="Нажми чтобы скопировать"
        >
          <p className="text-accent text-2xl font-extrabold tracking-[0.3em] text-center">{inviteCode}</p>
        </button>
        <button
          onClick={handleCopy}
          className="press w-11 h-11 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-colors shrink-0"
          aria-label="Копировать код"
        >
          {copied ? <Check size={18} className="text-online" /> : <Copy size={18} className="text-accent" />}
        </button>
        <button
          onClick={handleShare}
          className="press w-11 h-11 flex items-center justify-center bg-accent/15 hover:bg-accent/25 rounded-xl transition-colors shrink-0"
          aria-label="Поделиться"
        >
          <Share2 size={18} className="text-accent" />
        </button>
      </div>

      {copied && <p className="text-online text-xs mt-2 text-center animate-fadeIn">Скопировано!</p>}
    </div>
  );
};
