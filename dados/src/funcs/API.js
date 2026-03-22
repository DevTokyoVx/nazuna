import fs from "fs";

const config = JSON.parse(
  fs.readFileSync(new URL("../config.json", import.meta.url))
);

async function verificarAPI(responseData = null) {

    const site = config.site_vex;
    const prefix = config.prefixo || '.';
    const apikey = config.apikey_vex;

    const tutorial = `⚠️ *Apikey não configurada!*

• Vá no site ${site} 
• crie sua conta se não tiver uma
• ative um plano (preços a partir de 5 reais)
• copie sua \`api-key\`
• use o comando \`${prefix}apikey <suakey>\`

Exemplo:
\`${prefix}apikey 1a0b5879-bc22-4f4a\``;

    const apiInvalida = `⚠️ *Api-key inválida!*

• Acesse o site ${site}
• confira se você copiou sua \`api-key\` corretamente
• verifique se sua conta possui um plano ativo
• caso necessário, gere uma nova \`api-key\`

Depois configure novamente usando:
\`${prefix}apikey <suakey>\`

Exemplo:
\`${prefix}apikey 1a0b5879-bc22-4f4a\``;


    if (responseData) {

        if (responseData?.error === "Limite diário atingido") {
            return (
                "⛔ LIMITE DIÁRIO ATINGIDO\n\n" +
                `📊 Uso da API: ${responseData.used ?? 0}/${responseData.limit ?? "?"}\n` +
                `🔄 Reset: ${responseData.reset || "00:00"}\n\n` +
                "💡 Quer aumentar seu limite?\n" +
                `Contrate um plano em:\n${site}/plans`
            );
        }

        if (responseData?.error) {
            return `⚠️ ${responseData.error}`;
        }

        return true;
    }


    if (!site || site.trim() === '') {
        console.log("[API] ERRO: site_vex não configurado");
        return '⚠️ `site_vex` não configurado no config.json';
    }

    if (!apikey || apikey.trim() === '') {
        console.log("[API] ERRO: apikey não configurada");
        return tutorial;
    }

    try {

        const url = `${site}/api/verificarkey?apikey=${apikey}`;


        const res = await fetch(url);

        let data = {};
        let text = '';

        try {
            data = await res.clone().json();
        } catch {}

        try {
            text = await res.clone().text();
        } catch {}


        if (
            res.status === 429 ||
            data?.error === "Limite diário atingido"
        ) {
            console.log("[API] RESULTADO: Limite diário atingido");

            return (
                "⛔ LIMITE DIÁRIO ATINGIDO\n\n" +
                `📊 Uso da API: ${data.used ?? 0}/${data.limit ?? "?"}\n` +
                `🔄 Reset: ${data.reset || "00:00"}\n\n` +
                "💡 Quer aumentar seu limite?\n" +
                `Contrate um plano em:\n${site}/plans`
            );
        }


        if (
            data?.error?.toLowerCase?.().includes("api key inválida") ||
            text.toLowerCase().includes("api key inválida")
        ) {

            return apiInvalida;
        }


        if (
            text.startsWith("<!DOCTYPE") ||
            text.startsWith("<html")
        ) {

            return true;
        }

        if (!data.error) {

            return true;
        }

        console.log("[API] RESULTADO: erro desconhecido:", data.error);
        return `⚠️ ${data.error}`;

    } catch (err) {

        console.log("[API] ERRO na requisição:", err);
        return '⚠️ Não foi possível verificar a API no momento.';
    }
}

export default verificarAPI;