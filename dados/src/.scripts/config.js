#!/usr/bin/env node

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process';
import readline from 'readline';
import os from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

const CONFIG_FILE = path.join(process.cwd(), 'dados', 'src', 'config.json');
let version = 'Desconhecida';
try {
    const pkg = JSON.parse(fsSync.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    version = pkg.version;
} catch { }

const colors = {
  reset: '\x1b[0m', green: '\x1b[1;32m', red: '\x1b[1;31m',
  blue: '\x1b[1;34m', yellow: '\x1b[1;33m', cyan: '\x1b[1;36m',
  dim: '\x1b[2m', bold: '\x1b[1m', underline: '\x1b[4m',
};

const print = {
    message: (text) => console.log(`${colors.green}${text}${colors.reset}`),
    warning: (text) => console.log(`${colors.red}${text}${colors.reset}`),
    info: (text) => console.log(`${colors.cyan}${text}${colors.reset}`),
    detail: (text) => console.log(`${colors.dim}${text}${colors.reset}`),
    separator: () => console.log(`${colors.blue}=================================================${colors.reset}`),
    header: () => {
        print.separator();
        console.log(`${colors.bold}🚀 Configurador Gênesis Nazuna - Versão ${version}${colors.reset}`);
        console.log(`${colors.bold}👨‍💻 Criado por Hiudy${colors.reset}`);
        print.separator(); console.log();
    }
};

const SystemInfo = {
    os: os.platform(),
    isWindows: os.platform() === 'win32',
    isTermux: false,
    packageManager: null,

    async detect() {
        this.isTermux = 'TERMUX_VERSION' in process.env;
        if (this.isTermux) {
            this.packageManager = 'pkg';
        } else if (this.os === 'linux') {
            if (await commandExists('apt')) this.packageManager = 'apt';
            else if (await commandExists('dnf')) this.packageManager = 'dnf';
            else if (await commandExists('pacman')) this.packageManager = 'pacman';
        } else if (this.os === 'darwin') {
            if (await commandExists('brew')) this.packageManager = 'brew';
        } else if (this.isWindows) {
            if (await commandExists('winget')) this.packageManager = 'winget';
            else if (await commandExists('choco')) this.packageManager = 'choco';
        }
    }
};

const DEPENDENCIES_CONFIG = [
    { name: 'Git', check: 'git --version', termux: 'pkg install git -y', win: 'winget install --id Git.Git -e', linux: 'apt install -y git || dnf install -y git || pacman -S --noconfirm git', mac: 'brew install git' },
    { name: 'Yarn', check: 'yarn --version', termux: 'npm i -g yarn', win: 'npm i -g yarn', linux: 'sudo npm i -g yarn', mac: 'npm i -g yarn' },
    { name: 'FFmpeg', check: 'ffmpeg -version', termux: 'pkg install ffmpeg -y', win: 'winget install --id Gyan.FFmpeg -e || choco install ffmpeg', linux: 'apt install -y ffmpeg || dnf install -y ffmpeg || pacman -S --noconfirm ffmpeg', mac: 'brew install ffmpeg' }
];

async function runCommandWithSpinner(command, message) {
    const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    const interval = setInterval(() => {
        process.stdout.write(`\r${colors.yellow}${spinner[i]}${colors.reset} ${message}`);
        i = (i + 1) % spinner.length;
    }, 100);
    try {
        await execAsync(command, { shell: SystemInfo.isWindows });
    } finally {
        clearInterval(interval);
        process.stdout.write('\r' + ' '.repeat(message.length + 5) + '\r');
    }
}

async function runCommandInherit(cmd, args = []) {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args, { stdio: 'inherit' });
        proc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`${cmd} terminou com código ${code}`));
        });
    });
}

async function promptInput(rl, prompt, defaultValue, validator = () => true) {
    let value; let isValid = false;
    while (!isValid) {
        const displayPrompt = `${prompt} ${colors.dim}(atual: ${defaultValue})${colors.reset}:`;
        console.log(displayPrompt);
        value = await new Promise(resolve => rl.question("--> ", resolve));
        value = value.trim() || defaultValue;
        isValid = validator(value);
        if (!isValid) print.warning('   ➡️ Entrada inválida. Por favor, tente novamente.');
    }
    return value;
}

async function confirm(rl, prompt, defaultValue = 'n') {
    const defaultText = defaultValue.toLowerCase() === 's' ? 'S/n' : 's/N';
    console.log(`${prompt} (${defaultText}): `);
    const response = await new Promise(resolve => rl.question("--> ", resolve));
    const normalized = (response.trim() || defaultValue).toLowerCase();
    return ['s', 'sim', 'y', 'yes'].includes(normalized);
}

async function commandExists(command) {
    const checkCmd = SystemInfo.isWindows ? `where ${command}` : `command -v ${command}`;
    try { await execAsync(checkCmd); return true; } catch { return false; }
}

async function installSystemDependencies() {
    print.separator();
    print.message('🔧 Verificando e instalando dependências do sistema...');
    const report = [];

    if (SystemInfo.isTermux) {
        print.info('ℹ️ Atualizando pacotes do Termux...');
        try {
            await runCommandInherit('pkg', ['update', '-y']);
            await runCommandInherit('pkg', ['upgrade', '-y']);
        } catch (e) {
            print.warning('⚠️ Falha ao atualizar pacotes do Termux. Continue com cuidado.');
        }
    }
    
    for (const dep of DEPENDENCIES_CONFIG) {
        let status = `${colors.green}✅ Já instalado${colors.reset}`;
        try {
            await execAsync(dep.check);
        } catch {
            status = `${colors.yellow}⚠️ Não encontrado${colors.reset}`;
            const osKey = SystemInfo.isTermux ? 'termux' : (SystemInfo.os === 'darwin' ? 'mac' : SystemInfo.os);
            let installCommand = dep[osKey];
            
            if (installCommand) {
                try {
                    if (SystemInfo.isTermux && (dep.name === 'Git' || dep.name === 'FFmpeg')) {
                        const [cmd, ...args] = installCommand.split(' ');
                        await runCommandInherit(cmd, args);
                    } else {
                        await runCommandWithSpinner(installCommand, `Instalando ${dep.name}...`);
                    }
                    status = `${colors.green}✅ Instalado com sucesso${colors.reset}`;
                } catch (error) {
                    status = `${colors.red}❌ Falha na instalação${colors.reset}`;
                }
            } else {
                status = `${colors.dim}⚪️ Instalação manual necessária${colors.reset}`;
            }
        }
        report.push({ name: dep.name, status });
    }
    
    try {
        const optimizationDirs = ['temp', 'logs', 'cache', 'dados/backup'];
        for (const dir of optimizationDirs) {
            await fs.mkdir(dir, { recursive: true });
        }
        print.message('📁 Diretórios de otimização criados');
        report.push({ name: 'Diretórios de Otimização', status: `${colors.green}✅ Criados${colors.reset}` });
    } catch (error) {
        print.warning('⚠️ Erro ao criar diretórios de otimização');
        report.push({ name: 'Diretórios de Otimização', status: `${colors.red}❌ Falha${colors.reset}` });
    }
    
    return report;
}

async function installNodeDependencies() {
    print.separator();
    print.message('📦 Instalando dependências do projeto (Node.js)...');
    
    try {
        const cleanupPaths = [
            './temp',
            './logs/*.log', 
            '/tmp/nazuna-*',
            '/tmp/baileys_media_cache'
        ];
        
        for (const cleanupPath of cleanupPaths) {
            try {
                if (cleanupPath.includes('*')) {
                    await execAsync(`rm -rf ${cleanupPath} 2>/dev/null || true`);
                } else {
                    try {
                        await fs.access(cleanupPath);
                        const stats = await fs.stat(cleanupPath);
                        if (stats.isDirectory()) {
                            await fs.rm(cleanupPath, { recursive: true, force: true });
                        }
                    } catch {
                    }
                }
            } catch {
            }
        }
        print.message('🧹 Limpeza automática executada');
    } catch (error) {
        print.warning('⚠️ Erro na limpeza automática (continuando...)');
    }
    
    try {
        await runCommandWithSpinner('npm install --no-optional --force --no-bin-links', 'Executando npm install...');
        print.message('✅ Dependências instaladas com sucesso via NPM.');
        return { name: 'Node Dependencies (npm)', status: `${colors.green}✅ Instalado com sucesso${colors.reset}` };
    } catch (npmError) {
        print.warning(`❌ Falha no NPM: ${npmError.message}`);
        print.info('ℹ️ Tentando fallback para YARN...');
        try {
            await runCommandWithSpinner('yarn install', 'Executando yarn install...');
            print.message('✅ Dependências instaladas com sucesso via YARN.');
            return { name: 'Node Dependencies (yarn)', status: `${colors.green}✅ Instalado com sucesso${colors.reset}` };
        } catch (yarnError) {
            print.warning(`❌ Falha no YARN: ${yarnError.message}`);
            return { name: 'Node Dependencies', status: `${colors.red}❌ Falha na instalação${colors.reset}` };
        }
    }
}

async function main() {
    process.on('SIGINT', () => { print.warning('\n🛑 Configuração cancelada.'); process.exit(0); });

    await SystemInfo.detect();

    if (process.argv.includes('--install')) {
        const nodeReport = await installNodeDependencies();
        const systemReport = await installSystemDependencies();
        print.separator();
        print.info("📋 Relatório Final de Instalação:");
        [...systemReport, nodeReport].forEach(r => console.log(`- ${r.name}: ${r.status}`));
        print.separator();
        process.exit(0);
    }

    print.header();
    
let config = {
  nomedono: '',
  numerodono: '',
  nomebot: '',
  prefixo: '!',
  site_vex: 'https://vexapi.com.br',
  apikey_vex: 'SUAKEY',

  github_ofc: 'https://github.com/DevTokyoVx/nazuna',
  autor: 'DevTokyoVx',
  repositorio: 'nazuna',

  WA_WEB_VERSION: {
    aviso: 'Não mexa aqui, pode afetar o funcionamento do BOT.',
    value: [2, 3000, 1034740716]
  }
};
    try {
        const existingConfig = JSON.parse(await fs.readFile(CONFIG_FILE, 'utf8'));
        config = { ...config, ...existingConfig };
        print.info('📂 Configuração existente carregada.');
    } catch {  }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    
    print.info(`${colors.bold}${colors.underline}🔧 Configurações Básicas${colors.reset}`);
    config.nomedono = await promptInput(rl, '👤 Nome do dono do bot', config.nomedono);
    config.numerodono = await promptInput(rl, '📱 Número do dono (apenas dígitos)', config.numerodono, (v) => /^\d{10,15}$/.test(v));
    config.nomebot = await promptInput(rl, '🤖 Nome do bot', config.nomebot);
    config.prefixo = await promptInput(rl, '🔣 Prefixo do bot (1 caractere)', config.prefixo, (v) => v.length === 1);
    
       config.apikey_vex = await promptInput(rl, '🔑 Api-key do site https://vexapi.com.br', config.apikey_vex);

    await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));

    print.separator();
    print.message('✅ Configuração salva com sucesso!');
    
    if (await confirm(rl, '⚙️ Deseja verificar e instalar todas as dependências agora?', 's')) {
        rl.close();
        const nodeReport = await installNodeDependencies();
        const systemReport = await installSystemDependencies();
        print.separator();
        print.info("📋 Relatório Final de Instalação:");
        [...systemReport, nodeReport].forEach(r => console.log(`- ${r.name}: ${r.status}`));
        print.separator();
    } else {
        rl.close();
        print.info('📝 Lembre-se de instalar com: npm run config:install');
    }

    print.message(`🎉 Nazuna configurado e pronto para uso! Versão: ${version}`);
}

main().catch((error) => {
    print.warning(`❌ Erro fatal: ${error.message}`);
    process.exit(1);
});
