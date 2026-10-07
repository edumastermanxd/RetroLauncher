#!/usr/bin/env python3
"""
Bazzite OS & Steam Deck Native Game & Emulator Frontend Launcher
-----------------------------------------------------------------
Desarrollado para entornos inmutables (Bazzite, SteamOS, Fedora Silverblue).
Sin dependencias externas (usa la biblioteca estándar de Python 3).
Consume menos de 20 MB de memoria RAM.
"""

import os
import sys
import json
import glob
import shlex
import shutil
import signal
import urllib.parse
import subprocess
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

PORT = 7878
SCRIPT_DIR = Path(__file__).resolve().parent
DIST_DIR = SCRIPT_DIR / "dist"
CONFIG_FILE = SCRIPT_DIR / "bazzite_config.json"

# Perfiles de emuladores conocidos en Bazzite / EmuDeck / RetroDeck
EMULATOR_PROFILES = [
    {
        "id": "ryujinx",
        "name": "Ryujinx",
        "console": "Switch",
        "flatpak_id": "org.ryujinx.Ryujinx",
        "binary_name": "ryujinx",
        "extensions": [".nsp", ".xci", ".nca"],
        "rom_subdirs": ["switch"],
        "cli_args": ["--fullscreen", "{rom}"]
    },
    {
        "id": "yuzu",
        "name": "Yuzu / Suyu / Torzu",
        "console": "Switch",
        "flatpak_id": "org.yuzu_emu.yuzu",
        "alt_flatpaks": ["org.suyu_emu.suyu", "org.torzu_emu.torzu"],
        "binary_name": "yuzu",
        "extensions": [".nsp", ".xci"],
        "rom_subdirs": ["switch"],
        "cli_args": ["-f", "-g", "{rom}"]
    },
    {
        "id": "pcsx2",
        "name": "PCSX2",
        "console": "PS2",
        "flatpak_id": "net.pcsx2.PCSX2",
        "binary_name": "pcsx2-qt",
        "extensions": [".iso", ".chd", ".bin", ".cso", ".gz"],
        "rom_subdirs": ["ps2"],
        "cli_args": ["-fullscreen", "-batch", "{rom}"]
    },
    {
        "id": "dolphin",
        "name": "Dolphin",
        "console": "GameCube / Wii",
        "flatpak_id": "org.DolphinEmu.dolphin-emu",
        "binary_name": "dolphin-emu",
        "extensions": [".rvz", ".iso", ".gcm", ".wbfs", ".ciso"],
        "rom_subdirs": ["gc", "gamecube", "wii"],
        "cli_args": ["-b", "-e", "{rom}"]
    },
    {
        "id": "retroarch",
        "name": "RetroArch",
        "console": "Multi-System",
        "flatpak_id": "org.libretro.RetroArch",
        "binary_name": "retroarch",
        "extensions": [".sfc", ".smc", ".nes", ".gba", ".gb", ".gbc", ".md", ".gen", ".z64", ".n64", ".zip", ".7z"],
        "rom_subdirs": ["snes", "nes", "gba", "gb", "gbc", "megadrive", "genesis", "n64"],
        "cli_args": ["-f", "{rom}"]
    },
    {
        "id": "rpcs3",
        "name": "RPCS3",
        "console": "PS3",
        "flatpak_id": "net.rpcs3.RPCS3",
        "binary_name": "rpcs3",
        "extensions": [".iso", ".bin"],
        "rom_subdirs": ["ps3"],
        "cli_args": ["--no-gui", "{rom}"]
    },
    {
        "id": "duckstation",
        "name": "DuckStation",
        "console": "PS1",
        "flatpak_id": "org.duckstation.DuckStation",
        "binary_name": "duckstation-qt",
        "extensions": [".chd", ".cue", ".iso", ".bin", ".pbp"],
        "rom_subdirs": ["psx", "ps1"],
        "cli_args": ["-fullscreen", "-batch", "{rom}"]
    },
    {
        "id": "ppsspp",
        "name": "PPSSPP",
        "console": "PSP",
        "flatpak_id": "org.ppsspp.PPSSPP",
        "binary_name": "PPSSPPSDL",
        "extensions": [".iso", ".cso"],
        "rom_subdirs": ["psp"],
        "cli_args": ["--fullscreen", "{rom}"]
    },
    {
        "id": "cemu",
        "name": "Cemu",
        "console": "Wii U",
        "flatpak_id": "info.cemu.Cemu",
        "binary_name": "cemu",
        "extensions": [".wua", ".rpx", ".wud"],
        "rom_subdirs": ["wiiu"],
        "cli_args": ["-f", "-g", "{rom}"]
    },
    {
        "id": "lime3ds",
        "name": "Lime3DS / Citra",
        "console": "3DS",
        "flatpak_id": "io.github.lime3ds.Lime3DS",
        "alt_flatpaks": ["org.citra_emu.citra"],
        "binary_name": "lime3ds",
        "extensions": [".3ds", ".cia", ".cxi", ".app"],
        "rom_subdirs": ["3ds", "n3ds"],
        "cli_args": ["{rom}"]
    }
]

def load_config():
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "custom_rom_dirs": [],
        "custom_emulators": {}
    }

def save_config(cfg):
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
    except Exception as e:
        print(f"[Error saving config]: {e}")

def get_installed_flatpaks():
    """Detecta todos los Flatpaks instalados en el sistema"""
    flatpaks = set()
    try:
        res = subprocess.run(["flatpak", "list", "--app", "--columns=application"],
                             capture_output=True, text=True, check=False)
        if res.returncode == 0:
            for line in res.stdout.splitlines():
                clean = line.strip()
                if clean:
                    flatpaks.add(clean)
    except FileNotFoundError:
        pass
    return flatpaks

def detect_emulators():
    """Encuentra qué emuladores están listos para usarse (Flatpaks, binarios o AppImages)"""
    installed_flatpaks = get_installed_flatpaks()
    home = Path.home()
    appimage_dirs = [home / "Applications", home / "Emulation" / "tools"]
    detected = []

    for prof in EMULATOR_PROFILES:
        target_flatpak = None
        # 1. Comprobar Flatpak principal
        if prof.get("flatpak_id") and prof["flatpak_id"] in installed_flatpaks:
            target_flatpak = prof["flatpak_id"]
        # Alternativas (como Suyu o Citra)
        elif prof.get("alt_flatpaks"):
            for alt in prof["alt_flatpaks"]:
                if alt in installed_flatpaks:
                    target_flatpak = alt
                    break

        if target_flatpak:
            detected.append({
                "id": prof["id"],
                "name": prof["name"],
                "console": prof["console"],
                "type": "flatpak",
                "exec": target_flatpak,
                "command": f"flatpak run {target_flatpak}",
                "extensions": prof["extensions"],
                "subdirs": prof["rom_subdirs"],
                "cli_args": prof["cli_args"]
            })
            continue

        # 2. Comprobar binario en PATH
        binary_path = shutil.which(prof["binary_name"])
        if binary_path:
            detected.append({
                "id": prof["id"],
                "name": prof["name"],
                "console": prof["console"],
                "type": "binary",
                "exec": binary_path,
                "command": binary_path,
                "extensions": prof["extensions"],
                "subdirs": prof["rom_subdirs"],
                "cli_args": prof["cli_args"]
            })
            continue

        # 3. Comprobar AppImage
        for ad in appimage_dirs:
            if ad.exists():
                appimg = ad / f"{prof['id']}.AppImage"
                if appimg.exists() and os.access(appimg, os.X_OK):
                    detected.append({
                        "id": prof["id"],
                        "name": prof["name"],
                        "console": prof["console"],
                        "type": "appimage",
                        "exec": str(appimg),
                        "command": str(appimg),
                        "extensions": prof["extensions"],
                        "subdirs": prof["rom_subdirs"],
                        "cli_args": prof["cli_args"]
                    })
                    break

    return detected

def find_rom_directories():
    """Busca directorios de ROMs en EmuDeck, RetroDeck, SSD y MicroSD de Steam Deck"""
    home = Path.home()
    candidates = [
        home / "Emulation" / "roms",
        home / "RetroDeck" / "roms",
        home / "roms",
        home / "Games" / "roms",
        home / "MisJuegos"
    ]

    # Añadir rutas de MicroSD (montadas comúnmente en /run/media/)
    for sd in glob.glob("/run/media/*/*/Emulation/roms"):
        candidates.append(Path(sd))
    for sd in glob.glob("/run/media/*/Emulation/roms"):
        candidates.append(Path(sd))

    cfg = load_config()
    for custom in cfg.get("custom_rom_dirs", []):
        candidates.append(Path(custom))

    existing = []
    seen = set()
    for c in candidates:
        try:
            res = c.resolve()
            if res.exists() and res.is_dir() and str(res) not in seen:
                seen.add(str(res))
                existing.append(res)
        except Exception:
            pass
    return existing

def scan_games_and_roms():
    """Escanea todas las ROMs disponibles y puertos locales"""
    emulators = detect_emulators()
    rom_dirs = find_rom_directories()
    games = []
    seen_files = set()

    # Mapeo de subdirectorios a emulador preferido
    subdir_map = {}
    for emu in emulators:
        for s in emu["subdirs"]:
            if s not in subdir_map:
                subdir_map[s] = emu

    for base_dir in rom_dirs:
        for root, dirs, files in os.walk(base_dir):
            root_path = Path(root)
            current_subdir = root_path.name.lower()

            # Identificar emulador asociado al subdirectorio o a la extensión
            preferred_emu = subdir_map.get(current_subdir)

            for f in files:
                ext = Path(f).suffix.lower()
                stem = Path(f).stem
                full_path = root_path / f

                if str(full_path) in seen_files:
                    continue

                # Evitar archivos basura de macOS o temporales
                if f.startswith(".") or f.endswith(".tmp") or f.endswith(".part"):
                    continue

                assigned_emu = preferred_emu
                if not assigned_emu:
                    # Buscar por extensión compatible
                    for emu in emulators:
                        if ext in emu["extensions"]:
                            assigned_emu = emu
                            break

                if assigned_emu and ext in assigned_emu["extensions"]:
                    seen_files.add(str(full_path))

                    # Buscar carátula adyacente (cover.jpg, cover.png o stem.jpg/png)
                    cover_candidates = [
                        root_path / "covers" / f"{stem}.jpg",
                        root_path / "covers" / f"{stem}.png",
                        root_path / f"{stem}.jpg",
                        root_path / f"{stem}.png",
                        root_path / "cover.jpg",
                        root_path / "cover.png"
                    ]
                    cover_url = None
                    for cc in cover_candidates:
                        if cc.exists():
                            cover_url = f"/api/file?path={urllib.parse.quote(str(cc))}"
                            break

                    games.append({
                        "id": f"{assigned_emu['id']}_{stem}".replace(" ", "_"),
                        "folder": stem,
                        "title": stem.replace("_", " ").title(),
                        "console": assigned_emu["console"],
                        "developer": assigned_emu["name"],
                        "description": f"ROM {ext.upper()} ejecutada directamente vía {assigned_emu['name']}.",
                        "coverUrl": cover_url,
                        "path": str(full_path),
                        "exe": f,
                        "exeExists": True,
                        "lastPlayed": "Reciente",
                        "isRom": True,
                        "emulator": assigned_emu
                    })

    # Si hay MisJuegos nativos también incluirlos
    local_mis_juegos = SCRIPT_DIR / "MisJuegos"
    if local_mis_juegos.exists():
        for entry in os.scandir(local_mis_juegos):
            if entry.is_dir():
                title = entry.name
                exe = "game.exe"
                info_path = Path(entry.path) / "info.json"
                if info_path.exists():
                    try:
                        with open(info_path, "r", encoding="utf-8") as inf:
                            data = json.load(inf)
                            title = data.get("title", title)
                            exe = data.get("exe", exe)
                    except Exception:
                        pass
                games.append({
                    "id": entry.name,
                    "folder": entry.name,
                    "title": title,
                    "console": "PC Port",
                    "developer": "StandAlone Port",
                    "description": "Port de PC ejecutable nativo en Bazzite/Proton.",
                    "coverUrl": f"/api/games/{urllib.parse.quote(entry.name)}/cover",
                    "path": entry.path,
                    "exe": exe,
                    "exeExists": True,
                    "lastPlayed": "Reciente",
                    "isRom": False
                })

    return games, emulators, [str(r) for r in rom_dirs]

def launch_game_cli(game_data):
    """
    Construye el comando CLI y lanza el emulador en pantalla completa directa,
    suspendiendo el consumo de la interfaz durante el juego.
    """
    rom_path = game_data.get("path")
    emulator = game_data.get("emulator")

    if not rom_path or not os.path.exists(rom_path):
        return {
            "success": False,
            "message": f"El archivo del juego no existe en la ruta: {rom_path}"
        }

    cmd_args = []
    if emulator:
        emu_type = emulator.get("type", "flatpak")
        raw_args = emulator.get("cli_args", ["{rom}"])
        formatted_args = [a.replace("{rom}", rom_path) for a in raw_args]

        if emu_type == "flatpak":
            cmd_args = ["flatpak", "run", emulator["exec"]] + formatted_args
        else:
            cmd_args = [emulator["exec"]] + formatted_args
    else:
        # Fallback genérico para ejecutables o scripts
        if rom_path.endswith(".sh") or os.access(rom_path, os.X_OK):
            cmd_args = [rom_path]
        else:
            cmd_args = ["xdg-open", rom_path]

    cmd_str = " ".join(shlex.quote(c) for c in cmd_args)
    print(f"\n[Bazzite Launcher] >>> EJECUTANDO: {cmd_str}\n")

    try:
        # Lanzamiento directo como subproceso.
        # Espera bloqueante limpia: durante la ejecución, el hilo de API duerme
        # reduciendo el uso de CPU del launcher a prácticamente 0.0%.
        proc = subprocess.Popen(cmd_args)
        proc.wait()

        return {
            "success": True,
            "command": cmd_str,
            "returncode": proc.returncode,
            "message": f"Juego finalizado con código de salida {proc.returncode}."
        }
    except Exception as e:
        return {
            "success": False,
            "command": cmd_str,
            "message": f"Error ejecutando el emulador: {str(e)}"
        }

class LauncherHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Servir archivos estáticos desde dist/ si existe, o desde la raíz
        serve_dir = str(DIST_DIR) if DIST_DIR.exists() else str(SCRIPT_DIR)
        super().__init__(*args, directory=serve_dir, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # 1. API: Listar juegos y emuladores detectados
        if path == "/api/games":
            games, emus, rom_dirs = scan_games_and_roms()
            self.send_json({
                "success": True,
                "games": games,
                "emulators": emus,
                "romDirs": rom_dirs,
                "platform": "Bazzite OS / Steam Deck",
                "gamesDir": rom_dirs[0] if rom_dirs else str(SCRIPT_DIR / "MisJuegos")
            })
            return

        # 2. API: Listar solo emuladores
        if path == "/api/emulators":
            emus = detect_emulators()
            self.send_json({
                "success": True,
                "emulators": emus,
                "count": len(emus)
            })
            return

        # 3. Servir imágenes locales / carátulas seguras
        if path == "/api/file":
            file_param = query.get("path", [None])[0]
            if file_param and os.path.exists(file_param):
                ext = Path(file_param).suffix.lower()
                mime = "image/jpeg" if ext in [".jpg", ".jpeg"] else "image/png"
                try:
                    with open(file_param, "rb") as img:
                        data = img.read()
                    self.send_response(200)
                    self.send_header("Content-Type", mime)
                    self.send_header("Content-Length", str(len(data)))
                    self.end_headers()
                    self.wfile.write(data)
                    return
                except Exception:
                    pass
            self.send_error(404, "File not found")
            return

        # Si no coincide con API, servir estáticos normales (HTML, JS, CSS)
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)
        body = {}
        if post_data:
            try:
                body = json.loads(post_data.decode("utf-8"))
            except Exception:
                pass

        # Lanzar juego
        if path == "/api/games/launch":
            res = launch_game_cli(body)
            self.send_json(res)
            return

        # Rescanear
        if path == "/api/games/rescan":
            games, emus, _ = scan_games_and_roms()
            self.send_json({
                "success": True,
                "gamesCount": len(games),
                "emulatorsCount": len(emus)
            })
            return

        self.send_error(404, "Endpoint not found")

    def send_json(self, data, code=200):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

def main():
    print("=" * 65)
    print("  BAZZITE OS & STEAM DECK NATIVE GAME LAUNCHER")
    print("=" * 65)
    print(f"[*] Directorio base: {SCRIPT_DIR}")
    print("[*] Detectando emuladores Flatpak instalados...")
    emus = detect_emulators()
    for e in emus:
        print(f"    ✓ {e['name']} ({e['type'].upper()}): {e['exec']}")
    if not emus:
        print("    ! No se encontraron emuladores Flatpak aún.")
        print("      Instala Ryujinx, PCSX2 o Dolphin desde Discover o EmuDeck.")

    print(f"\n[*] Servidor local iniciando en: http://127.0.0.1:{PORT}")
    server = HTTPServer(("127.0.0.1", PORT), LauncherHandler)

    # Abrir navegador automáticamente si está en modo gráfico
    def open_browser():
        import time
        time.sleep(0.5)
        url = f"http://127.0.0.1:{PORT}"
        # Comprobar navegadores de Steam Deck / Bazzite
        for browser in ["google-chrome", "chromium", "firefox", "xdg-open"]:
            if shutil.which(browser):
                try:
                    subprocess.Popen([browser, "--kiosk", url] if "chrom" in browser else [browser, url])
                    break
                except Exception:
                    pass

    import threading
    threading.Thread(target=open_browser, daemon=True).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[!] Servidor detenido por el usuario.")

if __name__ == "__main__":
    main()
