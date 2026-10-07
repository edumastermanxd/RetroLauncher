#!/usr/bin/env bash
# ==============================================================================
# Script de Instalación para Steam Deck & Bazzite OS
# ==============================================================================
# Crea el acceso directo .desktop para el lanzador de aplicaciones de KDE y Steam.
# ==============================================================================

set -e

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
TARGET_DIR="$HOME/Applications/BazziteSwitchLauncher"
APPLICATIONS_DIR="$HOME/.local/share/applications"

echo "=========================================================="
echo "  Instalando Bazzite Switch Launcher en Steam Deck..."
echo "=========================================================="

mkdir -p "$TARGET_DIR"
mkdir -p "$APPLICATIONS_DIR"

# 1. Copiar archivos al directorio ~/Applications
echo "[*] Copiando archivos a $TARGET_DIR..."
cp -r "$SOURCE_DIR"/* "$TARGET_DIR"/
chmod +x "$TARGET_DIR/launcher.sh"
chmod +x "$TARGET_DIR/bazzite_launcher.py"

# 2. Crear archivo .desktop para Steam y el menú de aplicaciones
DESKTOP_FILE="$APPLICATIONS_DIR/bazzite-switch-launcher.desktop"
echo "[*] Creando acceso directo en $DESKTOP_FILE..."

cat <<EOF > "$DESKTOP_FILE"
[Desktop Entry]
Name=Switch Port Launcher
Comment=Frontend estilo Nintendo Switch para Bazzite OS y Steam Deck
Exec=$TARGET_DIR/launcher.sh
Icon=games-config
Terminal=false
Type=Application
Categories=Game;Emulator;
Keywords=Switch;Yuzu;Ryujinx;RetroArch;PCSX2;Dolphin;
StartupNotify=true
EOF

chmod +x "$DESKTOP_FILE"

echo ""
echo "=========================================================="
echo "  ¡Instalación completada con éxito!"
echo "=========================================================="
echo ""
echo "Cómo usarlo en tu Steam Deck / Bazzite:"
echo "1. Desde el Modo Escritorio, puedes abrirlo desde el Menú de Aplicaciones > Juegos."
echo "2. Para jugarlo en Modo Juego (Game Mode):"
echo "   - Abre Steam en el Modo Escritorio."
echo "   - Haz clic en 'Productos' > 'Añadir un producto que no es de Steam...'."
echo "   - Selecciona 'Switch Port Launcher' de la lista (o busca $TARGET_DIR/launcher.sh)."
echo "   - Regresa al Modo Juego y lánzalo con mando integrado del Steam Deck."
echo ""
