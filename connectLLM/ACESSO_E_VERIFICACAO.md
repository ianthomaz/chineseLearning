# Acesso à API LLM — URLs, token e verificação

Documento autossuficiente. A API é um serviço HTTP; estes são os dados que precisas para qualquer cliente (Next.js server-side, script, Postman).

---

## 1. O que precisas de duas coisas

1. **URL base** — sem barra no fim (ex.: `https://llm.webplace.cc` ou `http://127.0.0.1:28471`).
2. **Token** — valor secreto enviado em **cada** pedido à API (exceto nos endpoints públicos indicados abaixo).

O token **não** é o login do dashboard web. É o valor da variável de ambiente **`LLM_API_TOKEN`** no servidor onde a API corre.

---

## 2. Como obter o token

- **Quem opera o servidor da API** (administrador do Mac / Docker onde a LLM está instalada) gera ou copia o valor de `LLM_API_TOKEN` do ficheiro `.env` **dentro** da pasta `featureLLM` no deploy (ou o valor que estiver definido no `docker-compose` / ambiente do container).
- **Partilha contigo por canal seguro** (gestor de passwords, mensagem encriptada, nunca em repositório Git público).
- Se o token vazar, o administrador deve **regenerar** um novo e atualizar o `.env` + reiniciar o container da API.

Tu **nunca** commits o token no repositório chineseLearning. Usa apenas variáveis de ambiente no servidor onde corre o teu backend (ex.: Vercel env vars, ou `.env.local` no dev, listado no `.gitignore`).

---

## 3. URLs base (escolhe uma conforme a rede)

| Cenário | URL base exemplo | Notas |
|---------|------------------|--------|
| API a correr no mesmo Mac que o teu dev | `http://127.0.0.1:28471` | Docker expõe a porta 28471 no host. |
| Estás noutra máquina na mesma Tailscale | `http://100.x.x.x:28471` | Substitui pelo IPv4 tailnet do Mac da API (`tailscale ip -4` nesse Mac). |
| Acesso pela internet (HTTPS) | `https://llm.webplace.cc` | Tráfego: cliente → Cloudflare → proxy → Tailscale → Mac da API. Mesma API, mesmos paths. |

Todos os paths abaixo são **relativos** à URL base:

- Exemplo: `POST https://llm.webplace.cc/edu/chat`
- Exemplo: `GET http://127.0.0.1:28471/health`

---

## 4. Header de autenticação (obrigatório na maior parte dos endpoints)

```
Authorization: Bearer <colar-aqui-o-token-sem-aspas>
```

Exemplo em curl:

```bash
curl -s -H "Authorization: Bearer $LLM_API_TOKEN" "$LLM_API_URL/edu/vocabulary?language=zh-CN&limit=5"
```

Exemplo em JavaScript (só no servidor, nunca no browser exposto), incluindo **resposta estruturada** vs fallback:

```js
const res = await fetch(`${process.env.LLM_API_URL}/edu/chat`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.LLM_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ message: 'Olá', level: 'HSK1', language: 'zh-CN' }),
});
const data = await res.json();
if (!res.ok) {
  throw new Error(data.detail || String(res.status));
}
// Modo estruturado: toggles Pinyin / Tradução (pt, en, es) por segmento
const segments = data.reply_structured;
if (Array.isArray(segments) && segments.length > 0) {
  // Ex.: mapear segments para o teu componente de chat
  // Cada item: segments[i].hanzi, .pinyin, .translation.pt / .en / .es
} else {
  // Fallback: modelo não devolveu JSON válido — mostrar só texto
  const plain = data.reply ?? '';
}
```

Contrato completo dos campos: [CONTRATO_EDU_COMPLETO.md](CONTRATO_EDU_COMPLETO.md).

**401 Unauthorized** — token em falta, errado ou header mal formatado (falta `Bearer ` com espaço).

---

## 5. Endpoints sem token (útil para monitorização)

Estes costumam **não** exigir `Authorization` (comportamento atual da API; se no futuro protegerem atrás de proxy, ajusta o teu cliente):

- **`GET /health`** — estado da API, Ollama, Postgres, disco.
- **`GET /metrics`** — métricas estilo Prometheus (texto).

### Exemplo `GET /health`

```bash
curl -s "https://llm.webplace.cc/health"
```

Resposta típica (campos podem variar):

```json
{
  "status": "ok",
  "uptime_seconds": 1234,
  "checks": {
    "ollama": { "status": "ok", "models": ["qwen2.5:14b-instruct", "..."] },
    "postgres": { "status": "ok" },
    "disk": { "status": "ok", "free_gb": 100.0 }
  }
}
```

- `status` `degraded` ou checks não `ok` — API pode responder mas LLM ou base indisponíveis; evita mostrar erros ao utilizador final até estar estável.

---

## 6. Dashboard web (opcional, não é o token da API)

A mesma instância pode expor **`GET /dashboard`** — login com **utilizador e palavra-passe** definidos no servidor (`DASHBOARD_USER` / `DASHBOARD_PASSWORD`), **não** com `LLM_API_TOKEN`.

Serve para operação humana (jobs, projetos). A integração programática do chineseLearning usa o **Bearer token** nas rotas `/edu/*`, `/projects`, etc.

---

## 7. Variáveis de ambiente recomendadas (projeto chineseLearning)

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `LLM_API_URL` | sim | URL base, sem `/` final. |
| `LLM_API_TOKEN` | sim | Token Bearer. **Só em código server-side** (Route Handlers, Server Actions, API routes). |

**Nunca** expor `LLM_API_TOKEN` em `NEXT_PUBLIC_*` nem em páginas client-side.

---

## 8. HTTPS e CORS

- Em produção costuma usar-se **HTTPS** (`https://llm.webplace.cc`).
- Se chamares a API **diretamente a partir do browser** (origem `https://teu-dominio.com`), o servidor da API tem de permitir CORS para essa origem — muitas integrações evitam isso e chamam a LLM **só a partir do teu backend** (mesmo domínio que o site), onde CORS não se aplica.

Recomendação: **proxy no teu servidor** (ex.: route `/api/llm/...` no Next que encaminha para a LLM com o token).

---

## 9. Timeouts e disponibilidade

- Chamadas **`/edu/*`** são **síncronas**: o servidor espera o Ollama. Prevê **timeouts** generosos no cliente (ex.: 60–120 s em modelos grandes ou CPU).
- Se a API estiver em manutenção ou o Mac desligado, recebes erro de rede ou 502/503 conforme o proxy — trata com mensagem amigável ao utilizador.

---

## 10. Checklist rápido antes de integrar

[ ] Tens `LLM_API_URL` e `LLM_API_TOKEN` por ambiente seguro.  
[ ] `curl "$LLM_API_URL/health"` responde JSON com `status`.  
[ ] `curl -H "Authorization: Bearer …" "$LLM_API_URL/edu/vocabulary?language=zh-CN&limit=1"` responde **200** (ou lista vazia se ainda não houver dados), não **401**.  

Depois segue [CONTRATO_EDU_COMPLETO.md](CONTRATO_EDU_COMPLETO.md).

---

## 11. Testes rápidos `POST /edu/chat` (mesma máquina que o Ollama)

Com `LLM_API_URL` e `LLM_API_TOKEN` carregados no shell:

1. **Saudação** — resposta com `reply_structured` não vazio; cada segmento com `hanzi`, `pinyin` e `translation.pt` preenchidos.

```bash
curl -s -X POST "$LLM_API_URL/edu/chat" \
  -H "Authorization: Bearer $LLM_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"message":"Diz olá em chinês bem simples.","history":[],"level":"HSK1","language":"zh-CN"}' | jq '.reply_structured[0]'
```

2. **Tradução** — mesmo critério de schema.

```bash
curl -s -X POST "$LLM_API_URL/edu/chat" \
  -H "Authorization: Bearer $LLM_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"message":"Como se diz obrigado em chinês?","history":[],"level":"HSK1","language":"zh-CN"}' | jq '.reply_structured | length'
```

3. **Histórico com `content` (formato Next.js)** — o modelo aceita `text` ou `content` em cada turno.

```bash
curl -s -X POST "$LLM_API_URL/edu/chat" \
  -H "Authorization: Bearer $LLM_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"message":"Repete só o cumprimento.","history":[{"role":"user","content":"Olá"},{"role":"assistant","content":"你好！"}],"level":"HSK1","language":"zh-CN"}' | jq '.full_reply_text'
```

4. **Proxy do site** — com `npm run dev` na pasta `web/` e `web/.env.local` com token válido, o tutor em `/tutor` deve responder; se `/api/chat` devolver **500**, reinicia o dev server **depois** de criar ou alterar `.env.local` (o Next só lê o env à arranque).

Toggles de pinyin/tradução no tutor dependem de `reply_structured`; o backend garante pelo menos um segmento válido em **HTTP 200** (modelo, retry ou fallback fixo).
