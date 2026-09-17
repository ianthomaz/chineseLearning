# Credenciais — learnchinese.today

OAuth GCP **chinese-learnin** · doc: [docs/05_autenticacao.md](../../docs/05_autenticacao.md)

```bash
node scripts/sync-env-from-credentials.mjs
```

| Ficheiro | Git |
|----------|-----|
| `*.example.json` | sim |
| `credentials.json`, `google-oauth-client*.json`, `generated/*` | **não** |

GCP Console: origins `http://127.0.0.1:34827`, `:34902` + redirects `/api/auth/callback/google` — ver [docs/03_operacao_e_deploy.md](../../docs/03_operacao_e_deploy.md).
