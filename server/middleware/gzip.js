// Минимальное gzip middleware без внешних зависимостей.
// Сжимает JSON/текстовые ответы если клиент поддерживает и размер оправдан.

import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const MIN_SIZE = 1024; // <1кб не сжимаем — накладные расходы больше выигрыша

const shouldCompress = (req, res) => {
  const accept = req.headers['accept-encoding'] || '';
  if (!accept.includes('gzip')) return false;
  const type = res.getHeader('Content-Type') || '';
  return /json|text|javascript|xml|svg/.test(String(type));
};

export const gzipMiddleware = (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (body) => {
    if (!shouldCompress(req, res)) return originalJson(body);
    const raw = Buffer.from(JSON.stringify(body));
    if (raw.length < MIN_SIZE) return originalJson(body);
    try {
      const compressed = await gzipAsync(raw);
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Length', compressed.length);
      res.setHeader('Vary', 'Accept-Encoding');
      return res.end(compressed);
    } catch {
      return originalJson(body);
    }
  };
  next();
};
