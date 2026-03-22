export default async function menuIa(prefix, botName = "MeuBot", userName = "Usuário", {
    header = `╭┈⊰ 🌸 『 *${botName}* 』\n┊Olá, #user#!\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`,
    menuTopBorder = "╭┈",
    bottomBorder = "╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯",
    menuTitleIcon = "🍧ฺꕸ▸",
    menuItemIcon = "•.̇𖥨֗🍓⭟",
    separatorIcon = "❁",
    middleBorder = "┊",
    chatBotMenuTitle = "🤖 CHATBOTS INTELIGENTES",
    textMenuTitle = "✍️ GERAÇÃO DE TEXTO",
    toolsMenuTitle = "🛠️ FERRAMENTAS DE IA"
} = {}) {
    const formattedHeader = header.replace(/#user#/g, userName);
    return `${formattedHeader}

${menuTopBorder}${separatorIcon} *${chatBotMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}gemma
${middleBorder}${menuItemIcon}${prefix}gemma2
${middleBorder}${menuItemIcon}${prefix}codegemma
${middleBorder}${menuItemIcon}${prefix}qwen
${middleBorder}${menuItemIcon}${prefix}qwen2
${middleBorder}${menuItemIcon}${prefix}qwen3
${middleBorder}${menuItemIcon}${prefix}qwencoder
${middleBorder}${menuItemIcon}${prefix}llama
${middleBorder}${menuItemIcon}${prefix}llama3
${middleBorder}${menuItemIcon}${prefix}phi
${middleBorder}${menuItemIcon}${prefix}phi3

${middleBorder}${menuItemIcon}${prefix}yi
${middleBorder}${menuItemIcon}${prefix}kimi
${middleBorder}${menuItemIcon}${prefix}kimik2
${bottomBorder}

${menuTopBorder}${separatorIcon} *${textMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}cog
${middleBorder}${menuItemIcon}${prefix}mistral
${middleBorder}${menuItemIcon}${prefix}magistral
${middleBorder}${menuItemIcon}${prefix}baichuan
${middleBorder}${menuItemIcon}${prefix}marin
${middleBorder}${menuItemIcon}${prefix}rakutenai
${middleBorder}${menuItemIcon}${prefix}rocket
${middleBorder}${menuItemIcon}${prefix}swallow
${middleBorder}${menuItemIcon}${prefix}falcon
${bottomBorder}

${menuTopBorder}${separatorIcon} *${toolsMenuTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}ideias
${middleBorder}${menuItemIcon}${prefix}explicar
${middleBorder}${menuItemIcon}${prefix}resumir
${middleBorder}${menuItemIcon}${prefix}corrigir
${middleBorder}${menuItemIcon}${prefix}resumirurl
${middleBorder}${menuItemIcon}${prefix}resumirchat <qtd>
${middleBorder}${menuItemIcon}${prefix}recomendar <tipo> <gênero>
${bottomBorder}

${menuTopBorder}${separatorIcon} *💬 DEBATES & ARGUMENTAÇÃO*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}debater <tema>
${bottomBorder}

${menuTopBorder}${separatorIcon} *📖 HISTÓRIAS INTERATIVAS*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}aventura <gênero>
${middleBorder}${menuItemIcon}${prefix}aventura escolha <1/2/3>
${middleBorder}${menuItemIcon}${prefix}aventura status
${middleBorder}${menuItemIcon}${prefix}aventura sair
${middleBorder}
${middleBorder}${menuTitleIcon} *Alias: historia* ${menuTitleIcon}
${bottomBorder}
`;
}