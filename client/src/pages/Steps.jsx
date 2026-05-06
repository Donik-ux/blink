import { useState, useEffect, useCallback } from 'react';
import { Trophy, Play, Square, Smartphone, RefreshCw, Footprints } from 'lucide-react';
import { getLeaderboard } from '../api/steps.js';
import { usePedometer } from '../hooks/usePedometer.js';
import { useAuthStore } from '../store/authStore.js';
import { Avatar } from '../components/Avatar.jsx';
import { BottomNav } from '../components/BottomNav.jsx';

const GOAL = 10000;

const formatSteps = (n) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`;
  return String(n);
};

const medal = (rank) => {
  if (rank === 0) return '🥇';
  if (rank === 1) return '🥈';
  if (rank === 2) return '🥉';
  return null;
};

export const Steps = () => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const {
    steps,
    isSupported,
    hasPermission,
    needsPermission,
    isTracking,
    requestPermission,
    startTracking,
    stopTracking,
  } = usePedometer();

  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLB, setLoadingLB] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    try {
      const data = await getLeaderboard();
      setLeaderboard(data);
    } catch {
      /* silent */
    } finally {
      setLoadingLB(false);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 60_000);
    return () => clearInterval(interval);
  }, [loadLeaderboard]);

  // Merge live local steps into leaderboard
  const mergedBoard = leaderboard.map((entry) =>
    entry.isMe ? { ...entry, steps: Math.max(entry.steps, steps) } : entry
  );
  mergedBoard.sort((a, b) => b.steps - a.steps);

  const progress = Math.min((steps / GOAL) * 100, 100);

  const handleToggle = async () => {
    if (isTracking) {
      stopTracking();
      return;
    }
    if (needsPermission && !hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    startTracking();
  };

  return (
    <div className="min-h-screen bg-bg pb-32 text-white safe-top">
      <div className="fixed top-0 inset-x-0 h-64 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-bg/85 backdrop-blur-2xl border-b border-white/5 safe-top">
        <div className="max-w-md mx-auto px-4 pt-4 pb-3 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Шаги
          </h1>
          <button
            onClick={loadLeaderboard}
            className="press p-2 hover:bg-white/10 rounded-xl transition-colors text-white/40"
            aria-label="Обновить"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-5 space-y-5 relative z-10">

        {/* My counter card */}
        <div className="bg-surface/50 border border-white/8 rounded-3xl p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Сегодня</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white tabular-nums">{formatSteps(steps)}</span>
                {steps >= 1000 && <span className="text-white/40 text-sm font-bold">{steps.toLocaleString()} шагов</span>}
                {steps < 1000 && <span className="text-white/40 text-sm font-bold">шагов</span>}
              </div>
              <p className="text-white/40 text-xs mt-1">Цель: {GOAL.toLocaleString()}</p>
            </div>

            <button
              onClick={handleToggle}
              disabled={!isSupported}
              className={`press w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-sm transition-all shrink-0 ${
                !isSupported
                  ? 'bg-white/5 text-white/20 cursor-not-allowed'
                  : isTracking
                  ? 'bg-red-500/20 border border-red-500/40 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                  : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
              }`}
              aria-label={isTracking ? 'Остановить' : 'Начать'}
            >
              {isTracking ? <Square size={22} /> : <Play size={22} />}
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-white/30 text-[10px]">{progress.toFixed(0)}%</span>
            <span className="text-white/30 text-[10px]">{GOAL.toLocaleString()} шагов</span>
          </div>

          {/* Status row */}
          <div className="mt-3 flex items-center gap-2">
            {!isSupported ? (
              <div className="flex items-center gap-2 text-white/30 text-xs">
                <Smartphone size={13} />
                <span>Датчик движения недоступен на этом устройстве</span>
              </div>
            ) : needsPermission && !hasPermission ? (
              <button
                onClick={requestPermission}
                className="press text-xs text-emerald-400 underline underline-offset-2"
              >
                Разрешить доступ к датчику движения
              </button>
            ) : (
              <div className={`flex items-center gap-2 text-xs font-semibold ${isTracking ? 'text-emerald-400' : 'text-white/30'}`}>
                <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
                {isTracking ? 'Отслеживание активно' : 'Нажми Play для подсчёта'}
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Trophy size={14} className="text-amber-400" />
            <h2 className="text-white/55 text-[11px] font-bold uppercase tracking-widest">Таблица лидеров</h2>
          </div>

          {loadingLB ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : mergedBoard.length === 0 ? (
            <div className="text-center py-8 px-4 bg-white/[0.03] border border-dashed border-white/8 rounded-2xl">
              <p className="text-white/50 text-sm font-semibold mb-1">Пока никого нет</p>
              <p className="text-white/30 text-xs">Добавь друзей, чтобы соревноваться</p>
            </div>
          ) : (
            <div className="space-y-2">
              {mergedBoard.map((entry, idx) => {
                const pct = entry.steps > 0 ? Math.min((entry.steps / GOAL) * 100, 100) : 0;
                const m = medal(idx);
                return (
                  <div
                    key={String(entry.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-colors ${
                      entry.isMe
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : 'bg-surface/50 border-white/5'
                    }`}
                  >
                    <div className="w-7 text-center shrink-0">
                      {m ? (
                        <span className="text-lg">{m}</span>
                      ) : (
                        <span className="text-white/30 text-sm font-bold">{idx + 1}</span>
                      )}
                    </div>

                    <Avatar name={entry.name} color={entry.color} avatar={entry.avatar} size="sm" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-white text-sm font-semibold truncate">{entry.name}</p>
                        {entry.isMe && (
                          <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/15 px-1.5 py-0.5 rounded-full shrink-0">Я</span>
                        )}
                      </div>
                      <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            entry.isMe ? 'bg-emerald-400' : 'bg-white/30'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`text-base font-black tabular-nums ${entry.isMe ? 'text-emerald-400' : 'text-white'}`}>
                        {formatSteps(entry.steps)}
                      </p>
                      <p className="text-white/30 text-[10px]">шагов</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
};
