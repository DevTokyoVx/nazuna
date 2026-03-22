/*
 * Logotipos usando api Nodz
 * Função usando axios para requisição
 */

import axios from 'axios';

const CONFIG = {
  API_URL: 'https://apisnodz.com.br/api/logotipos',
  TIMEOUT: 30000
}

class Logos {
  constructor(texto, modelo) {
    this.texto = texto;
    this.modelo = modelo;
  }
  
  async gerarLogotipo() {
    try {
      if (!this.texto) {
        throw new Error('Texto não fornecido');
      }
      
      if (!this.modelo) {
        throw new Error('Modelo não fornecido');
      }
      
      // Codificar o texto para URL
      const textoCodificado = encodeURIComponent(this.texto);
      
      // Fazer requisição para a API
      const response = await axios({
        url: `${CONFIG.API_URL}/${this.modelo}?text=${textoCodificado}`,
        method: 'GET',
        responseType: 'json',
        timeout: CONFIG.TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      // Verificar se a resposta foi bem sucedida
      if (response.data && response.data.success) {
        return {
          success: true,
          imageUrl: response.data.resultado.imagem,
          message: response.data.message || 'Logotipo gerado com sucesso'
        };
      } else {
        throw new Error(response.data?.message || 'Resposta inválida da API');
      }
      
    } catch (error) {
      console.error('Erro na API de logotipos:', error.message);
      
      // Tratamento específico para erro de timeout
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Tempo limite excedido ao gerar logotipo'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Erro ao gerar logotipo'
      };
    }
  }
}

export default Logos;
export { Logos };