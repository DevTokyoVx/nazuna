import https from 'https';
import fs from 'fs';
import verificarAPI from '../API.js';

const CONFIG_FILE = JSON.parse(
  fs.readFileSync(new URL('../../config.json', import.meta.url), 'utf8')
);

function request(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

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

async function getLyrics(topic) {

  const checkAPI = await verificarAPI();
  if (checkAPI !== true) return checkAPI;

  try {

    const { apikey_vex, site_vex } = CONFIG_FILE;

    const url =
      `${site_vex}/api/pesquisa/letra?apikey=${apikey_vex}&query=${encodeURIComponent(topic)}`;

    const data = await request(url);

    const checkAfter = await verificarAPI(data);
    if (checkAfter !== true) return checkAfter;

    if (!data?.status) {
      throw new Error('API retornou erro');
    }

    const results = data.results?.resultados;

    if (!results || results.length === 0) {
      throw new Error('Letra não encontrada');
    }

    const music = results[0];

    const title = music.txt || 'Título não disponível';
    const artist = music.art || 'Artista desconhecido';
    const lyrics = music.lyrics || 'Letra não disponível';
    const link = music.link || '';

    // 🔥 CORREÇÃO PRINCIPAL AQUI
    let image = null;

    if (typeof music.img === 'string' && music.img.trim() !== '') {
      image = music.img;
    } else if (typeof music.imgm === 'string' && music.imgm.trim() !== '') {
      image = music.imgm;
    }

    const text = `
🎵 *${title}* 🎵
👤 Artista: ${artist}
🔗 ${link}

📜 *Letra:*

${lyrics}
`.trim();

    // 🔥 NÃO retorna image se for null
    if (image) {
      return { text, image };
    }

    return { text };

  } catch (err) {
    throw new Error(`Erro: ${err.message}`);
  }

}

export default getLyrics;