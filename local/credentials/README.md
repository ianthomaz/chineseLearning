# Credenciais — OAuth ChineseSite

Cliente GCP **ChineseSite** · doc: [docs/09_google_auth_jogo.md](../../docs/09_google_auth_jogo.md)

```bash
node scripts/sync-env-from-credentials.mjs
cat local/credentials/generated/web.auth.env.local >> web/.env.local
```

| Ficheiro | Git |
|----------|-----|
| `*.example.json` | sim |
| `credentials.json`, `google-oauth-client.json`, `generated/*` | **não** |
