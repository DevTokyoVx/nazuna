/**
 * Spotify Download - Implementação direta sem API externa
 * Usa api. vrenden.my.id para busca e spotisaver.net para download
 */

import axios from 'axios';

const SEARCH_BASE_URL = 'https://api.vreden.my.id';
const DOWNLOAD_BASE_URL = 'https://spotisaver.net';

// Cache simples
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
  if (cache.size >= 500) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { val, ts: Date.now() });
}

// Headers para spotisaver
const SPOTISAVER_HEADERS = {
  'accept': '*/*',
  'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
};

/**
 * Extrair ID da track do Spotify de uma URL
 */
function extractTrackId(url) {
  if (!url) return null;
  const trackMatch = url.match(/track\/([a-zA-Z0-9]+)/);
  return trackMatch ? trackMatch[1] : null;
}

/**
 * Valida se é uma URL válida do Spotify
 */
function isValidSpotifyUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('open.spotify.com/') || url.includes('spotify.com/');
}

/**
 * Busca músicas no Spotify
 * @param {string} query - Nome da música ou artista
 * @param {number} limit - Número de resultados
 * @returns {Promise<Object>} Resultados da busca
 */
async function search(query) {
  try {
    if (!query || typeof query !== 'string') {
      return {
        ok: false,
        msg: 'Query inválida'
      };
    }

    const cached = getCached(`search:${query}`);
    if (cached) return cached;

    const response = await axios.get(`${SEARCH_BASE_URL}/api/v2/search/spotify`, {
      params: {
        query: query,
      },
      timeout: 120000
    });

    if (!response.data || response.data.status_code !== 200) {
      return {
        ok: false,
        msg: 'Erro ao buscar no Spotify'
      };
    }

    const result = {
      ok: true,
      query,
      total: response.data.result?.length || 0,
      results: response.data.result.search_data || []
    };

    setCache(`search:${query}`, result);
    return result;
  } catch (error) {
    console.error('Erro na busca do Spotify:', error.message);
    return {
      ok: false,
      msg: 'Erro ao buscar no Spotify: ' + error.message
    };
  }
}

/**
 * Faz download direto de uma música do Spotify via URL
 * @param {string} url - URL do track do Spotify
 * @returns {Promise<Object>} Dados do download
 */
async function download(url) {
  try {
    // Validação melhorada da URL
    if (!isValidSpotifyUrl(url)) {
      console.log('[Spotify] URL inválida:', url);
      return {
        ok: false,
        msg: 'URL inválida do Spotify. Certifique-se de usar uma URL do Spotify válida.'
      };
    }

    // Verificar cache
    const cached = getCached(`download:${url}`);
    if (cached) return cached;

    // Extrair ID da track
    const trackId = extractTrackId(url);
    if (!trackId) {
      console.log('[Spotify] Não foi possível extrair ID da URL:', url);
      return {
        ok: false,
        msg: 'Não foi possível extrair o ID da música. Verifique se a URL está correta.'
      };
    }

    console.log(`[Spotify] Processando track ID: ${trackId}`);

    // Etapa 1: Obter informações da faixa
    const infoResponse = await axios.get(`${DOWNLOAD_BASE_URL}/api/get_playlist.php`, {
      params: {
        id: trackId,
        type: 'track',
        lang: 'en'
      },
      headers: {
        ...SPOTISAVER_HEADERS,
        'referer': `${DOWNLOAD_BASE_URL}/en/track/${trackId}/`
      },
      timeout: 120000
    });

    const trackData = infoResponse.data?.tracks?.[0];
    
    if (!trackData) {
      return {
        ok: false,
        msg: 'Informações da música não encontradas'
      };
    }

    console.log(`[Spotify] 🎵 Música: ${trackData.name}`);
    console.log(`[Spotify] 🎤 Artista: ${trackData.artists?.[0]}`);

    // Etapa 2: Preparar payload para download
    const payload = {
      track: {
        name: trackData.name,
        artists: trackData.artists || [],
        album: trackData.album,
        image: {
          url: trackData.image?.url,
          width: trackData.image?.width || 640,
          height: trackData.image?.height || 640
        },
        id: trackId,
        external_url: trackData.external_url,
        duration_ms: trackData.duration_ms,
        preview_url: trackData.preview_url || null,
        explicit: trackData.explicit || false,
        release_date: trackData.release_date
      },
      download_dir: 'downloads',
      filename_tag: 'SPOTISAVER',
      user_ip: '138.118.236.9',
      is_premium: false
    };

    // Etapa 3: Baixar a música
    console.log(`[Spotify] ⬇️  Iniciando download...`);
    
    const downloadResponse = await axios.post(
      `${DOWNLOAD_BASE_URL}/api/download_track.php`,
      payload,
      {
        headers: {
          ...SPOTISAVER_HEADERS,
          'content-type': 'application/json',
          'origin': DOWNLOAD_BASE_URL,
          'referer': `${DOWNLOAD_BASE_URL}/en/track/${trackId}/`
        },
        timeout: 120000,
        responseType: 'arraybuffer'
      }
    );

    console.log(`[Spotify] ✅ Download concluído`);

    const artists = Array.isArray(trackData.artists) ? trackData.artists : [trackData.artists];

    const result = {
      ok: true,
      buffer: Buffer.from(downloadResponse.data),
      title: trackData.name,
      artists: artists,
      albumImage: trackData.image?.url,
      year: trackData.release_date?.split('-')[0],
      duration: trackData.duration_ms,
      filename: `${artists.join(', ')} - ${trackData.name}.mp3`
    };

    setCache(`download:${url}`, result);
    return result;
  } catch (error) {
    console.error('Erro no download do Spotify:', error.message);
    
    if (error.response?.status === 404) {
      return {
        ok: false,
        msg: 'Música não encontrada no Spotify'
      };
    }
    
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return {
        ok: false,
        msg: 'Timeout ao baixar a música. Tente novamente.'
      };
    }

    return {
      ok: false,
      msg: error.message || 'Erro ao baixar do Spotify'
    };
  }
}

/**
 * Busca e faz download de uma música do Spotify
 * @param {string} query - Nome da música ou artista
 * @returns {Promise<Object>} Dados da busca e download
 */
async function searchDownload(query) {
  try {
    // Buscar primeiro resultado
    const searchResult = await search(query);
    
    if (!searchResult.ok || !searchResult.results?.length) {
      return {
        ok: false,
        msg: 'Nenhuma música encontrada com esse nome'
      };
    }

    const track = searchResult.results[0];
    
    if (!track.song_link) {
      return {
        ok: false,
        msg: 'Link da música não encontrado'
      };
    }

    // Fazer download
    const downloadResult = await download(track.song_link);
    
    if (!downloadResult.ok) {
      return downloadResult;
    }

    return {
      ok: true,
      buffer: downloadResult.buffer,
      query,
      track: {
        name: track.name,
        artists: track.artists,
        link: track.link
      },
      title: downloadResult.title,
      artists: downloadResult.artists,
      albumImage: downloadResult.albumImage,
      year: downloadResult.year,
      duration: downloadResult.duration,
      filename: downloadResult.filename
    };
  } catch (error) {
    console.error('Erro na busca/download do Spotify:', error.message);
    return {
      ok: false,
      msg: error.message || 'Erro ao buscar no Spotify'
    };
  }
}

export default {
  download,
  search,
  searchDownload
};