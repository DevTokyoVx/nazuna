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

async function dl(url) {


  const checkAPI = await verificarAPI()
  if (checkAPI !== true) {
    return { ok: false, msg: checkAPI }
  }

  try {

    if (!url) {
      return {
        ok: false,
        msg: 'URL inválida'
      }
    }

    const cached = getCached(`download:${url}`)
    if (cached) return { ok: true, ...cached, cached: true }

    const { apikey_vex, site_vex } = CONFIG_FILE

    const api =
      `${site_vex}/api/downloads/instagram?apikey=${apikey_vex}&query=${encodeURIComponent(url)}`

    const data = await request(api)


    const checkAfter = await verificarAPI(data)
    if (checkAfter !== true) {
      return { ok: false, msg: checkAfter }
    }

    if (!data?.status || !data?.resposta?.medias?.length) {
      return {
        ok: false,
        msg: 'Postagem não encontrada'
      }
    }

    const medias = data.resposta.medias

    const results = medias.map(m => ({
      type: m.type,
      url: m.url,
      mime: m.type === 'image' ? 'image/jpeg' : 'video/mp4'
    }))

    const result = {
      criador: 'null',
      data: results,
      count: results.length
    }

    setCache(`download:${url}`, result)

    return {
      ok: true,
      ...result
    }

  } catch (err) {

    return {
      ok: false,
      msg: 'Erro ao baixar post: ' + err.message
    }

  }

}

export {
  dl
}