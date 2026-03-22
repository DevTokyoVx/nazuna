import https from 'https'
import fs from 'fs'
import verificarAPI from '../API.js'

const CONFIG_FILE = JSON.parse(
  fs.readFileSync(new URL('../../config.json', import.meta.url), 'utf8')
)

const cache = new Map()
const CACHE_TTL = 60 * 60 * 1000

function getCached(key) {
  const item = cache.get(key)
  if (!item) return null
  if (Date.now() - item.ts > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return item.val
}

function setCache(key, val) {
  if (cache.size >= 1000) {
    const oldest = cache.keys().next().value
    cache.delete(oldest)
  }
  cache.set(key, {
    val,
    ts: Date.now()
  })
}

function request(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch {
          reject(new Error('Resposta inválida da API'))
        }
      })
    }).on('error', reject)
  })
}

async function search(query) {


  const checkAPI = await verificarAPI()
  if (checkAPI !== true) {
    return { ok: false, msg: checkAPI }
  }

  try {
    if (!query) {
      return { ok: false, msg: 'Termo de pesquisa inválido' }
    }

    const cached = getCached(`search:${query}`)
    if (cached) return { ok: true, ...cached, cached: true }

    const { apikey_vex, site_vex } = CONFIG_FILE
    const url = `${site_vex}/api/pesquisa/tiktok?apikey=${apikey_vex}&query=${encodeURIComponent(query)}`
    
    const data = await request(url)


    const checkAfter = await verificarAPI(data)
    if (checkAfter !== true) {
      return { ok: false, msg: checkAfter }
    }

    if (!data?.status || !data?.results?.length) {
      return { ok: false, msg: 'Nenhum vídeo encontrado' }
    }

    const video = data.results[0]

    const result = {
      criador: 'null',
      title: video.title,
      urls: [video.no_watermark],
      type: 'video',
      mime: 'video/mp4',
      audio: video.music?.play || null,
      cover: video.cover,
      link: video.link,
      views: video.views
    }

    setCache(`search:${query}`, result)

    return { ok: true, ...result }

  } catch (err) {
    return { ok: false, msg: err.message }
  }
}

async function dl(url) {

  const checkAPI = await verificarAPI()
  if (checkAPI !== true) {
    return { ok: false, msg: checkAPI }
  }

  try {
    if (!url) {
      return { ok: false, msg: 'URL inválida' }
    }

    const cached = getCached(`download:${url}`)
    if (cached) return { ok: true, ...cached, cached: true }

    const { apikey_vex, site_vex } = CONFIG_FILE
    const api = `${site_vex}/api/downloads/tiktok?apikey=${apikey_vex}&query=${encodeURIComponent(url)}`
    
    const data = await request(api)

  const checkAfter = await verificarAPI(data)
    if (checkAfter !== true) {
      return { ok: false, msg: checkAfter }
    }

    const result = data?.result
    if (!result) {
      return { ok: false, msg: 'Não foi possível obter o vídeo' }
    }

    const response = {
      criador: 'Hiudy',
      title: result.desc,
      type: result.type,
      mime: 'video/mp4',
      urls: result.video?.playAddr || [],
      author: result.author?.nickname,
      username: result.author?.username,
      views: result.statistics?.playCount,
      likes: result.statistics?.likeCount,
      comments: result.statistics?.commentCount,
      shares: result.statistics?.shareCount
    }

    setCache(`download:${url}`, response)

    return { ok: true, ...response }

  } catch (err) {
    return { ok: false, msg: err.message }
  }
}

export { search, dl }