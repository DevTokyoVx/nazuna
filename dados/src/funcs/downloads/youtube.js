import https from 'https'
import fs from 'fs'
import verificarAPI from '../API.js'

const CONFIG_FILE = JSON.parse(
  fs.readFileSync(new URL('../../config.json', import.meta.url), 'utf8')
)

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

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    }).on('error', reject)
  })
}

async function search(query) {
  const checkAPI = await verificarAPI()
  if (checkAPI !== true) return { ok: false, msg: checkAPI }

  try {
    const { apikey_vex, site_vex } = CONFIG_FILE
    const url = `${site_vex}/api/pesquisa/youtube?apikey=${apikey_vex}&query=${encodeURIComponent(query)}`

    const data = await request(url)


    const checkAfter = await verificarAPI(data)
    if (checkAfter !== true) return { ok: false, msg: checkAfter }

    if (!data?.status) {
      throw new Error('Erro ao buscar vídeo')
    }

    const results = data.results
    if (!results || results.length === 0) {
      return { ok: false, msg: 'Nenhum vídeo encontrado' }
    }

    const video = results[0]

    return {
      ok: true,
      data: {
        videoId: video.videoId,
        url: video.url,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail,
        seconds: video.seconds,
        timestamp: video.timestamp,
        views: video.views,
        ago: video.ago,
        author: video.author?.name
      }
    }

  } catch (err) {
    return { ok: false, msg: err.message }
  }
}

async function mp3(url) {
  const checkAPI = await verificarAPI()
  if (checkAPI !== true) return { ok: false, msg: checkAPI }

  try {
    const { apikey_vex, site_vex } = CONFIG_FILE
    const api = `${site_vex}/api/downloads/youtubemp3?apikey=${apikey_vex}&query=${encodeURIComponent(url)}`
    
    const data = await request(api)


    const checkAfter = await verificarAPI(data)
    if (checkAfter !== true) return { ok: false, msg: checkAfter }

    const resposta = data?.resposta

    if (!resposta?.dlurl) {
      throw new Error('URL de download não encontrada')
    }

    const buffer = await downloadFile(resposta.dlurl)

    return {
      ok: true,
      buffer,
      title: resposta.title || 'YouTube Audio',
      thumbnail: resposta.thumbnail || '',
      filename: `${(resposta.title || 'audio').replace(/[^\w\s]/gi, '')}.mp3`
    }

  } catch (err) {
    return { ok: false, msg: err.message }
  }
}

async function mp4(url) {
  const checkAPI = await verificarAPI()
  if (checkAPI !== true) return { ok: false, msg: checkAPI }

  try {
    const { apikey_vex, site_vex } = CONFIG_FILE
    const api = `${site_vex}/api/downloads/youtubemp4?apikey=${apikey_vex}&query=${encodeURIComponent(url)}`
    
    const data = await request(api)


    const checkAfter = await verificarAPI(data)
    if (checkAfter !== true) return { ok: false, msg: checkAfter }

    const resposta = data?.resposta

    if (!resposta?.dlurl) {
      throw new Error('URL de download não encontrada')
    }

    const buffer = await downloadFile(resposta.dlurl)

    return {
      ok: true,
      buffer,
      title: resposta.title || 'YouTube Video',
      thumbnail: resposta.thumbnail || '',
      filename: `${(resposta.title || 'video').replace(/[^\w\s]/gi, '')}.mp4`
    }

  } catch (err) {
    return { ok: false, msg: err.message }
  }
}

export { search, mp3, mp4 }
export const ytmp3 = mp3
export const ytmp4 = mp4