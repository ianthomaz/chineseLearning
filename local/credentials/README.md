# Credenciais — learnchinese.today

OAuth GCP **chinese-learnin** · doc: [docs/05_autenticacao.md](../../docs/05_autenticacao.md)

```bash
node scripts/sync-env-from-credentials.mjs
```

| Ficheiro | Git |
|----------|-----|
| `*.example.json`, `tasks.env.example` | sim |
| `credentials.json`, `google-oauth-client*.json`, `generated/*`, `tasks.env`, `*.env` | **não** |

Tasks (quadro `chineseLearning`): `tasks.env` com `TASKS_API_TOKEN` — ver
[`tasks/README.md`](../../tasks/README.md).

GCP Console: origins `http://127.0.0.1:34827`, `:34902` + redirects `/api/auth/callback/google` — ver [docs/03_operacao_e_deploy.md](../../docs/03_operacao_e_deploy.md).

Alipay: o sync lê a **raiz** de `_credentials/alipay/learnchinese.json` (app web; fora deste repo) → `ALIPAY_*` do site. Se `mobile_app.pid` (`2088…`) estiver set, também escreve `ALIPAY_MOBILE_*` para o login iOS. Ver [docs/05_autenticacao.md](../../docs/05_autenticacao.md) § Alipay.
