#!/usr/bin/env bash
# ==============================================================================
# Bazzite OS & Steam Deck Launcher Script
# ==============================================================================
# Diseñado para ejecutarse tanto en Modo Escritorio (KDE Plasma)
# como en Modo Juego (Steam Game Mode / Gamescope)
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

# Asegurar permisos de ejecución en Python script
chmod +x "$DIR/bazzite_launcher.py"

echo "Iniciando Bazzite Switch Launcher..."

# Ejecutar el backend nativo de Python 3
exec python3 "$DIR/bazzite_launcher.py" "$@"
