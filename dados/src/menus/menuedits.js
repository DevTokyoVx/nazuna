export default async function menuedits(prefix, botName = "MeuBot", userName = "Usuário", {
    header = `╭┈⊰ 🌸 『 *${botName}* 』\n┊Olá, #user#!\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`,
    menuTopBorder = "╭┈",
    bottomBorder = "╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯",
    menuTitleIcon = "🍧ฺꕸ▸",
    menuItemIcon = "•.̇𖥨֗🍓⭟",
    separatorIcon = "❁",
    middleBorder = "┊"
} = {}) {
    const formattedHeader = header.replace(/#user#/g, userName);
    return `${formattedHeader}

${menuTopBorder}${separatorIcon} *MENU EDITS*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}jornal
${middleBorder}${menuItemIcon}${prefix}cinema
${middleBorder}${menuItemIcon}${prefix}blackwhite
${middleBorder}${menuItemIcon}${prefix}desfoque
${middleBorder}${menuItemIcon}${prefix}wojakreaction
${bottomBorder}`;
}