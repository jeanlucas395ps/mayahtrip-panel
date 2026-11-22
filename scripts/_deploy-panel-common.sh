#!/usr/bin/env bash
# Uso interno: DEPLOY_TARGET_DIR e DEPLOY_TARGET_DOMAIN já definidos.
set -euo pipefail

PANEL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SSH_HOST="${DEPLOY_SSH_HOST:-root@72.62.138.110}"
PANEL_SRC="${DEPLOY_PANEL_SRC:-/var/www/src/mayahtrip-panel}"
API_BASE="${DEPLOY_API_BASE:-https://api-v2.mayahtrip.com}"

ssh_teste() { ssh -o StrictHostKeyChecking=accept-new "$SSH_HOST" "$@"; }
info() { printf '\n==> %s\n' "$*"; }

if [[ -z "${DEPLOY_TARGET_DIR:-}" || -z "${DEPLOY_TARGET_DOMAIN:-}" ]]; then
  echo "DEPLOY_TARGET_DIR e DEPLOY_TARGET_DOMAIN são obrigatórios" >&2
  exit 1
fi

info "1/4 Bootstrap Node + vhost SPA ($DEPLOY_TARGET_DOMAIN)"
ssh_teste "bash -s" <<BOOT
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
NODE_MAJOR="\$(node -v 2>/dev/null | sed -n 's/^v\\([0-9]*\\).*/\\1/p' || true)"
if [[ "\${NODE_MAJOR:-0}" -lt 26 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_26.x | bash -
  apt-get install -y nodejs
fi
a2enmod rewrite headers >/dev/null

SITE="$DEPLOY_TARGET_DOMAIN"
DIR="$DEPLOY_TARGET_DIR"
mkdir -p "\$DIR"
chown -R www-data:www-data "\$DIR"

cat > "/etc/apache2/sites-available/\${SITE}.conf" <<VHOST
<VirtualHost *:80>
    ServerName \${SITE}
    ServerAlias www.\${SITE}
    RewriteEngine on
    RewriteCond %{SERVER_NAME} =www.\${SITE} [OR]
    RewriteCond %{SERVER_NAME} =\${SITE}
    RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]
</VirtualHost>
VHOST

cat > "/etc/apache2/sites-available/\${SITE}-le-ssl.conf" <<VHOST
<IfModule mod_ssl.c>
<VirtualHost *:443>
    ServerName \${SITE}
    ServerAlias www.\${SITE}
    DocumentRoot \${DIR}
    <Directory \${DIR}>
        Options FollowSymLinks
        AllowOverride All
        Require all granted
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\\.html\$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    ErrorLog \\\${APACHE_LOG_DIR}/\${SITE}-error.log
    CustomLog \\\${APACHE_LOG_DIR}/\${SITE}-access.log combined
    SSLCertificateFile /etc/letsencrypt/live/\${SITE}/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/\${SITE}/privkey.pem
    Include /etc/letsencrypt/options-ssl-apache.conf
</VirtualHost>
</IfModule>
VHOST

a2ensite "\${SITE}.conf" >/dev/null
a2ensite "\${SITE}-le-ssl.conf" >/dev/null
apache2ctl configtest
systemctl reload apache2
BOOT

info "2/4 Sincronizando código"
ssh_teste "mkdir -p $PANEL_SRC"
rsync -az --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.angular' \
  "$PANEL_DIR/" "$SSH_HOST:$PANEL_SRC/"

info "3/4 Build e publicação em $DEPLOY_TARGET_DIR"
ssh_teste "bash -s" <<EOF
set -euo pipefail
cd "$PANEL_SRC"
npm ci
npm run build
SRC_BUILD="$PANEL_SRC/dist/browser"
test -d "\$SRC_BUILD"
rsync -a --delete "\$SRC_BUILD/" "$DEPLOY_TARGET_DIR/"
cat > "$DEPLOY_TARGET_DIR/config.js" <<CFG
window.__MAYAHTRIP_API_BASE__ = '$API_BASE';
CFG
chown -R www-data:www-data "$DEPLOY_TARGET_DIR"
EOF

info "4/4 Checagem"
sleep 1
curl -sS -o /dev/null -w "https_home=%{http_code}\n" "https://$DEPLOY_TARGET_DOMAIN/"
curl -sS "https://$DEPLOY_TARGET_DOMAIN/config.js"
echo
info "Deploy OK → https://$DEPLOY_TARGET_DOMAIN"
