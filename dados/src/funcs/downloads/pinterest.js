import https from 'https';
import fs from 'fs';
import verificarAPI from '../API.js';

const CONFIG_FILE = JSON.parse(
  fs.readFileSync(new URL('../../config.json', import.meta.url), 'utf8')
);

const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

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
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { val, ts: Date.now() });
}

function request(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Resposta inválida da API'));
        }
      });
    }).on('error', reject);
  });
}

async function search(query) {

  const checkAPI = await verificarAPI();
  if (checkAPI !== true) return { ok: false, msg: checkAPI };

  try {

    if (!query) {
      return { ok: false, msg: 'Termo de pesquisa inválido' };
    }

    const cached = getCached(`search:${query.toLowerCase()}`);
    if (cached) return { ok: true, ...cached, cached: true };

    const { apikey_vex, site_vex } = CONFIG_FILE;

    const url = `${site_vex}/api/pesquisas/pinterest?apikey=${apikey_vex}&query=${encodeURIComponent(query)}`;

    const data = await request(url);

    const checkAfter = await verificarAPI(data);
    if (checkAfter !== true) return { ok: false, msg: checkAfter };

    if (!data?.status || !data?.results?.length) {
      return { ok: false, msg: 'Nenhuma imagem encontrada' };
    }

    const urls = data.results.map(r => r.directLink).filter(Boolean);

    const result = {
      criador: 'Hiudy',
      type: 'image',
      mime: 'image/jpeg',
      query,
      count: urls.length,
      urls
    };

    setCache(`search:${query.toLowerCase()}`, result);

    return { ok: true, ...result };

  } catch (err) {
    return { ok: false, msg: err.message };
  }
}

async function dl(url) {

  const checkAPI = await verificarAPI();
  if (checkAPI !== true) return { ok: false, msg: checkAPI };

  try {

    if (!url) {
      return { ok: false, msg: 'URL inválida' };
    }

    const cached = getCached(`download:${url}`);
    if (cached) return { ok: true, ...cached, cached: true };

    const { apikey_vex, site_vex } = CONFIG_FILE;

    const api = `${site_vex}/api/pesquisas/pinterest?apikey=${apikey_vex}&query=${encodeURIComponent(url)}`;

    const data = await request(api);

    const checkAfter = await verificarAPI(data);
    if (checkAfter !== true) return { ok: false, msg: checkAfter };

    if (!data?.status || !data?.results?.length) {
      return { ok: false, msg: 'Não foi possível obter o conteúdo' };
    }

    const urls = data.results.map(r => r.directLink).filter(Boolean);

    const result = {
      criador: 'Hiudy',
      type: 'image',
      mime: 'image/jpeg',
      urls
    };

    setCache(`download:${url}`, result);

    return { ok: true, ...result };

  } catch (err) {
    return { ok: false, msg: err.message };
  }
}

export {
  search,
  dl
};