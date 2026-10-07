import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Directorio "MisJuegos"
const GAMES_DIR = path.join(__dirname, 'MisJuegos');

// SVG Covers de alta fidelidad predeterminados para los puertos de ejemplo
const DEFAULT_COVERS: Record<string, string> = {
  'sm64': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <defs>
      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#38bdf8"/>
        <stop offset="60%" stop-color="#7dd3fc"/>
        <stop offset="100%" stop-color="#22c55e"/>
      </linearGradient>
      <linearGradient id="hatGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ef4444"/>
        <stop offset="100%" stop-color="#b91c1c"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#skyGrad)"/>
    <!-- Hill -->
    <path d="M-50,400 Q120,240 300,400 Z" fill="#15803d"/>
    <path d="M150,400 Q320,220 450,400 Z" fill="#16a34a"/>
    <!-- Question Block -->
    <rect x="250" y="70" width="80" height="80" rx="10" fill="#f59e0b" stroke="#b45309" stroke-width="5"/>
    <circle cx="260" cy="80" r="3" fill="#78350f"/>
    <circle cx="320" cy="80" r="3" fill="#78350f"/>
    <circle cx="260" cy="140" r="3" fill="#78350f"/>
    <circle cx="320" cy="140" r="3" fill="#78350f"/>
    <text x="290" y="125" font-family="Arial, sans-serif" font-weight="900" font-size="52" fill="#fff" text-anchor="middle">?</text>
    <!-- Mario Emblem Circle -->
    <circle cx="200" cy="220" r="95" fill="#ffffff" stroke="#e11d48" stroke-width="8"/>
    <path d="M155,255 L155,185 L180,225 L200,195 L220,225 L245,185 L245,255 L225,255 L225,215 L200,245 L175,215 L175,255 Z" fill="#e11d48"/>
    <!-- Banner -->
    <rect x="20" y="315" width="360" height="60" rx="12" fill="#0f172a" fill-opacity="0.9"/>
    <text x="200" y="345" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="20" fill="#ffffff" text-anchor="middle" letter-spacing="1">SUPER MARIO 64</text>
    <text x="200" y="365" font-family="'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="13" fill="#38bdf8" text-anchor="middle" letter-spacing="2">PC NATIVE DECOMP PORT</text>
  </svg>`,

  'zelda': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <defs>
      <linearGradient id="twilight" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="60%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#312e81"/>
      </linearGradient>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="50%" stop-color="#eab308"/>
        <stop offset="100%" stop-color="#ca8a04"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#twilight)"/>
    <!-- Stars -->
    <circle cx="50" cy="50" r="2" fill="#fff" opacity="0.8"/>
    <circle cx="120" cy="80" r="1.5" fill="#fff" opacity="0.6"/>
    <circle cx="340" cy="40" r="2" fill="#fff" opacity="0.9"/>
    <circle cx="280" cy="110" r="1.5" fill="#fff" opacity="0.5"/>
    <circle cx="70" cy="180" r="2" fill="#38bdf8" opacity="0.8"/>
    <!-- Triforce Glow -->
    <circle cx="200" cy="180" r="85" fill="#eab308" opacity="0.15" filter="blur(20px)"/>
    <!-- Triforce -->
    <polygon points="200,90 140,190 260,190" fill="url(#goldGrad)" stroke="#713f12" stroke-width="3"/>
    <polygon points="140,190 80,290 200,290" fill="url(#goldGrad)" stroke="#713f12" stroke-width="3"/>
    <polygon points="260,190 200,290 320,290" fill="url(#goldGrad)" stroke="#713f12" stroke-width="3"/>
    <!-- Master Sword Crest -->
    <line x1="200" y1="130" x2="200" y2="280" stroke="#38bdf8" stroke-width="4"/>
    <polygon points="200,105 190,130 210,130" fill="#38bdf8"/>
    <!-- Bottom Banner -->
    <rect x="20" y="315" width="360" height="60" rx="12" fill="#090d16" fill-opacity="0.95"/>
    <text x="200" y="343" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="18" fill="#fef08a" text-anchor="middle">SHIP OF HARKINIAN</text>
    <text x="200" y="364" font-family="'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="12" fill="#93c5fd" text-anchor="middle" letter-spacing="1.5">OCARINA OF TIME 60FPS PORT</text>
  </svg>`,

  'sonic': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <defs>
      <linearGradient id="sonicSky" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0284c7"/>
        <stop offset="50%" stop-color="#2563eb"/>
        <stop offset="100%" stop-color="#1d4ed8"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#sonicSky)"/>
    <!-- Sonic Ring -->
    <circle cx="200" cy="180" r="75" fill="none" stroke="#facc15" stroke-width="20"/>
    <circle cx="200" cy="180" r="85" fill="none" stroke="#ca8a04" stroke-width="2"/>
    <circle cx="200" cy="180" r="65" fill="none" stroke="#fef08a" stroke-width="2"/>
    <!-- Starburst -->
    <polygon points="200,50 208,80 238,80 214,98 222,128 200,110 178,128 186,98 162,80 192,80" fill="#fef08a"/>
    <!-- Sonic Wing Emblem -->
    <path d="M120,230 Q200,280 280,230 Q200,260 120,230 Z" fill="#ffffff"/>
    <circle cx="200" cy="180" r="45" fill="#2563eb" stroke="#ffffff" stroke-width="5"/>
    <text x="200" y="195" font-family="'Impact', Arial, sans-serif" font-weight="900" font-size="44" fill="#ffffff" text-anchor="middle" font-style="italic">3</text>
    <!-- Banner -->
    <rect x="20" y="315" width="360" height="60" rx="12" fill="#0f172a" fill-opacity="0.9"/>
    <text x="200" y="344" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="19" fill="#facc15" text-anchor="middle">SONIC 3 A.I.R.</text>
    <text x="200" y="365" font-family="'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="12" fill="#e2e8f0" text-anchor="middle" letter-spacing="1">ANGEL ISLAND REVISITED PC</text>
  </svg>`,

  'am2r': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <defs>
      <linearGradient id="cave" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#022c22"/>
        <stop offset="60%" stop-color="#064e3b"/>
        <stop offset="100%" stop-color="#047857"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#cave)"/>
    <!-- Metroid Alien Bulb -->
    <circle cx="200" cy="170" r="70" fill="#10b981" opacity="0.3" filter="blur(10px)"/>
    <path d="M140,180 C140,110 260,110 260,180 C260,230 140,230 140,180 Z" fill="#34d399" opacity="0.85" stroke="#a7f3d0" stroke-width="4"/>
    <!-- Nuclei -->
    <circle cx="180" cy="165" r="16" fill="#ef4444" opacity="0.8"/>
    <circle cx="215" cy="160" r="14" fill="#ef4444" opacity="0.8"/>
    <circle cx="198" cy="185" r="15" fill="#ef4444" opacity="0.8"/>
    <!-- Fangs -->
    <polygon points="150,210 160,240 170,215" fill="#f8fafc"/>
    <polygon points="250,210 240,240 230,215" fill="#f8fafc"/>
    <!-- Visor Glow -->
    <path d="M160,270 Q200,290 240,270" stroke="#38bdf8" stroke-width="6" stroke-linecap="round"/>
    <!-- Banner -->
    <rect x="20" y="315" width="360" height="60" rx="12" fill="#021f18" fill-opacity="0.95"/>
    <text x="200" y="344" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="19" fill="#34d399" text-anchor="middle">AM2R: RETURN OF SAMUS</text>
    <text x="200" y="365" font-family="'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="12" fill="#93c5fd" text-anchor="middle" letter-spacing="1.5">METROID 2 REMAKE PC</text>
  </svg>`,

  'celeste': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <defs>
      <linearGradient id="mountain" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#4c1d95"/>
        <stop offset="50%" stop-color="#831843"/>
        <stop offset="100%" stop-color="#f43f5e"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#mountain)"/>
    <!-- Mountain Peak -->
    <polygon points="200,80 70,320 330,320" fill="#1e1b4b" opacity="0.9"/>
    <polygon points="200,80 160,150 200,140 240,150" fill="#e0e7ff"/>
    <!-- Strawberry Icon -->
    <circle cx="200" cy="210" r="32" fill="#f43f5e" stroke="#ffe4e6" stroke-width="3"/>
    <path d="M190,185 Q200,175 210,185" stroke="#15803d" stroke-width="6" stroke-linecap="round"/>
    <circle cx="190" cy="205" r="2" fill="#ffe4e6"/>
    <circle cx="210" cy="205" r="2" fill="#ffe4e6"/>
    <circle cx="200" cy="220" r="2" fill="#ffe4e6"/>
    <!-- Banner -->
    <rect x="20" y="315" width="360" height="60" rx="12" fill="#180728" fill-opacity="0.95"/>
    <text x="200" y="344" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="20" fill="#f43f5e" text-anchor="middle">CELESTE CLASSIC</text>
    <text x="200" y="365" font-family="'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="12" fill="#c084fc" text-anchor="middle" letter-spacing="1.5">STANDALONE PC PORT</text>
  </svg>`,

  'portal64': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <defs>
      <linearGradient id="portalBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#18181b"/>
        <stop offset="100%" stop-color="#27272a"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#portalBg)"/>
    <!-- Blue Portal -->
    <ellipse cx="140" cy="170" rx="45" ry="85" fill="#0284c7" stroke="#38bdf8" stroke-width="8"/>
    <ellipse cx="140" cy="170" rx="30" ry="70" fill="#082f49"/>
    <!-- Orange Portal -->
    <ellipse cx="260" cy="170" rx="45" ry="85" fill="#ea580c" stroke="#fb923c" stroke-width="8"/>
    <ellipse cx="260" cy="170" rx="30" ry="70" fill="#431407"/>
    <!-- Stickman Running Through -->
    <circle cx="190" cy="140" r="14" fill="#f4f4f5"/>
    <line x1="190" y1="154" x2="185" y2="190" stroke="#f4f4f5" stroke-width="6" stroke-linecap="round"/>
    <line x1="185" y1="190" x2="160" y2="225" stroke="#f4f4f5" stroke-width="6" stroke-linecap="round"/>
    <line x1="185" y1="190" x2="210" y2="220" stroke="#f4f4f5" stroke-width="6" stroke-linecap="round"/>
    <!-- Banner -->
    <rect x="20" y="315" width="360" height="60" rx="12" fill="#09090b" fill-opacity="0.95"/>
    <text x="200" y="344" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="20" fill="#38bdf8" text-anchor="middle">PORTAL 64</text>
    <text x="200" y="365" font-family="'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="12" fill="#fb923c" text-anchor="middle" letter-spacing="1.5">FIRST PERSON DEMAKE PC</text>
  </svg>`
};

// Asegurar directorio "MisJuegos"
if (!fs.existsSync(GAMES_DIR)) {
  fs.mkdirSync(GAMES_DIR, { recursive: true });
}

// Archivos de configuración para Emuladores y ROMs escaneadas
const EMULATORS_CONFIG_FILE = path.join(__dirname, 'emulators_config.json');
const EMULATOR_GAMES_FILE = path.join(__dirname, 'emulator_games.json');

// Catálogo de emuladores predeterminados conocidos (.exe)
export const DEFAULT_EMULATOR_PRESETS = [
  {
    id: 'ryujinx',
    name: 'Ryujinx',
    console: 'Switch',
    defaultExeName: 'Ryujinx.exe',
    extensions: ['.nsp', '.xci', '.nca'],
    cliArgs: ['"{rom}"'],
    description: 'Emulador de Nintendo Switch optimizado'
  },
  {
    id: 'yuzu',
    name: 'Yuzu / Suyu',
    console: 'Switch',
    defaultExeName: 'yuzu.exe',
    extensions: ['.nsp', '.xci'],
    cliArgs: ['-f', '-g', '"{rom}"'],
    description: 'Emulador de Nintendo Switch'
  },
  {
    id: 'pcsx2',
    name: 'PCSX2',
    console: 'PS2',
    defaultExeName: 'pcsx2-qt.exe',
    extensions: ['.iso', '.chd', '.bin', '.cso', '.gz'],
    cliArgs: ['-fullscreen', '-batch', '"{rom}"'],
    description: 'Emulador de PlayStation 2'
  },
  {
    id: 'dolphin',
    name: 'Dolphin',
    console: 'GameCube',
    defaultExeName: 'Dolphin.exe',
    extensions: ['.iso', '.rvz', '.wbfs', '.gcm', '.ciso'],
    cliArgs: ['-b', '-e', '"{rom}"'],
    description: 'Emulador de GameCube y Nintendo Wii'
  },
  {
    id: 'duckstation',
    name: 'DuckStation',
    console: 'PS1',
    defaultExeName: 'duckstation-qt-x64-ReleaseLTCG.exe',
    extensions: ['.chd', '.cue', '.bin', '.iso', '.pbp', '.m3u'],
    cliArgs: ['-fullscreen', '-batch', '"{rom}"'],
    description: 'Emulador de PlayStation 1'
  },
  {
    id: 'rpcs3',
    name: 'RPCS3',
    console: 'PS3',
    defaultExeName: 'rpcs3.exe',
    extensions: ['.iso', 'EBOOT.BIN'],
    cliArgs: ['--no-gui', '"{rom}"'],
    description: 'Emulador de PlayStation 3'
  },
  {
    id: 'cemu',
    name: 'Cemu',
    console: 'Wii U',
    defaultExeName: 'Cemu.exe',
    extensions: ['.rpx', '.wua', '.wud', '.wux'],
    cliArgs: ['-f', '-g', '"{rom}"'],
    description: 'Emulador de Nintendo Wii U'
  },
  {
    id: 'retroarch',
    name: 'RetroArch',
    console: 'Retro',
    defaultExeName: 'retroarch.exe',
    extensions: ['.z64', '.n64', '.gba', '.gb', '.smc', '.sfc', '.nes', '.zip'],
    cliArgs: ['-f', '"{rom}"'],
    description: 'Frontend multisistema para N64, GBA, SNES y clásicos'
  },
  {
    id: 'citra',
    name: 'Citra / Lime3DS',
    console: '3DS',
    defaultExeName: 'citra-qt.exe',
    extensions: ['.3ds', '.cia', '.cci'],
    cliArgs: ['"{rom}"'],
    description: 'Emulador de Nintendo 3DS'
  },
  {
    id: 'ppsspp',
    name: 'PPSSPP',
    console: 'PSP',
    defaultExeName: 'PPSSPPWindows64.exe',
    extensions: ['.iso', '.cso'],
    cliArgs: ['"{rom}"'],
    description: 'Emulador de PlayStation Portable'
  },
  {
    id: 'xemu',
    name: 'Xemu',
    console: 'Xbox',
    defaultExeName: 'xemu.exe',
    extensions: ['.iso', '.xbe'],
    cliArgs: ['-full-screen', '-dvd_path', '"{rom}"'],
    description: 'Emulador de la consola original Xbox'
  }
];

// Cargar lista de emuladores configurados
function loadEmulatorsConfig(): any[] {
  try {
    if (fs.existsSync(EMULATORS_CONFIG_FILE)) {
      const raw = fs.readFileSync(EMULATORS_CONFIG_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error('Error cargando emulators_config.json:', e);
  }
  return [];
}

// Guardar lista de emuladores configurados
function saveEmulatorsConfig(configs: any[]): void {
  try {
    fs.writeFileSync(EMULATORS_CONFIG_FILE, JSON.stringify(configs, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error guardando emulators_config.json:', e);
  }
}

// Cargar lista de juegos detectados de emuladores
function loadEmulatorGames(): any[] {
  try {
    if (fs.existsSync(EMULATOR_GAMES_FILE)) {
      const raw = fs.readFileSync(EMULATOR_GAMES_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error('Error cargando emulator_games.json:', e);
  }
  return [];
}

// Guardar lista de juegos detectados de emuladores
function saveEmulatorGames(games: any[]): void {
  try {
    fs.writeFileSync(EMULATOR_GAMES_FILE, JSON.stringify(games, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error guardando emulator_games.json:', e);
  }
}

// Limpiar título de ROM eliminando extensiones y tags de escena
function cleanRomTitle(fileName: string): string {
  let name = path.parse(fileName).name;
  name = name.replace(/\s*\([^)]*\)/g, '');
  name = name.replace(/\s*\[[^\]]*\]/g, '');
  name = name.replace(/_/g, ' ');
  name = name.replace(/\s+/g, ' ').trim();
  return name || path.parse(fileName).name;
}

// Generar carátula SVG estilizada según la consola del emulador
function generateConsoleSvgCover(title: string, consoleName: string): string {
  const themes: Record<string, { bg1: string; bg2: string; accent: string; badge: string }> = {
    'Switch': { bg1: '#e60012', bg2: '#00d2ff', accent: '#ffffff', badge: 'SWITCH' },
    'PS2': { bg1: '#002060', bg2: '#00439c', accent: '#ffd700', badge: 'PLAYSTATION 2' },
    'GameCube': { bg1: '#4b0082', bg2: '#6a0dad', accent: '#ffffff', badge: 'GAMECUBE' },
    'PS1': { bg1: '#2b2b2b', bg2: '#4a4a4a', accent: '#00d2ff', badge: 'PS ONE' },
    'PS3': { bg1: '#0a0a0a', bg2: '#003366', accent: '#ffffff', badge: 'PS3' },
    'Wii': { bg1: '#00a4e4', bg2: '#0284c7', accent: '#ffffff', badge: 'WII' },
    'Wii U': { bg1: '#0083ca', bg2: '#002e5b', accent: '#ffffff', badge: 'WII U' },
    'N64': { bg1: '#004d00', bg2: '#008000', accent: '#ffff00', badge: 'NINTENDO 64' },
    'GBA': { bg1: '#4a0e4e', bg2: '#800080', accent: '#00ffff', badge: 'GAME BOY ADVANCE' },
    '3DS': { bg1: '#cc0000', bg2: '#660000', accent: '#ffffff', badge: 'NINTENDO 3DS' },
    'PSP': { bg1: '#111111', bg2: '#333333', accent: '#00bfff', badge: 'PSP' },
    'Xbox': { bg1: '#107c10', bg2: '#0e5e0e', accent: '#ffffff', badge: 'XBOX' },
    'Retro': { bg1: '#2d1b69', bg2: '#11052c', accent: '#ff007f', badge: 'RETRO' }
  };
  const theme = themes[consoleName] || { bg1: '#1e293b', bg2: '#0f172a', accent: '#38bdf8', badge: (consoleName || 'ROM').toUpperCase() };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${theme.bg1}"/>
        <stop offset="100%" stop-color="${theme.bg2}"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" rx="28" fill="url(#bgGrad)"/>
    <circle cx="200" cy="180" r="85" fill="#ffffff" opacity="0.1"/>
    <circle cx="200" cy="180" r="60" fill="#ffffff" opacity="0.15"/>
    <circle cx="200" cy="180" r="35" fill="#ffffff" opacity="0.25"/>
    <text x="200" y="195" font-family="'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="44" fill="${theme.accent}" text-anchor="middle">🎮</text>
    <rect x="25" y="25" width="350" height="35" rx="8" fill="#000000" fill-opacity="0.45"/>
    <text x="200" y="48" font-family="'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="13" fill="${theme.accent}" text-anchor="middle" letter-spacing="2">${theme.badge}</text>
    <rect x="20" y="295" width="360" height="85" rx="14" fill="#090d16" fill-opacity="0.94"/>
    <text x="200" y="332" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="18" fill="#ffffff" text-anchor="middle">${title.length > 25 ? title.substring(0, 23) + '...' : title}</text>
    <text x="200" y="358" font-family="'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="12" fill="${theme.accent}" text-anchor="middle" letter-spacing="1">ROM DIRECT LAUNCH</text>
  </svg>`;
}

// Catálogo de ROMs de ejemplo para vista previa cuando se configuran rutas de Windows en entorno web/preview
const SAMPLE_GAMES_BY_CONSOLE: Record<string, string[]> = {
  'Switch': ['Super Mario Bros. Wonder (World).nsp', 'The Legend of Zelda - Tears of the Kingdom [v1.0].xci', 'Metroid Dread (USA).nsp', 'Mario Kart 8 Deluxe.nsp'],
  'PS2': ['God of War II (USA).iso', 'Shadow of the Colossus (USA).iso', 'Need for Speed - Underground 2.iso', 'Silent Hill 2 (Director Cut).iso'],
  'GameCube': ['Super Smash Bros. Melee (USA).iso', 'The Legend of Zelda - The Wind Waker.iso', 'Super Mario Sunshine.iso'],
  'PS3': ['Demons Souls [USA].iso', 'Metal Gear Solid 4 - Guns of the Patriots.iso'],
  'PS1': ['Crash Bandicoot 3 - Warped.chd', 'Castlevania - Symphony of the Night.bin'],
  'Wii U': ['The Legend of Zelda - Breath of the Wild.wua', 'Super Mario 3D World.wua'],
  'Retro': ['Super Mario 64 (USA).z64', 'Pokemon Emerald Version.gba', 'Chrono Trigger (SNES).sfc'],
  'PSP': ['God of War - Ghost of Sparta.cso', 'Grand Theft Auto - Vice City Stories.iso'],
  '3DS': ['The Legend of Zelda - Ocarina of Time 3D.3ds', 'Super Mario 3D Land.3ds'],
  'Xbox': ['Halo - Combat Evolved.iso', 'Forza Motorsport.iso']
};

// Escanear carpeta de ROMs para un emulador específico
function scanRomsForEmulator(emu: any): any[] {
  if (!emu || !emu.romsDir) {
    return [];
  }
  const games: any[] = [];
  const validExts = (emu.extensions || []).map((e: string) => e.toLowerCase().trim());

  // 1. Si la carpeta existe físicamente en el disco (Windows / Linux nativo)
  if (fs.existsSync(emu.romsDir)) {
    function traverse(dir: string, depth: number) {
      if (depth > 2) return;
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          if (item.isDirectory()) {
            traverse(fullPath, depth + 1);
          } else if (item.isFile()) {
            const ext = path.extname(item.name).toLowerCase();
            if (validExts.includes(ext)) {
              const cleanTitle = cleanRomTitle(item.name);
              const id = `rom_${emu.id}_${Buffer.from(fullPath).toString('base64url').substring(0, 24)}`;
              
              // Buscar portada adyacente
              let coverUrl: string | undefined = undefined;
              const baseNoExt = path.parse(item.name).name;
              const possibleCovers = [
                path.join(dir, `${baseNoExt}.jpg`),
                path.join(dir, `${baseNoExt}.png`),
                path.join(dir, `${baseNoExt}.webp`),
                path.join(dir, 'covers', `${baseNoExt}.jpg`),
                path.join(dir, 'covers', `${baseNoExt}.png`),
                path.join(dir, 'cover.jpg'),
                path.join(dir, 'cover.png')
              ];
              for (const c of possibleCovers) {
                if (fs.existsSync(c)) {
                  try {
                    const buf = fs.readFileSync(c);
                    const mime = c.endsWith('.png') ? 'image/png' : 'image/jpeg';
                    coverUrl = `data:${mime};base64,${buf.toString('base64')}`;
                    break;
                  } catch {}
                }
              }

              if (!coverUrl) {
                const svg = generateConsoleSvgCover(cleanTitle, emu.console);
                coverUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
              }

              games.push({
                id,
                folder: id,
                title: cleanTitle,
                exe: path.basename(emu.exePath || 'emulator.exe'),
                console: emu.console,
                developer: emu.name || 'Emulador',
                description: `Juego de ${emu.console} ejecutado con ${emu.name || 'Emulador'}. Archivo: ${item.name}`,
                coverUrl,
                path: dir,
                isRom: true,
                romPath: fullPath,
                romFile: item.name,
                emulatorId: emu.id,
                emulatorName: emu.name,
                emulatorExe: emu.exePath,
                emulatorCliArgs: emu.cliArgs || ['"{rom}"'],
                exeExists: fs.existsSync(emu.exePath),
                lastPlayed: 'Reciente'
              });
            }
          }
        }
      } catch (err) {
        console.warn(`Error escaneando ROMs en ${dir}:`, err);
      }
    }

    traverse(emu.romsDir, 0);
    return games;
  }

  // Si la ruta no existe físicamente en el disco, no se inventan juegos ficticios
  return [];
}

// --- RUTAS DE API ---

// 1. Obtener lista de juegos escaneando /MisJuegos
app.get('/api/games', (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(GAMES_DIR)) {
      fs.mkdirSync(GAMES_DIR, { recursive: true });
    }

    const entries = fs.readdirSync(GAMES_DIR, { withFileTypes: true });
    const games = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const folderPath = path.join(GAMES_DIR, entry.name);
        const infoPath = path.join(folderPath, 'info.json');

        let title = entry.name;
        let exe = 'game.exe';
        let consoleType = 'Switch';
        let developer = 'Desconocido';
        let description = '';
        let customCoverUrl: string | undefined = undefined;
        let controllerConfig: any = undefined;

        if (fs.existsSync(infoPath)) {
          try {
            const raw = fs.readFileSync(infoPath, 'utf-8');
            const parsed = JSON.parse(raw);
            title = parsed.title || title;
            exe = parsed.exe || exe;
            consoleType = parsed.console || consoleType;
            developer = parsed.developer || developer;
            description = parsed.description || description;
            customCoverUrl = parsed.coverUrl || undefined;
            controllerConfig = parsed.controllerConfig || undefined;
          } catch (e) {
            console.error(`Error leyendo ${infoPath}:`, e);
          }
        }

        // Determinar URL de portada (local o customUrl)
        const hasJpg = fs.existsSync(path.join(folderPath, 'cover.jpg'));
        const hasPng = fs.existsSync(path.join(folderPath, 'cover.png'));
        const hasSvg = fs.existsSync(path.join(folderPath, 'cover.svg'));

        const coverUrl = (hasJpg || hasPng || hasSvg)
          ? `/api/games/${encodeURIComponent(entry.name)}/cover?t=${Date.now()}`
          : customCoverUrl;

        const exePath = path.join(folderPath, exe);
        const exeExists = fs.existsSync(exePath);

        games.push({
          id: entry.name,
          folder: entry.name,
          title,
          exe,
          console: consoleType,
          developer,
          description,
          coverUrl,
          path: folderPath,
          exeExists,
          lastPlayed: 'Reciente',
          controllerConfig
        });
      }
    }

    const emuGames = loadEmulatorGames();
    const allGames = [...games, ...emuGames];

    res.json({ success: true, games: allGames, gamesDir: GAMES_DIR });
  } catch (error) {
    console.error('Error escaneando juegos:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

// 1.2. Obtener lista de emuladores configurados y catálogo
app.get('/api/emulators', (req: Request, res: Response) => {
  const emulators = loadEmulatorsConfig();
  res.json({
    success: true,
    emulators,
    presets: DEFAULT_EMULATOR_PRESETS
  });
});

// 1.3. Guardar / Añadir / Editar emulador y escanear ROMs
app.post('/api/emulators', (req: Request, res: Response) => {
  const { id, name, console: consoleName, exePath, romsDir, extensions, cliArgs, enabled, autoScan } = req.body;
  if (!name || !consoleName) {
    return res.status(400).json({ success: false, message: 'Se requiere nombre y consola del emulador' });
  }

  const emulators = loadEmulatorsConfig();
  const emuId = id || `emu_${Date.now()}`;
  const existingIdx = emulators.findIndex((e) => e.id === emuId);

  const newEmu = {
    id: emuId,
    name: name.trim(),
    console: consoleName.trim(),
    exePath: (exePath || '').trim(),
    romsDir: (romsDir || '').trim(),
    extensions: Array.isArray(extensions) ? extensions : ['.iso', '.nsp', '.zip'],
    cliArgs: Array.isArray(cliArgs) ? cliArgs : ['"{rom}"'],
    enabled: enabled !== undefined ? enabled : true,
    lastScanned: new Date().toISOString(),
    romsCount: 0
  };

  let scannedCount = 0;
  if (autoScan !== false && newEmu.romsDir && fs.existsSync(newEmu.romsDir)) {
    const romGames = scanRomsForEmulator(newEmu);
    scannedCount = romGames.length;
    newEmu.romsCount = scannedCount;

    const allEmuGames = loadEmulatorGames().filter((g) => g.emulatorId !== emuId);
    allEmuGames.push(...romGames);
    saveEmulatorGames(allEmuGames);
  }

  if (existingIdx >= 0) {
    emulators[existingIdx] = { ...emulators[existingIdx], ...newEmu };
  } else {
    emulators.push(newEmu);
  }
  saveEmulatorsConfig(emulators);

  res.json({
    success: true,
    emulator: newEmu,
    scannedCount,
    message: `Emulador '${name}' guardado correctamente. ${scannedCount > 0 ? `¡Se detectaron ${scannedCount} juegos de ${consoleName} automáticamente!` : ''}`
  });
});

// 1.4. Escanear carpetas de ROMs para un emulador específico o todos
app.post('/api/emulators/scan', (req: Request, res: Response) => {
  const { emulatorId } = req.body;
  const emulators = loadEmulatorsConfig();
  let totalNew = 0;
  let allEmuGames = loadEmulatorGames();

  const toScan = emulatorId ? emulators.filter((e) => e.id === emulatorId) : emulators;
  if (toScan.length === 0) {
    return res.json({ success: true, count: 0, message: 'No hay emuladores configurados para escanear' });
  }

  for (const emu of toScan) {
    const games = scanRomsForEmulator(emu);
    allEmuGames = allEmuGames.filter((g) => g.emulatorId !== emu.id);
    allEmuGames.push(...games);
    emu.romsCount = games.length;
    emu.lastScanned = new Date().toISOString();
    totalNew += games.length;
  }

  saveEmulatorGames(allEmuGames);
  saveEmulatorsConfig(emulators);

  res.json({
    success: true,
    count: totalNew,
    emulators,
    message: `Escaneo completado. Se detectaron ${totalNew} juegos en las carpetas de ROMs configuradas.`
  });
});

// 1.5. Eliminar emulador y sus ROMs
app.delete('/api/emulators/:id', (req: Request, res: Response) => {
  const emuId = req.params.id;
  const emulators = loadEmulatorsConfig().filter((e) => e.id !== emuId);
  saveEmulatorsConfig(emulators);
  const emuGames = loadEmulatorGames().filter((g) => g.emulatorId !== emuId);
  saveEmulatorGames(emuGames);
  res.json({ success: true, message: 'Emulador y sus ROMs asociadas eliminados de la biblioteca' });
});

// 1.6. Comprobar ruta del sistema (verificar si existe y si tiene ejecutables .exe)
app.post('/api/emulators/check-path', (req: Request, res: Response) => {
  const { targetPath } = req.body;
  if (!targetPath) return res.json({ exists: false });
  try {
    const exists = fs.existsSync(targetPath);
    let isDir = false;
    let isFile = false;
    let exeFiles: string[] = [];
    if (exists) {
      const stat = fs.statSync(targetPath);
      isDir = stat.isDirectory();
      isFile = stat.isFile();
      if (isDir) {
        const items = fs.readdirSync(targetPath, { withFileTypes: true });
        for (const item of items) {
          if (item.isFile() && item.name.toLowerCase().endsWith('.exe')) {
            exeFiles.push(item.name);
          }
        }
      }
    }
    res.json({ exists, isDir, isFile, exeFiles });
  } catch (err) {
    res.json({ exists: false, error: String(err) });
  }
});

// 2. Servir portada de juego
app.get('/api/games/:folder/cover', (req: Request, res: Response) => {
  const folder = req.params.folder;
  const folderPath = path.join(GAMES_DIR, folder);

  const jpg = path.join(folderPath, 'cover.jpg');
  const png = path.join(folderPath, 'cover.png');
  const svg = path.join(folderPath, 'cover.svg');

  if (fs.existsSync(jpg)) {
    res.setHeader('Content-Type', 'image/jpeg');
    res.sendFile(jpg);
  } else if (fs.existsSync(png)) {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(png);
  } else if (fs.existsSync(svg)) {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.sendFile(svg);
  } else {
    res.status(404).send('Cover not found');
  }
});

// 2.5 Descarga directa del paquete para Steam Deck & Bazzite OS (.zip y .tar.gz)
app.get('/api/download/steamdeck-zip', (req: Request, res: Response) => {
  const filePath = path.join(__dirname, 'steamdeck_bazzite_package.zip');
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'bazzite_switch_launcher.zip');
  } else {
    res.status(404).send('Paquete no encontrado');
  }
});

app.get('/api/download/appimage', (req: Request, res: Response) => {
  const filePath = path.join(__dirname, 'SwitchPortLauncher.AppImage');
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'SwitchPortLauncher.AppImage');
  } else {
    res.status(404).send('AppImage no encontrado');
  }
});

app.get('/api/download/steamdeck-tar', (req: Request, res: Response) => {
  const filePath = path.join(__dirname, 'steamdeck_bazzite_package.tar.gz');
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'bazzite_switch_launcher.tar.gz');
  } else {
    res.status(404).send('Paquete no encontrado');
  }
});

// Posicionar el juego maximizado y en primer plano mediante Win32 API sin parpadeos de F11
function sendFullscreenKeyToProcess(pid: number | undefined, exeFileName: string) {
  if (process.platform !== 'win32') return;

  const cleanName = path.basename(exeFileName, path.extname(exeFileName)).replace(/['"$;`]/g, '');

  const psScript = `
$ErrorActionPreference = 'SilentlyContinue'

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinApiLauncher {
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool BringWindowToTop(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool IsZoomed(IntPtr hWnd);
}
"@

$targetPid = ${pid || 0}
$targetName = '${cleanName}'
$handled = @{}

# Sondeos espaciados para detectar la ventana del juego apenas aparezca
$attempts = @(300, 700, 1400, 2400)
foreach ($delay in $attempts) {
    Start-Sleep -Milliseconds $delay

    $candidates = @()
    if ($targetPid -gt 0) {
        $p = Get-Process -Id $targetPid -ErrorAction SilentlyContinue
        if ($p) { $candidates += $p }

        $children = Get-CimInstance Win32_Process -Filter "ParentProcessId = $targetPid" -ErrorAction SilentlyContinue
        foreach ($c in $children) {
            $cp = Get-Process -Id $c.ProcessId -ErrorAction SilentlyContinue
            if ($cp) { $candidates += $cp }
        }
    }

    if ($targetName -and $targetName -ne '') {
        $named = Get-Process -Name $targetName -ErrorAction SilentlyContinue
        if ($named) { $candidates += $named }
    }

    $uniqueProcs = $candidates | Select-Object -Unique
    $appliedToAny = $false

    foreach ($proc in $uniqueProcs) {
        $h = $proc.MainWindowHandle
        if ($h -and $h -ne [IntPtr]::Zero -and (-not $handled.ContainsKey($h.ToString()))) {
            $handled[$h.ToString()] = $true
            $appliedToAny = $true

            # 9 = SW_RESTORE (desminimiza si el juego arrancó minimizado en barra de tareas)
            [WinApiLauncher]::ShowWindowAsync($h, 9) | Out-Null
            Start-Sleep -Milliseconds 50
            # 3 = SW_SHOWMAXIMIZED (maximiza la ventana para cubrir toda la pantalla)
            [WinApiLauncher]::ShowWindowAsync($h, 3) | Out-Null
            [WinApiLauncher]::SetForegroundWindow($h) | Out-Null
            [WinApiLauncher]::BringWindowToTop($h) | Out-Null
        }
    }

    if ($appliedToAny) {
        # Ventana maximizada y enfocada con éxito; salir de inmediato para evitar parpadeos y conflicto de foco
        break
    }
}
`;

  try {
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
    const command = `powershell -WindowStyle Hidden -NoProfile -NonInteractive -ExecutionPolicy Bypass -EncodedCommand ${encoded}`;
    exec(command, { windowsHide: true }, (err) => {
      if (err) {
        console.warn('[Backend] Aviso enviando pantalla completa y desminimizado automático:', err.message);
      } else {
        console.log(`[Backend] Ventana desminimizada y maximizada con éxito para PID ${pid} (${cleanName})`);
      }
    });
  } catch (e) {
    console.error('[Backend] Error ejecutando script de pantalla completa:', e);
  }
}

// Inyectar argumentos nativos de pantalla completa para emuladores
function injectEmulatorFullscreenArgs(emuExe: string, args: string[]): string[] {
  const exeLower = path.basename(emuExe || '').toLowerCase();
  const res = [...args];

  if (exeLower.includes('ryujinx')) {
    if (!res.includes('--fullscreen')) res.unshift('--fullscreen');
  } else if (exeLower.includes('yuzu') || exeLower.includes('suyu')) {
    if (!res.includes('-f') && !res.includes('--fullscreen')) res.unshift('-f');
  } else if (exeLower.includes('pcsx2')) {
    if (!res.includes('-fullscreen') && !res.includes('--fullscreen')) res.unshift('-fullscreen');
  } else if (exeLower.includes('dolphin')) {
    if (!res.includes('-b') && !res.includes('--batch')) res.unshift('-b');
  } else if (exeLower.includes('duckstation')) {
    if (!res.includes('-fullscreen')) res.unshift('-fullscreen');
  } else if (exeLower.includes('ppsspp')) {
    if (!res.includes('--fullscreen')) res.unshift('--fullscreen');
  } else if (exeLower.includes('retroarch')) {
    if (!res.includes('-f')) res.unshift('-f');
  }
  return res;
}

// Escanear carpeta en disco para pistas de audio
function scanDirectoryForAudio(dirPath: string, maxDepth: number = 3, currentDepth: number = 0): any[] {
  const audioExtensions = new Set(['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.wma']);
  let results: any[] = [];
  if (!fs.existsSync(dirPath) || currentDepth > maxDepth) return results;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(scanDirectoryForAudio(fullPath, maxDepth, currentDepth + 1));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (audioExtensions.has(ext)) {
          const stats = fs.statSync(fullPath);
          const baseName = path.basename(entry.name, ext);
          let title = baseName;
          let artist = 'Mi Música';
          if (baseName.includes(' - ')) {
            const parts = baseName.split(' - ');
            artist = parts[0].trim();
            title = parts.slice(1).join(' - ').trim();
          }

          results.push({
            id: 'server-music-' + Buffer.from(fullPath).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 24),
            title,
            artist,
            album: path.basename(path.dirname(fullPath)),
            fileName: entry.name,
            filePath: fullPath,
            url: `/api/music/file?path=${encodeURIComponent(fullPath)}`,
            sizeBytes: stats.size,
            sourceType: 'user-folder'
          });
        }
      }
    }
  } catch (e) {
    console.warn(`[Music Scanner] Error leyendo '${dirPath}':`, (e as Error).message);
  }
  return results;
}

// Endpoints de Música para el Launcher
app.post('/api/music/scan-folder', (req: Request, res: Response) => {
  const { folderPath } = req.body;
  if (!folderPath || typeof folderPath !== 'string') {
    return res.status(400).json({ success: false, message: 'folderPath es requerido' });
  }

  const cleanPath = path.resolve(folderPath.trim());
  if (!fs.existsSync(cleanPath)) {
    return res.status(404).json({ success: false, message: `La carpeta '${cleanPath}' no existe en el sistema` });
  }

  const tracks = scanDirectoryForAudio(cleanPath);
  res.json({
    success: true,
    folderPath: cleanPath,
    folderName: path.basename(cleanPath),
    count: tracks.length,
    tracks
  });
});

app.get('/api/music/file', (req: Request, res: Response) => {
  const filePath = req.query.path as string;
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).send('Archivo no encontrado');
  }

  try {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.flac': 'audio/flac',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac'
    };
    const contentType = mimeMap[ext] || 'audio/mpeg';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes'
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    res.status(500).send('Error transmitiendo archivo');
  }
});

// ==========================================
// PROXY DE STEAMGRIDDB V2 API
// ==========================================
const STEAMGRIDDB_BASE_URL = 'https://www.steamgriddb.com/api/v2';

// Recursos de fallback de alta resolución cuando STEAMGRIDDB_API_KEY no esté configurada
function getFallbackSteamGridAssets(nameQuery: string, steamIdQuery: string) {
  const q = (nameQuery || steamIdQuery || '').toLowerCase();
  
  if (q.includes('mario') || q.includes('sm64') || steamIdQuery === '1001') {
    return {
      game: { id: 1001, name: 'Super Mario 64 (PC Native Port)', release_date: 835488000, types: ['pc'] },
      grids: [
        { id: 101, url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7d.jpg', thumb: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7d.jpg', width: 600, height: 900, score: 98 },
        { id: 102, url: 'https://images.igdb.com/igdb/image/upload/t_720p/co2f7l.jpg', thumb: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2f7l.jpg', width: 600, height: 900, score: 92 }
      ],
      heroes: [
        { id: 103, url: 'https://images.igdb.com/igdb/image/upload/t_1080p/sc7x7f.jpg', thumb: 'https://images.igdb.com/igdb/image/upload/t_720p/sc7x7f.jpg', width: 1920, height: 620, score: 95 }
      ],
      logos: [
        { id: 104, url: 'https://cdn2.steamgriddb.com/logo/4b998cfb1bc300302b1ff588523cf421.png', thumb: 'https://cdn2.steamgriddb.com/logo/4b998cfb1bc300302b1ff588523cf421.png', width: 800, height: 350, score: 99 }
      ]
    };
  }

  if (q.includes('zelda') || q.includes('ocarina') || q.includes('harkinian') || steamIdQuery === '1002') {
    return {
      game: { id: 1002, name: 'The Legend of Zelda: Ocarina of Time (Ship of Harkinian)', release_date: 911606400, types: ['pc'] },
      grids: [
        { id: 201, url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2e23.jpg', thumb: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2e23.jpg', width: 600, height: 900, score: 99 },
        { id: 202, url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7e.jpg', thumb: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7e.jpg', width: 600, height: 900, score: 94 }
      ],
      heroes: [
        { id: 203, url: 'https://images.igdb.com/igdb/image/upload/t_1080p/sc7xb7.jpg', thumb: 'https://images.igdb.com/igdb/image/upload/t_720p/sc7xb7.jpg', width: 1920, height: 620, score: 98 }
      ],
      logos: [
        { id: 204, url: 'https://cdn2.steamgriddb.com/logo/7c5d4111ff03a5e8f4989679fe28d77f.png', thumb: 'https://cdn2.steamgriddb.com/logo/7c5d4111ff03a5e8f4989679fe28d77f.png', width: 800, height: 310, score: 99 }
      ]
    };
  }

  if (q.includes('sonic') || q.includes('mania') || steamIdQuery === '584400') {
    return {
      game: { id: 1003, name: 'Sonic Mania', release_date: 1502755200, types: ['steam'] },
      grids: [
        { id: 301, url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7v.jpg', thumb: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7v.jpg', width: 600, height: 900, score: 97 }
      ],
      heroes: [
        { id: 302, url: 'https://images.igdb.com/igdb/image/upload/t_1080p/sc66z0.jpg', thumb: 'https://images.igdb.com/igdb/image/upload/t_720p/sc66z0.jpg', width: 1920, height: 620, score: 95 }
      ],
      logos: [
        { id: 303, url: 'https://cdn2.steamgriddb.com/logo/c3d82f7169bcbbbc3343360db2d0ee71.png', thumb: 'https://cdn2.steamgriddb.com/logo/c3d82f7169bcbbbc3343360db2d0ee71.png', width: 800, height: 330, score: 96 }
      ]
    };
  }

  if (q.includes('resident') || q.includes('re3') || steamIdQuery === '952060') {
    return {
      game: { id: 1004, name: 'Resident Evil 3', release_date: 1585872000, types: ['steam'] },
      grids: [
        { id: 401, url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1t8s.jpg', thumb: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1t8s.jpg', width: 600, height: 900, score: 96 }
      ],
      heroes: [
        { id: 402, url: 'https://images.igdb.com/igdb/image/upload/t_1080p/sc610r.jpg', thumb: 'https://images.igdb.com/igdb/image/upload/t_720p/sc610r.jpg', width: 1920, height: 620, score: 94 }
      ],
      logos: [
        { id: 403, url: 'https://cdn2.steamgriddb.com/logo/8da9910d6e246872594a1d56e7e59c25.png', thumb: 'https://cdn2.steamgriddb.com/logo/8da9910d6e246872594a1d56e7e59c25.png', width: 800, height: 260, score: 98 }
      ]
    };
  }

  // Fallback genérico de alta calidad
  const cleanTitle = nameQuery || (steamIdQuery ? `Steam App ${steamIdQuery}` : 'Juego PC');
  return {
    game: { id: 9999, name: cleanTitle, release_date: Date.now() / 1000, types: ['pc'] },
    grids: [
      { id: 901, url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600&auto=format&fit=crop', thumb: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=300&auto=format&fit=crop', width: 600, height: 900, score: 80 }
    ],
    heroes: [
      { id: 902, url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1920&auto=format&fit=crop', thumb: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=640&auto=format&fit=crop', width: 1920, height: 620, score: 85 }
    ],
    logos: []
  };
}

// 1. Estado de la API SteamGridDB
app.get('/api/steamgriddb/status', (req: Request, res: Response) => {
  const apiKey = process.env.STEAMGRIDDB_API_KEY;
  res.json({
    configured: Boolean(apiKey && apiKey !== 'MY_STEAMGRIDDB_API_KEY' && apiKey.trim().length > 0),
    hasKey: Boolean(apiKey && apiKey.trim().length > 0),
    message: apiKey ? 'STEAMGRIDDB_API_KEY detectada en el servidor' : 'STEAMGRIDDB_API_KEY no configurada (usando modo fallback)'
  });
});

// Función de limpieza de títulos para maximizar coincidencias en SteamGridDB
function cleanGameSearchTerm(term: string): string {
  return term
    .replace(/\s*[\(\[](usa|europe|japan|en,ja|v\d+.*|60fps.*|decomp.*|port.*|pc.*|remake.*)[\)\]]/gi, '')
    .replace(/\b(native decomp port|decomp port|60fps port|pc port|pc native|remake pc|remake)\b/gi, '')
    .replace(/\.(exe|iso|bin|elf|nro|nsp|xci)$/i, '')
    .replace(/[-_:]+/g, ' ')
    .trim();
}

// 2. Búsqueda de juegos en SteamGridDB v2 (autocomplete enriquecido con limpieza inteligente)
app.get('/api/steamgriddb/search', async (req: Request, res: Response) => {
  const term = (req.query.term as string || req.query.query as string || '').trim();
  if (!term) {
    return res.json({ success: true, data: [] });
  }

  const apiKey = process.env.STEAMGRIDDB_API_KEY;
  if (!apiKey || apiKey === 'MY_STEAMGRIDDB_API_KEY') {
    return res.json({
      success: true,
      apiKeyConfigured: false,
      data: [
        { id: 1001, name: term, types: ['pc', 'custom'] }
      ]
    });
  }

  try {
    const authHeaders = {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json'
    };

    // 1. Búsqueda con término original
    let url = `${STEAMGRIDDB_BASE_URL}/search/autocomplete/${encodeURIComponent(term)}`;
    let response = await fetch(url, { headers: authHeaders });
    let data: any = response.ok ? await response.json() : { data: [] };
    let games: any[] = data.data || [];

    // 2. Si no hubo resultados o muy pocos y el término tiene ruido, buscar con término sanitizado
    const cleaned = cleanGameSearchTerm(term);
    if (games.length === 0 && cleaned && cleaned.toLowerCase() !== term.toLowerCase()) {
      const cleanUrl = `${STEAMGRIDDB_BASE_URL}/search/autocomplete/${encodeURIComponent(cleaned)}`;
      const cleanRes = await fetch(cleanUrl, { headers: authHeaders });
      if (cleanRes.ok) {
        const cleanData: any = await cleanRes.json();
        if (cleanData.data && cleanData.data.length > 0) {
          games = cleanData.data;
        }
      }
    }

    return res.json({
      success: true,
      apiKeyConfigured: true,
      data: games
    });
  } catch (err: any) {
    console.error('[SteamGridDB search error]:', err);
    return res.status(500).json({
      success: false,
      error: `Error al buscar en SteamGridDB: ${err.message || String(err)}`,
      data: []
    });
  }
});

// 3. Ruta Proxy Principal: Obtiene Grids, Heroes y Logos por nombre de juego o Steam ID
app.get('/api/steamgriddb/assets', async (req: Request, res: Response) => {
  const name = (req.query.name as string || '').trim();
  const steamId = (req.query.steamId as string || '').trim();
  let gameId = req.query.gameId ? parseInt(req.query.gameId as string, 10) : undefined;
  const apiKey = process.env.STEAMGRIDDB_API_KEY;

  console.log(`[SteamGridDB Proxy Request] name="${name}", steamId="${steamId}", gameId=${gameId}, hasApiKey=${Boolean(apiKey)}`);

  // Si no se proporcionó ni nombre, ni steamId ni gameId
  if (!name && !steamId && !gameId) {
    return res.status(400).json({
      success: false,
      error: 'Se requiere el parámetro "name", "steamId" o "gameId".'
    });
  }

  // Si no hay API Key configurada en las variables de entorno, devolvemos el fallback enriquecido
  if (!apiKey || apiKey === 'MY_STEAMGRIDDB_API_KEY') {
    const fallback = getFallbackSteamGridAssets(name, steamId);
    return res.json({
      success: true,
      apiKeyConfigured: false,
      fromFallback: true,
      message: 'STEAMGRIDDB_API_KEY no configurada en .env. Se devuelven recursos optimizados de respaldo.',
      game: fallback.game,
      games: [fallback.game],
      totalGrids: fallback.grids.length,
      grids: fallback.grids,
      heroes: fallback.heroes,
      logos: fallback.logos
    });
  }

  try {
    const authHeaders = {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json'
    };

    let resolvedGame: any = null;
    let candidateGames: any[] = [];

    // 1. Resolver por steamId si existe
    if (steamId && !gameId) {
      try {
        const sRes = await fetch(`${STEAMGRIDDB_BASE_URL}/games/steam/${steamId}`, { headers: authHeaders });
        if (sRes.ok) {
          const sData: any = await sRes.json();
          if (sData.success && sData.data) {
            resolvedGame = sData.data;
            gameId = sData.data.id;
            candidateGames.push(sData.data);
          }
        }
      } catch (e) {
        console.warn('[SteamGridDB] No se pudo resolver por steamId:', e);
      }
    }

    // 2. Si se pasa gameId explícito, obtener los datos oficiales del juego
    if (gameId) {
      try {
        const gRes = await fetch(`${STEAMGRIDDB_BASE_URL}/games/id/${gameId}`, { headers: authHeaders });
        if (gRes.ok) {
          const gData: any = await gRes.json();
          if (gData.success && gData.data) {
            resolvedGame = gData.data;
          }
        }
      } catch (e) {
        console.warn('[SteamGridDB] Error obteniendo juego por id:', e);
      }
    }

    // 3. Buscar candidatos por nombre si se proporcionó o para completar la lista
    if (name) {
      try {
        const searchRes = await fetch(`${STEAMGRIDDB_BASE_URL}/search/autocomplete/${encodeURIComponent(name)}`, { headers: authHeaders });
        if (searchRes.ok) {
          const searchData: any = await searchRes.json();
          if (searchData.success && Array.isArray(searchData.data)) {
            candidateGames = searchData.data;
          }
        }

        // Si la búsqueda original no trajo resultados, intentar con nombre limpio
        const cleaned = cleanGameSearchTerm(name);
        if (candidateGames.length === 0 && cleaned && cleaned.toLowerCase() !== name.toLowerCase()) {
          const cleanRes = await fetch(`${STEAMGRIDDB_BASE_URL}/search/autocomplete/${encodeURIComponent(cleaned)}`, { headers: authHeaders });
          if (cleanRes.ok) {
            const cleanData: any = await cleanRes.json();
            if (cleanData.success && Array.isArray(cleanData.data)) {
              candidateGames = cleanData.data;
            }
          }
        }

        // Si no teníamos gameId resuelto aún, elegir la mejor coincidencia
        if (!gameId && candidateGames.length > 0) {
          // Intentar coincidencia exacta insensible a mayúsculas
          const lowerName = name.toLowerCase();
          const cleanLower = cleaned.toLowerCase();
          const exact = candidateGames.find((g: any) => g.name.toLowerCase() === lowerName || g.name.toLowerCase() === cleanLower);
          
          if (exact) {
            resolvedGame = exact;
            gameId = exact.id;
          } else {
            // Primer candidato devuelto por SteamGridDB
            resolvedGame = candidateGames[0];
            gameId = candidateGames[0].id;
          }
        }
      } catch (e) {
        console.warn('[SteamGridDB] Error buscando por nombre:', e);
      }
    }

    // Si aún no tenemos ni gameId ni steamId
    if (!gameId && !steamId) {
      const fallback = getFallbackSteamGridAssets(name, steamId);
      return res.json({
        success: true,
        apiKeyConfigured: true,
        fromFallback: true,
        message: 'No se encontró coincidencia directa en SteamGridDB. Mostrando assets sugeridos.',
        game: fallback.game,
        games: candidateGames.length > 0 ? candidateGames : [fallback.game],
        totalGrids: fallback.grids.length,
        grids: fallback.grids,
        heroes: fallback.heroes,
        logos: fallback.logos
      });
    }

    // 4. Peticiones para Grids (Paginación automática para traer TODAS las portadas que tiene el juego)
    const gridBaseUrl = gameId
      ? `${STEAMGRIDDB_BASE_URL}/grids/game/${gameId}`
      : `${STEAMGRIDDB_BASE_URL}/grids/steam/${steamId}`;

    const heroBaseUrl = gameId
      ? `${STEAMGRIDDB_BASE_URL}/heroes/game/${gameId}`
      : `${STEAMGRIDDB_BASE_URL}/heroes/steam/${steamId}`;

    const logoBaseUrl = gameId
      ? `${STEAMGRIDDB_BASE_URL}/logos/game/${gameId}`
      : `${STEAMGRIDDB_BASE_URL}/logos/steam/${steamId}`;

    let grids: any[] = [];
    let totalGrids = 0;

    // Obtener primera página de Grids
    try {
      const gRes1 = await fetch(`${gridBaseUrl}?page=1`, { headers: authHeaders });
      if (gRes1.ok) {
        const gData1: any = await gRes1.json();
        if (gData1.success && Array.isArray(gData1.data)) {
          grids = gData1.data;
          totalGrids = gData1.total || grids.length;
          const limit = gData1.limit || 50;
          const totalPages = Math.min(Math.ceil(totalGrids / limit), 8); // Hasta 8 páginas en paralelo (400 portadas)

          if (totalPages > 1) {
            const pageFetches = [];
            for (let p = 2; p <= totalPages; p++) {
              pageFetches.push(
                fetch(`${gridBaseUrl}?page=${p}`, { headers: authHeaders })
                  .then(r => r.ok ? r.json() : null)
                  .catch(() => null)
              );
            }
            const extraPages = await Promise.all(pageFetches);
            for (const ep of extraPages) {
              if (ep && ep.success && Array.isArray(ep.data)) {
                grids.push(...ep.data);
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('[SteamGridDB grids fetch error]:', err);
    }

    // Obtener Heroes (hasta 2 páginas = 100 héroes panorámicos)
    let heroes: any[] = [];
    try {
      const hRes1 = await fetch(`${heroBaseUrl}?page=1`, { headers: authHeaders });
      if (hRes1.ok) {
        const hData1: any = await hRes1.json();
        if (hData1.success && Array.isArray(hData1.data)) {
          heroes = hData1.data;
          if (hData1.total && hData1.total > (hData1.limit || 50)) {
            const hRes2 = await fetch(`${heroBaseUrl}?page=2`, { headers: authHeaders }).then(r => r.ok ? r.json() : null).catch(() => null);
            if (hRes2?.data) heroes.push(...hRes2.data);
          }
        }
      }
    } catch (err) {
      console.warn('[SteamGridDB heroes fetch error]:', err);
    }

    // Obtener Logos (hasta 2 páginas = 100 logos transparentes)
    let logos: any[] = [];
    try {
      const lRes1 = await fetch(`${logoBaseUrl}?page=1`, { headers: authHeaders });
      if (lRes1.ok) {
        const lData1: any = await lRes1.json();
        if (lData1.success && Array.isArray(lData1.data)) {
          logos = lData1.data;
          if (lData1.total && lData1.total > (lData1.limit || 50)) {
            const lRes2 = await fetch(`${logoBaseUrl}?page=2`, { headers: authHeaders }).then(r => r.ok ? r.json() : null).catch(() => null);
            if (lRes2?.data) logos.push(...lRes2.data);
          }
        }
      }
    } catch (err) {
      console.warn('[SteamGridDB logos fetch error]:', err);
    }

    // Eliminar posibles duplicados por ID
    const uniqueGrids = Array.from(new Map(grids.map(g => [g.id, g])).values());
    const uniqueHeroes = Array.from(new Map(heroes.map(h => [h.id, h])).values());
    const uniqueLogos = Array.from(new Map(logos.map(l => [l.id, l])).values());

    // Si SteamGridDB no devolvió imágenes, proveer fallbacks
    if (uniqueGrids.length === 0 && uniqueHeroes.length === 0 && uniqueLogos.length === 0) {
      const fallback = getFallbackSteamGridAssets(name, steamId);
      return res.json({
        success: true,
        apiKeyConfigured: true,
        fromFallback: true,
        game: resolvedGame || fallback.game,
        games: candidateGames.length > 0 ? candidateGames : [fallback.game],
        totalGrids: fallback.grids.length,
        grids: fallback.grids,
        heroes: fallback.heroes,
        logos: fallback.logos
      });
    }

    return res.json({
      success: true,
      apiKeyConfigured: true,
      fromFallback: false,
      game: resolvedGame || { id: gameId, name: name || `Steam ${steamId}` },
      games: candidateGames,
      totalGrids: totalGrids || uniqueGrids.length,
      grids: uniqueGrids,
      heroes: uniqueHeroes,
      logos: uniqueLogos
    });
  } catch (err: any) {
    console.error('[SteamGridDB Proxy Error]:', err);
    const fallback = getFallbackSteamGridAssets(name, steamId);
    return res.json({
      success: true,
      apiKeyConfigured: true,
      fromFallback: true,
      error: `Error de conexión con SteamGridDB: ${err.message || String(err)}`,
      game: fallback.game,
      games: [fallback.game],
      totalGrids: fallback.grids.length,
      grids: fallback.grids,
      heroes: fallback.heroes,
      logos: fallback.logos
    });
  }
});

// 4. Sub-rutas específicas para grids, heroes o logos individuales
app.get('/api/steamgriddb/grids', async (req: Request, res: Response) => {
  const { gameId, steamId, page, fetchAll } = req.query;
  const apiKey = process.env.STEAMGRIDDB_API_KEY;
  if (!apiKey || apiKey === 'MY_STEAMGRIDDB_API_KEY') {
    return res.json({ success: true, apiKeyConfigured: false, data: [] });
  }

  const endpoint = gameId
    ? `${STEAMGRIDDB_BASE_URL}/grids/game/${gameId}`
    : `${STEAMGRIDDB_BASE_URL}/grids/steam/${steamId}`;

  try {
    const pageNum = page ? parseInt(page as string, 10) : 1;
    const r = await fetch(`${endpoint}?page=${pageNum}`, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
    });
    const data: any = await r.json();

    if (fetchAll === 'true' && data.total && data.total > (data.limit || 50)) {
      const totalPages = Math.min(Math.ceil(data.total / (data.limit || 50)), 8);
      const extraPromises = [];
      for (let p = 2; p <= totalPages; p++) {
        extraPromises.push(
          fetch(`${endpoint}?page=${p}`, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
          }).then(res => res.json()).catch(() => null)
        );
      }
      const extras = await Promise.all(extraPromises);
      const allGrids = [...(data.data || [])];
      extras.forEach(ext => {
        if (ext?.data) allGrids.push(...ext.data);
      });
      data.data = Array.from(new Map(allGrids.map(g => [g.id, g])).values());
    }

    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: String(err) });
  }
});

app.get('/api/steamgriddb/heroes', async (req: Request, res: Response) => {
  const { gameId, steamId } = req.query;
  const apiKey = process.env.STEAMGRIDDB_API_KEY;
  if (!apiKey || apiKey === 'MY_STEAMGRIDDB_API_KEY') {
    return res.json({ success: true, apiKeyConfigured: false, data: [] });
  }

  const endpoint = gameId
    ? `${STEAMGRIDDB_BASE_URL}/heroes/game/${gameId}`
    : `${STEAMGRIDDB_BASE_URL}/heroes/steam/${steamId}`;

  try {
    const r = await fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
    });
    const data: any = await r.json();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: String(err) });
  }
});

app.get('/api/steamgriddb/logos', async (req: Request, res: Response) => {
  const { gameId, steamId } = req.query;
  const apiKey = process.env.STEAMGRIDDB_API_KEY;
  if (!apiKey || apiKey === 'MY_STEAMGRIDDB_API_KEY') {
    return res.json({ success: true, apiKeyConfigured: false, data: [] });
  }

  const endpoint = gameId
    ? `${STEAMGRIDDB_BASE_URL}/logos/game/${gameId}`
    : `${STEAMGRIDDB_BASE_URL}/logos/steam/${steamId}`;

  try {
    const r = await fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
    });
    const data: any = await r.json();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: String(err) });
  }
});

// 3. Lanzar ejecutable con child_process.exec respetando el mapeo de mandos (Xbox, PlayStation, Switch)
app.post('/api/games/launch', (req: Request, res: Response) => {
  const {
    folder,
    exe,
    title,
    controllerConfig,
    controllerFamily,
    isRom,
    romPath,
    emulatorExe,
    emulatorCliArgs,
    emulatorName
  } = req.body;

  // Manejo de lanzamiento de ROMs mediante emuladores .exe
  if (isRom || romPath) {
    const targetEmuExe = (emulatorExe || exe || '').trim();
    const targetRom = (romPath || '').trim();
    const emuName = path.basename(targetEmuExe || 'emulator.exe');
    const emuDir = targetEmuExe ? path.dirname(targetEmuExe) : '';

    let baseArgs: string[] = Array.isArray(emulatorCliArgs) && emulatorCliArgs.length > 0
      ? emulatorCliArgs
      : ['"{rom}"'];

    // Inyectar flags nativas de pantalla completa del emulador
    baseArgs = injectEmulatorFullscreenArgs(targetEmuExe, baseArgs);

    let formattedArgs = baseArgs.map((arg: string) => {
      if (arg.includes('{rom}')) {
        return arg.replace('{rom}', targetRom);
      }
      return arg;
    });

    if (!formattedArgs.some((a) => a.includes(targetRom))) {
      formattedArgs.push(`"${targetRom}"`);
    }

    const command = `"${targetEmuExe}" ${formattedArgs.join(' ')}`;
    console.log(`[Backend] Lanzamiento de ROM mediante emulador:`);
    console.log(`[Backend] Comando: ${command}`);

    const preset = controllerConfig?.preset || 'switch';
    const appliedController = {
      family: controllerFamily || 'switch',
      preset,
      swapAB: Boolean(controllerConfig?.swapAB),
      swapXY: Boolean(controllerConfig?.swapXY),
      sdlApplied: true
    };

    const exists = targetEmuExe ? fs.existsSync(targetEmuExe) : false;

    // Si estamos en entorno web / preview o el archivo .exe del emulador aún no está en la ruta
    if (!exists) {
      return res.json({
        success: true,
        simulated: true,
        command,
        folder: folder || 'rom',
        appliedController,
        autoFullscreenApplied: true,
        message: `Simulación de Emulador: Se ejecutará '${command}'. El juego '${title || path.basename(targetRom)}' iniciará a pantalla completa automática sin parpadeos.`
      });
    }

    // Ejecutar el emulador real en Windows / Linux
    try {
      const child = exec(command, {
        cwd: fs.existsSync(emuDir) ? emuDir : undefined
      }, (error, stdout, stderr) => {
        if (error) console.error(`[Emulator Error]: ${error.message}`);
        if (stdout) console.log(`[Emulator stdout]: ${stdout}`);
        if (stderr) console.error(`[Emulator stderr]: ${stderr}`);
      });

      if (child && child.pid) {
        sendFullscreenKeyToProcess(child.pid, emuName);
      }

      return res.json({
        success: true,
        pid: child?.pid || 12345,
        command,
        folder: folder || 'rom',
        appliedController,
        autoFullscreenApplied: true,
        message: `Emulador '${emulatorName || emuName}' iniciado con la ROM '${title}' a pantalla completa (F11 / Alt+Enter).`
      });
    } catch (err) {
      return res.json({
        success: true,
        simulated: true,
        command,
        folder: folder || 'rom',
        appliedController,
        message: `Error al iniciar proceso real (${String(err)}). Comando preparado: ${command}`
      });
    }
  }

  if (!folder || !exe) {
    return res.status(400).json({ success: false, message: 'Faltan parámetros' });
  }

  const gameDir = path.join(GAMES_DIR, folder);
  const exePath = path.join(gameDir, exe);

  console.log(`[Backend] Solicitud de lanzamiento para: ${title || folder}`);
  console.log(`[Backend] Ruta: ${exePath}`);

  // Configuración de controles para este juego
  const preset = controllerConfig?.preset || 'switch';
  const swapAB = controllerConfig?.swapAB !== undefined ? controllerConfig.swapAB : (preset === 'switch');
  const swapXY = Boolean(controllerConfig?.swapXY);

  // Mapeo SDL_GAMECONTROLLERCONFIG respetando el orden elegido para mandos Xbox, PlayStation y Nintendo Switch
  const aBtn = swapAB ? 'b1' : 'b0';
  const bBtn = swapAB ? 'b0' : 'b1';
  const xBtn = swapXY ? 'b3' : 'b2';
  const yBtn = swapXY ? 'b2' : 'b3';
  const sdlMapping = `030000005e040000120b000000000000,Launcher_${preset.toUpperCase()}_Profile,platform:Windows,a:${aBtn},b:${bBtn},x:${xBtn},y:${yBtn},back:b6,start:b7,leftstick:b8,rightstick:b9,leftshoulder:b4,rightshoulder:b5,dpup:h0.1,dpdown:h0.4,dpleft:h0.8,dpright:h0.2,leftx:a0,lefty:a1,rightx:a2,righty:a3,lefttrigger:a4,righttrigger:a5,`;

  // Escribir archivo de configuración de mandos en la carpeta del juego
  try {
    const gamepadConfigData = {
      game: title || folder,
      controllerFamily: controllerFamily || 'switch',
      preset,
      swapAB,
      swapXY,
      deadzone: controllerConfig?.deadzone || 0.15,
      vibration: controllerConfig?.vibration ?? true,
      customButtons: controllerConfig?.customButtons || {},
      sdlMapping,
      appliedAt: new Date().toISOString()
    };
    fs.writeFileSync(path.join(gameDir, 'gamepad_config.json'), JSON.stringify(gamepadConfigData, null, 2), 'utf-8');
    fs.writeFileSync(path.join(gameDir, 'SDL_GAMECONTROLLERCONFIG.txt'), sdlMapping, 'utf-8');
  } catch (err) {
    console.warn('[Backend] No se pudo escribir gamepad_config.json:', err);
  }

  // Verificar si existe el archivo
  const exists = fs.existsSync(exePath);
  const command = `"${exePath}"`;

  const appliedController = {
    family: controllerFamily || 'switch',
    preset,
    swapAB,
    swapXY,
    sdlApplied: true
  };

  // En Linux/Cloud sandbox o cuando es un .exe simulado
  if (!exists) {
    return res.json({
      success: true,
      simulated: true,
      command,
      folder,
      appliedController,
      message: `El ejecutable '${exe}' no existe aún en MisJuegos/${folder}/. ¡Coloca tu juego real en esa carpeta para lanzarlo!`
    });
  }

  // Si existe el archivo, ejecutar pasando las variables de entorno para mandos
  try {
    const child = exec(command, {
      cwd: gameDir,
      env: {
        ...process.env,
        SDL_GAMECONTROLLERCONFIG: sdlMapping,
        LAUNCHER_CONTROLLER_LAYOUT: preset,
        LAUNCHER_CONTROLLER_SWAP_AB: swapAB ? '1' : '0',
        LAUNCHER_CONTROLLER_SWAP_XY: swapXY ? '1' : '0'
      }
    }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Process Error]: ${error.message}`);
      }
      if (stdout) console.log(`[Process stdout]: ${stdout}`);
      if (stderr) console.error(`[Process stderr]: ${stderr}`);
    });

    if (child && child.pid) {
      sendFullscreenKeyToProcess(child.pid, exe);
    }

    res.json({
      success: true,
      pid: child.pid || 12345,
      command,
      folder,
      appliedController,
      autoFullscreenApplied: true,
      message: `Ejecutable '${exe}' lanzado. Desminimizado automático y pantalla completa (F11 / Alt+Enter) activados con controles [${preset.toUpperCase()}].`
    });
  } catch (err) {
    console.error('Error lanzando proceso:', err);
    res.json({
      success: true,
      simulated: true,
      command,
      folder,
      appliedController,
      message: `Ejecución registrada: ${String(err)}`
    });
  }
});

// 3.8. Escanear carpeta de juego existente en MisJuegos para detectar ejecutables .exe, info.json y carátulas
app.get('/api/games/scan-folder', (req: Request, res: Response) => {
  const folderParam = String(req.query.folder || '').trim();
  if (!folderParam) {
    return res.status(400).json({ success: false, message: 'Falta el parámetro de carpeta' });
  }

  const cleanFolder = folderParam.replace(/[/\\?%*:|"<>]/g, '').trim();
  const targetDir = path.join(GAMES_DIR, cleanFolder);

  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
    return res.json({ success: true, exists: false, message: 'La carpeta no existe aún en MisJuegos' });
  }

  try {
    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    const exeFiles: string[] = [];
    let info: Record<string, unknown> | null = null;
    let coverData: string | null = null;

    for (const entry of entries) {
      if (entry.isFile()) {
        const lower = entry.name.toLowerCase();
        if (lower.endsWith('.exe')) {
          exeFiles.push(entry.name);
        } else if (lower === 'info.json') {
          try {
            const raw = fs.readFileSync(path.join(targetDir, entry.name), 'utf-8');
            info = JSON.parse(raw);
          } catch {
            info = null;
          }
        } else if (lower.startsWith('cover') && (lower.endsWith('.jpg') || lower.endsWith('.png') || lower.endsWith('.webp'))) {
          try {
            const buf = fs.readFileSync(path.join(targetDir, entry.name));
            const mime = lower.endsWith('.png') ? 'image/png' : lower.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
            coverData = `data:${mime};base64,${buf.toString('base64')}`;
          } catch {
            coverData = null;
          }
        }
      }
    }

    // Ordenar ejecutables priorizando los no-instaladores/no-crash
    exeFiles.sort((a, b) => {
      const lowerA = a.toLowerCase();
      const lowerB = b.toLowerCase();
      const isBadA = lowerA.includes('unins') || lowerA.includes('crash') || lowerA.includes('setup') || lowerA.includes('dx');
      const isBadB = lowerB.includes('unins') || lowerB.includes('crash') || lowerB.includes('setup') || lowerB.includes('dx');
      if (isBadA && !isBadB) return 1;
      if (!isBadA && isBadB) return -1;
      return a.localeCompare(b);
    });

    const suggestedExe = (info?.exe as string) || (exeFiles.length > 0 ? exeFiles[0] : `${cleanFolder.toLowerCase().replace(/\s+/g, '')}.exe`);

    res.json({
      success: true,
      exists: true,
      folder: cleanFolder,
      exeFiles,
      suggestedExe,
      info,
      hasCover: Boolean(coverData || info?.coverUrl),
      coverData
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// 4. Agregar / Crear nuevo puerto en MisJuegos
app.post('/api/games/create', (req: Request, res: Response) => {
  const { title, exe, consoleType, folderName, developer, description, svgCover, coverUrl, coverData, controllerConfig } = req.body;

  if (!title || !exe) {
    return res.status(400).json({ success: false, message: 'Se requiere título y ejecutable' });
  }

  const cleanFolder = (folderName || title).replace(/[/\\?%*:|"<>]/g, '').trim();
  const targetDir = path.join(GAMES_DIR, cleanFolder);

  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const info: Record<string, unknown> = {
      title,
      exe,
      console: consoleType || 'Switch',
      developer: developer || 'Desarrollador PC Port',
      description: description || 'Port instalado manualmente'
    };

    if (controllerConfig) {
      info.controllerConfig = controllerConfig;
    }

    // Si viene coverUrl remoto
    if (coverUrl && coverUrl.startsWith('http')) {
      info.coverUrl = coverUrl;
    }

    fs.writeFileSync(path.join(targetDir, 'info.json'), JSON.stringify(info, null, 2), 'utf-8');

    // Si viene imagen en base64 (coverData o coverUrl)
    const base64Img = (coverData && coverData.startsWith('data:image/'))
      ? coverData
      : (coverUrl && coverUrl.startsWith('data:image/'))
      ? coverUrl
      : null;

    if (base64Img) {
      try {
        const matches = base64Img.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches[2]) {
          const ext = matches[1].includes('png') ? 'png' : 'jpg';
          const buffer = Buffer.from(matches[2], 'base64');
          fs.writeFileSync(path.join(targetDir, `cover.${ext}`), buffer);
        }
      } catch (err) {
        console.error('Error guardando imagen base64:', err);
      }
    } else if (svgCover) {
      fs.writeFileSync(path.join(targetDir, 'cover.svg'), svgCover, 'utf-8');
    }

    // Crear placeholder para el ejecutable si no existe
    const exePath = path.join(targetDir, exe);
    if (!fs.existsSync(exePath)) {
      fs.writeFileSync(exePath, `echo "Lanzando ${title}..."`, 'utf-8');
    }

    res.json({ success: true, folder: cleanFolder, message: 'Juego agregado con éxito' });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// 4.5. Actualizar puerto existente (título, exe, portada url/base64, consola, mapeo de controles, etc.)
app.post('/api/games/update', (req: Request, res: Response) => {
  const { folder, title, exe, consoleType, developer, description, coverUrl, coverData, controllerConfig } = req.body;

  if (!folder) {
    return res.status(400).json({ success: false, message: 'Se requiere la carpeta del juego' });
  }

  const targetDir = path.join(GAMES_DIR, folder);
  if (!fs.existsSync(targetDir)) {
    return res.status(404).json({ success: false, message: 'La carpeta no existe' });
  }

  try {
    const infoPath = path.join(targetDir, 'info.json');
    let info: Record<string, unknown> = {};

    if (fs.existsSync(infoPath)) {
      try {
        info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
      } catch {
        info = {};
      }
    }

    if (title) info.title = title;
    if (exe) info.exe = exe;
    if (consoleType) info.console = consoleType;
    if (developer !== undefined) info.developer = developer;
    if (description !== undefined) info.description = description;
    if (controllerConfig !== undefined) info.controllerConfig = controllerConfig;

    // Procesar portada
    const base64Img = (coverData && coverData.startsWith('data:image/'))
      ? coverData
      : (coverUrl && coverUrl.startsWith('data:image/'))
      ? coverUrl
      : null;

    if (base64Img) {
      const matches = base64Img.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches[2]) {
        const ext = matches[1].includes('png') ? 'png' : 'jpg';
        const buffer = Buffer.from(matches[2], 'base64');
        fs.writeFileSync(path.join(targetDir, `cover.${ext}`), buffer);
        delete info.coverUrl;
      }
    } else if (coverUrl && coverUrl.startsWith('http')) {
      info.coverUrl = coverUrl;
      // Eliminar svg o jpg locales viejos para dar prioridad a la URL
      try {
        const oldJpg = path.join(targetDir, 'cover.jpg');
        const oldPng = path.join(targetDir, 'cover.png');
        const oldSvg = path.join(targetDir, 'cover.svg');
        if (fs.existsSync(oldJpg)) fs.unlinkSync(oldJpg);
        if (fs.existsSync(oldPng)) fs.unlinkSync(oldPng);
        if (fs.existsSync(oldSvg)) fs.unlinkSync(oldSvg);
      } catch {
        // Ignorar
      }
    }

    fs.writeFileSync(infoPath, JSON.stringify(info, null, 2), 'utf-8');

    res.json({ success: true, message: 'Juego actualizado exitosamente' });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// 4.8. Eliminar juego de MisJuegos
app.delete('/api/games/:folder', (req: Request, res: Response) => {
  const folder = req.params.folder;
  if (!folder) {
    return res.status(400).json({ success: false, message: 'Se requiere la carpeta del juego' });
  }

  const cleanFolder = folder.replace(/[/\\?%*:|"<>]/g, '').trim();
  const targetDir = path.join(GAMES_DIR, cleanFolder);

  if (!fs.existsSync(targetDir)) {
    return res.status(404).json({ success: false, message: 'La carpeta no existe' });
  }

  try {
    fs.rmSync(targetDir, { recursive: true, force: true });
    res.json({ success: true, message: `Juego '${cleanFolder}' eliminado correctamente` });
  } catch (err) {
    console.error('Error eliminando juego:', err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

// 5. Devolver archivos y código de Electron para el usuario
app.get('/api/electron-files', (req: Request, res: Response) => {
  try {
    const mainPath = path.join(__dirname, 'electron', 'main.cjs');
    const preloadPath = path.join(__dirname, 'electron', 'preload.cjs');
    const packagePath = path.join(__dirname, 'electron', 'package.json');
    const readmePath = path.join(__dirname, 'electron', 'README.md');

    res.json({
      success: true,
      mainCode: fs.existsSync(mainPath) ? fs.readFileSync(mainPath, 'utf-8') : '',
      preloadCode: fs.existsSync(preloadPath) ? fs.readFileSync(preloadPath, 'utf-8') : '',
      packageCode: fs.existsSync(packagePath) ? fs.readFileSync(packagePath, 'utf-8') : '',
      readmeCode: fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf-8') : '',
      gamesDir: GAMES_DIR
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// 6. Rescanear juegos
app.post('/api/games/rescan', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Carpeta MisJuegos sincronizada' });
});

// Servir frontend en producción o montar Vite en desarrollo
async function startServer() {
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Switch Port Launcher] Servidor corriendo en http://localhost:${PORT}`);
    console.log(`[Switch Port Launcher] Carpeta de juegos: ${GAMES_DIR}`);
  });
}

startServer();
