# Deploy — learnchinese.today

**Site:** https://learnchinese.today/  
**Node:** `127.0.0.1:34827` (`HOSTNAME` + `PORT` em `server.env`)

## Ficheiros

| Ficheiro | Uso |
|----------|-----|
| `server.env.example` | Template — gerar com `node scripts/sync-env-from-credentials.mjs` |
| `nginx-learnchinese.today.conf` | Vhost activo (HTTP → Node) — instalado por `prepare:prod-server` |
| `nginx-learnchinese.conf.example` | Variante com blocos HTTPS (origin cert / certbot) |

**Redirect:** `learnchinese.page` → `learnchinese.today` (301 na Cloudflare + fallback nginx).

## Preparar servidor (antes do deploy)

```bash
node scripts/sync-env-from-credentials.mjs   # repo root
cd web && npm run prepare:prod-server
```

Instala nginx vhost, faz staging de `server.env.next`, testa LLM — **sem** rsync nem pm2 reload.

DNS: `learnchinese.today` → IP público itcsVM3 (Cloudflare proxied).

## Nginx (host partilhado)

HTTP activo em `nginx-learnchinese.today.conf` (TLS na Cloudflare, origin :80 → Node `127.0.0.1:34827`). **Sem legado.**

HTTPS origin (opcional, Full strict):

1. Origin cert Cloudflare → `/etc/nginx/ssl/learnchinese.{crt,key}` **ou** certbot
2. Descomentar bloco em `nginx-learnchinese.conf.example`
3. `sudo nginx -t && sudo systemctl reload nginx`

## App

```bash
./start.sh --prod --upload
```

Documentação: [docs/03_operacao_e_deploy.md](../../docs/03_operacao_e_deploy.md)
