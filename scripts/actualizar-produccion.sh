#!/bin/sh
# Actualiza https://bootcamps.espol.edu.ec con la última versión de la rama
# "produccion" (la genera el workflow .github/workflows/deploy-production.yml).
#
# Se instala en el servidor como /usr/local/bin/actualizar-landing y lo ejecuta
# el cron del usuario manager cada 5 minutos. Si no hay nada nuevo, no hace nada.
# Uso manual:  actualizar-landing          (solo si hay cambios)
#              actualizar-landing --forzar (vuelve a copiar aunque no haya cambios)

set -eu

REPO="https://github.com/Coding-Bootcamps-Espol/Landing-Coding-Bootcamps-V1.git"
SRC="$HOME/landing-produccion"        # copia local de la rama produccion
DEST="/var/www/landing"               # carpeta que sirve Apache
ESTADO="$HOME/.landing-publicado"     # último commit publicado

# Evita dos ejecuciones a la vez
exec 9>"/tmp/actualizar-landing.lock"
flock -n 9 || exit 0

if [ ! -d "$SRC/.git" ]; then
  git clone --quiet --depth 1 --branch produccion "$REPO" "$SRC"
fi

cd "$SRC"
git fetch --quiet --depth 1 origin produccion
NUEVO=$(git rev-parse origin/produccion)
ANTERIOR=$(cat "$ESTADO" 2>/dev/null || true)

if [ "$NUEVO" = "$ANTERIOR" ] && [ "${1:-}" != "--forzar" ]; then
  exit 0
fi

git reset --quiet --hard origin/produccion

# No publicar nunca un build incompleto
for f in index.html .htaccess 404.html; do
  [ -f "$f" ] || { echo "$(date -Is) ERROR: falta $f en la rama produccion, no se publica"; exit 1; }
done

# --delete quita archivos que ya no existen en la web, salvo los de verificación
# de Google (Search Console), que se suben a mano.
rsync -rltp --delete --delay-updates --chmod=D755,F644 \
  --exclude ".git" --exclude "google*.html" \
  ./ "$DEST"/

echo "$NUEVO" > "$ESTADO"
echo "$(date -Is) publicado: $(git log -1 --format=%s)"
