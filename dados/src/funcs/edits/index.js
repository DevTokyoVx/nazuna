import https from 'https';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import verificarAPI from '../API.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const CONFIG_FILE = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../config.json'), 'utf8')
);


const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;

  if (Date.now() - item.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return item.val;
}

function setCache(key, val) {
  if (cache.size >= 1000) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, { val, ts: Date.now() });
}


function requestBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      const chunks = [];

      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}


async function geraredit({ query, type }) {
  const checkAPI = await verificarAPI();
  if (checkAPI !== true) return { ok: false, msg: checkAPI };

  try {
    if (!query || !type) {
      return { ok: false, msg: '❌ Parâmetros obrigatórios não informados.' };
    }

    const cacheKey = `edit:${type}:${query}`;
    const cached = getCached(cacheKey);
    if (cached) return { ok: true, ...cached, cached: true };

    const { apikey_vex, site_vex } = CONFIG_FILE;

    const url = `${site_vex}/api/edits/${encodeURIComponent(type)}?apikey=${apikey_vex}&query=${encodeURIComponent(query)}`;


    const apiCheck = await verificarAPI();
    if (apiCheck !== true) {
      return { ok: false, msg: apiCheck };
    }

    const buffer = await requestBuffer(url);

    if (!buffer || buffer.length === 0) {
      return { ok: false, msg: '❌ Resposta não é uma imagem válida.' };
    }

    const response = { buffer };

    setCache(cacheKey, response);

    return { ok: true, ...response };

  } catch (err) {
    return { ok: false, msg: `❌ Erro ao gerar o logo: ${err.message}` };
  }
}

export { geraredit };