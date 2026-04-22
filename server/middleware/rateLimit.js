// Простой in-memory rate limiter без внешних зависимостей.
// Счётчики живут только в памяти — при перезапуске сбрасываются.

const createLimiter = ({ windowMs, max, keyFn, message }) => {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits.entries()) {
      if (v.resetAt <= now) hits.delete(k);
    }
  }, Math.max(windowMs, 60_000)).unref?.();

  return (req, res, next) => {
    const key = keyFn ? keyFn(req) : req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({ error: message || 'Слишком много запросов, попробуй позже' });
    }
    next();
  };
};

// 5 попыток входа за 10 минут на IP
export const authLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: 'Слишком много попыток входа. Попробуй через несколько минут.',
});

// 100 запросов в минуту на IP — общий защитный лимит
export const apiLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 200,
});
