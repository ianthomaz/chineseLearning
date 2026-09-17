#!/usr/bin/env bash
set -euo pipefail
# Prepare itcsVM3 to receive learnchinese.today BEFORE the first deploy upload.
# Does NOT rsync app code, does NOT pm2 reload (old aulachines app keeps running).
#
#   cd web && npm run prepare:prod-server
#
# After DNS points to the VM and you deploy:
#   mv server.env.next → server.env && pm2 reload chinese-learning-app --update-env

REMOTE="${DEPLOY_PROD_HOST:-itcsVM3}"
REMOTE_DIR="${DEPLOY_PROD_DIR:-/home/opc/projetos/chineseLearning-app}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$WEB_DIR/.." && pwd)"
CRED="$REPO_ROOT/local/credentials/credentials.json"
NGINX_SRC="$WEB_DIR/deploy/nginx-learnchinese.today.conf"
NGINX_SSL_DEFAULT="$WEB_DIR/deploy/nginx-itcs-ssl-default.conf"
SERVER_ENV="$WEB_DIR/deploy/server.env"
SSL_DIR="$REPO_ROOT/local/credentials/generated/ssl"
SSL_CRT="$SSL_DIR/learnchinese.crt"
SSL_KEY="$SSL_DIR/learnchinese.key"

if [[ -f "$CRED" ]] && command -v node >/dev/null 2>&1; then
  REMOTE="${DEPLOY_PROD_HOST:-$(node -e "const d=require('$CRED').deployment||{};process.stdout.write(d.prod_ssh_host||'itcsVM3');")}"
  REMOTE_DIR="${DEPLOY_PROD_DIR:-$(node -e "const d=require('$CRED').deployment||{};process.stdout.write(d.prod_remote_dir||'/home/opc/projetos/chineseLearning-app');")}"
fi

if [[ ! -f "$NGINX_SRC" ]]; then
  echo "Missing $NGINX_SRC" >&2
  exit 1
fi

if [[ ! -f "$SERVER_ENV" ]]; then
  echo "Missing $SERVER_ENV — run: node scripts/sync-env-from-credentials.mjs" >&2
  exit 1
fi

echo "→ Preparar servidor ${REMOTE} (sem deploy de código)"
echo "  App dir: ${REMOTE_DIR}"
echo ""

echo "→ SSH handshake…"
ssh -o BatchMode=yes -o ConnectTimeout=25 "$REMOTE" 'echo "  OK — $(hostname)"'
echo ""

echo "→ Remover legado (aulachines nginx/ssl, se existir)…"
ssh "$REMOTE" 'sudo rm -f /etc/nginx/conf.d/aulachines-webplace.conf /etc/nginx/ssl/aulachines.crt /etc/nginx/ssl/aulachines.key'
echo "  OK"
echo ""

echo "→ Instalar nginx vhost learnchinese.today…"
scp -q "$NGINX_SRC" "${REMOTE}:/tmp/learnchinese.today.conf"
if [[ -f "$SSL_CRT" && -f "$SSL_KEY" ]]; then
  scp -q "$SSL_CRT" "$SSL_KEY" "${REMOTE}:/tmp/"
  ssh "$REMOTE" 'sudo cp /tmp/learnchinese.crt /etc/nginx/ssl/learnchinese.crt && sudo cp /tmp/learnchinese.key /etc/nginx/ssl/learnchinese.key && sudo chmod 644 /etc/nginx/ssl/learnchinese.crt && sudo chmod 600 /etc/nginx/ssl/learnchinese.key && rm -f /tmp/learnchinese.crt /tmp/learnchinese.key'
  echo "  OK — origin cert → /etc/nginx/ssl/learnchinese.{crt,key}"
else
  echo "  WARN: sem $SSL_CRT — nginx :443 requer origin cert (Cloudflare Origin CA)." >&2
fi
ssh "$REMOTE" 'sudo cp /tmp/learnchinese.today.conf /etc/nginx/conf.d/learnchinese.today.conf && rm -f /tmp/learnchinese.today.conf && sudo rm -f /etc/nginx/conf.d/learnchinese.com.conf /etc/nginx/conf.d/learchinese.com.conf && sudo mkdir -p /etc/nginx/ssl && sudo chmod 755 /etc/nginx/ssl'
echo "  OK — /etc/nginx/conf.d/learnchinese.today.conf"
if [[ -f "$NGINX_SSL_DEFAULT" ]]; then
  scp -q "$NGINX_SSL_DEFAULT" "${REMOTE}:/tmp/itcs-ssl-default.conf"
  ssh "$REMOTE" 'sudo cp /tmp/itcs-ssl-default.conf /etc/nginx/conf.d/00-itcs-ssl-default.conf && rm -f /tmp/itcs-ssl-default.conf'
  echo "  OK — /etc/nginx/conf.d/00-itcs-ssl-default.conf (não mexe em itcs-default.conf)"
fi
echo ""

echo "→ Parar app legado (porta 34827 livre para o deploy)…"
ssh "$REMOTE" bash -s <<'REMOTE_STOP'
set -euo pipefail
if command -v pm2 >/dev/null 2>&1; then
  pm2 stop chinese-learning-app 2>/dev/null || true
  pm2 save 2>/dev/null || true
fi
REMOTE_STOP
echo "  OK — PM2 stopped (deploy activa depois)"
echo ""

echo "→ Staging server.env.next (não activa — pm2 mantém config actual)…"
scp -q "$SERVER_ENV" "${REMOTE}:${REMOTE_DIR}/server.env.next"
echo "  OK — ${REMOTE_DIR}/server.env.next"
echo ""

echo "→ nginx -t && reload…"
ssh "$REMOTE" 'sudo nginx -t && sudo systemctl reload nginx'
echo "  OK"
echo ""

echo "→ PM2 startup (persiste após reboot)…"
ssh "$REMOTE" bash -s "$REMOTE_DIR" <<'REMOTE_PM2'
set -euo pipefail
DIR="$1"
cd "$DIR"
if command -v pm2 >/dev/null 2>&1; then
  pm2 save 2>/dev/null || true
  if ! systemctl is-enabled "pm2-$(whoami)" >/dev/null 2>&1; then
    env PATH="$PATH" pm2 startup systemd -u "$(whoami)" --hp "$HOME" 2>/dev/null | tail -1 | bash || true
  fi
  pm2 list
else
  echo "  WARN: pm2 não encontrado"
fi
REMOTE_PM2
echo ""

echo "→ Teste LLM a partir do servidor (server.env.next)…"
REMOTE_TMP="$(ssh "$REMOTE" mktemp /tmp/chinese-learning-handshake.XXXXXX)"
scp -q "$SERVER_ENV" "${REMOTE}:${REMOTE_TMP}"
ssh "$REMOTE" bash -s "$REMOTE_TMP" <<'REMOTE_LLM'
set -euo pipefail
set -a
# shellcheck source=/dev/null
source "$1"
set +a
rm -f "$1"
: "${LLM_API_URL:?Missing LLM_API_URL}"
: "${LLM_API_TOKEN:?Missing LLM_API_TOKEN}"
export LLM_API_URL="${LLM_API_URL%/}"
if curl -sf -m 25 -H "Authorization: Bearer $LLM_API_TOKEN" "$LLM_API_URL/health" >/dev/null; then
  echo "  LLM health OK ($LLM_API_URL)"
else
  echo "  WARN: LLM health falhou — verifica token/rede antes do deploy"
fi
REMOTE_LLM
echo ""

VM_IP="$(ssh "$REMOTE" 'curl -s --max-time 5 ifconfig.me 2>/dev/null || curl -s --max-time 5 icanhazip.com')"
echo "════════════════════════════════════════════════════════════"
echo "  Servidor pronto para receber deploy (infra)"
echo ""
echo "  VM IP público: ${VM_IP}"
echo "  DNS learnchinese.today → este IP (Cloudflare proxied)"
echo "  learnchinese.page → 301 learnchinese.today (CF + nginx fallback)"
echo "  Nginx: learnchinese.today :443 (CF origin cert) → 127.0.0.1:34827"
echo "  server.env.next staged — activar no deploy:"
echo "    ssh ${REMOTE} 'cd ${REMOTE_DIR} && cp server.env.next server.env && pm2 reload chinese-learning-app --update-env'"
echo ""
echo "  SSL: Cloudflare Full (strict) — cert local em local/credentials/generated/ssl/"
echo "  Ver web/deploy/README.md"
echo "════════════════════════════════════════════════════════════"
