import https from 'https';
import fs from 'fs';
import verificarAPI from '../API.js';

const CONFIG_FILE = JSON.parse(
  fs.readFileSync(new URL('../../config.json', import.meta.url), 'utf8')
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

function requestJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

function requestBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function gerarLogo({ query, type }) {
  const checkAPI = await verificarAPI();
  if (checkAPI !== true) return { ok: false, msg: checkAPI };

  try {
    if (!query || !type) {
      return { ok: false, msg: '❌ Parâmetros obrigatórios não informados.' };
    }

    const cacheKey = `logo:${type}:${query}`;
    const cached = getCached(cacheKey);
    if (cached) return { ok: true, ...cached, cached: true };

    const { apikey_vex, site_vex } = CONFIG_FILE;
    const url = `${site_vex}/api/logos/${encodeURIComponent(type)}?apikey=${apikey_vex}&query=${encodeURIComponent(query)}`;

    const json = await requestJSON(url);

    const checkAfter = await verificarAPI(json);
    if (checkAfter !== true) {
      return { ok: false, msg: checkAfter };
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

export { gerarLogo };