export default async function menuLogos(prefix, botName = "MeuBot", userName = "Usuário", {
    header = `╭┈⊰ 🌸 『 *${botName}* 』\n┊Olá, #user#!\n╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯`,
    menuTopBorder = "╭┈",
    bottomBorder = "╰─┈┈┈┈┈◜❁◞┈┈┈┈┈─╯",
    menuTitleIcon = "🍧ฺꕸ▸",
    menuItemIcon = "•.̇𖥨֗🍓⭟",
    separatorIcon = "❁",
    middleBorder = "┊",
    Logos1txtTitle = "🎨 LOGOTIPOS 1TXT",
    Logos2txtTitle = "🖼 LOGOTIPOS 2TXT"
} = {}) {
    const formattedHeader = header.replace(/#user#/g, userName);
    return `${formattedHeader}

${menuTopBorder}${separatorIcon} *${Logos1txtTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}amongus
${middleBorder}${menuItemIcon}${prefix}royal
${middleBorder}${menuItemIcon}${prefix}mascotemetal
${middleBorder}${menuItemIcon}${prefix}firework
${middleBorder}${menuItemIcon}${prefix}summerbeach
${middleBorder}${menuItemIcon}${prefix}cloudsky
${middleBorder}${menuItemIcon}${prefix}techstyle
${middleBorder}${menuItemIcon}${prefix}watercolor
${middleBorder}${menuItemIcon}${prefix}ligatures
${middleBorder}${menuItemIcon}${prefix}graffitistyle
${middleBorder}${menuItemIcon}${prefix}frozen
${middleBorder}${menuItemIcon}${prefix}colorful
${middleBorder}${menuItemIcon}${prefix}balloon
${middleBorder}${menuItemIcon}${prefix}multicolor
${middleBorder}${menuItemIcon}${prefix}metal
${middleBorder}${menuItemIcon}${prefix}doubleexposure
${middleBorder}${menuItemIcon}${prefix}mascoteneon
${middleBorder}${menuItemIcon}${prefix}eraser
${middleBorder}${menuItemIcon}${prefix}america
${middleBorder}${menuItemIcon}${prefix}snow
${middleBorder}${menuItemIcon}${prefix}sunset
${middleBorder}${menuItemIcon}${prefix}halloween
${middleBorder}${menuItemIcon}${prefix}blood
${middleBorder}${menuItemIcon}${prefix}hallobat
${middleBorder}${menuItemIcon}${prefix}cemiterio
${middleBorder}${menuItemIcon}${prefix}ffavatar
${middleBorder}${menuItemIcon}${prefix}vintage3d
${middleBorder}${menuItemIcon}${prefix}hollywood
${middleBorder}${menuItemIcon}${prefix}glitch
${middleBorder}${menuItemIcon}${prefix}galaxy
${middleBorder}${menuItemIcon}${prefix}glossy
${middleBorder}${menuItemIcon}${prefix}dragonfire
${middleBorder}${menuItemIcon}${prefix}pubgavatar
${middleBorder}${menuItemIcon}${prefix}comics
${bottomBorder}

${menuTopBorder}${separatorIcon} *${Logos2txtTitle}*
${middleBorder}
${middleBorder}${menuItemIcon}${prefix}pornhub
${middleBorder}${menuItemIcon}${prefix}avengers
${middleBorder}${menuItemIcon}${prefix}graffiti
${middleBorder}${menuItemIcon}${prefix}captainamerica
${middleBorder}${menuItemIcon}${prefix}stone3d
${middleBorder}${menuItemIcon}${prefix}neon2
${middleBorder}${menuItemIcon}${prefix}thor
${middleBorder}${menuItemIcon}${prefix}amongus
${middleBorder}${menuItemIcon}${prefix}deadpool
${middleBorder}${menuItemIcon}${prefix}blackpink
${bottomBorder}`;
}