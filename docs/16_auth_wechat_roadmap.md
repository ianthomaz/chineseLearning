# Login WeChat — pesquisa e checklist

Estado: **pesquisa apenas, set 2026**. Nada implementado, nada decidido.
Este documento existe para que a decisão seja tomada com os custos à vista.

Auth actual: [09_google_auth_jogo.md](09_google_auth_jogo.md).

---

## 1. Resumo para quem tem pressa

Tecnicamente é pequeno: o Auth.js **já traz** um provider WeChat, por isso do lado
do código são poucas dezenas de linhas. O bloqueio é **administrativo**: um
"网站应用" (website app) na WeChat Open Platform exige conta de programador
verificada e um domínio que passe na revisão da Tencent. O `basePath`
`/aulaChines` também obriga a cuidado com o `redirect_uri`.

**Recomendação:** não começar pelo código. Fazer primeiro os passos 1–3 da
checklist (§6); se a conta de programador não passar, o resto é irrelevante.

## 2. Qual dos WeChat?

A Tencent chama "login WeChat" a coisas diferentes. Só uma serve um site como este.

| Tipo | O que é | Serve-nos? |
|------|---------|-----------|
| **网站应用 / Website App** | QR code apresentado num site, digitalizado pelo telemóvel. Scope `snsapi_login` | **Sim** — é este |
| 公众号 / Official Account | Autorização de página *dentro* do browser do WeChat. Scopes `snsapi_base` / `snsapi_userinfo` | Só se o site for aberto dentro do WeChat |
| 小程序 / Mini Program | Aplicação própria, corre dentro do WeChat, não é uma página web | Não — seria reescrever o site |
| 移动应用 / Mobile App | SDK nativo iOS/Android | Não |

O resto deste documento é sobre **Website App**.

## 3. O fluxo (OAuth2 authorization code)

1. O site envia o utilizador para
   `https://open.weixin.qq.com/connect/qrconnect`
   com `appid`, `redirect_uri` (URL-encoded), `response_type=code`,
   `scope=snsapi_login`, `state` (CSRF) — e mostra um QR code.
2. O utilizador digitaliza e autoriza no telemóvel.
3. A Tencent redirecciona para `redirect_uri?code=…&state=…`.
   O `code` dura **10 minutos** e é de uso único.
4. O servidor troca o code em
   `https://api.weixin.qq.com/sns/oauth2/access_token`
   (`appid`, `secret`, `code`, `grant_type=authorization_code`).
   O `access_token` dura **2 horas**; o `refresh_token`, **30 dias**.
5. Perfil em `https://api.weixin.qq.com/sns/userinfo`.

Identificadores devolvidos:

| Campo | Significado |
|-------|-------------|
| `openid` | Id do utilizador **nesta app**. Muda entre apps da mesma entidade |
| `unionid` | Id do utilizador **na entidade** (só se a app estiver ligada a uma Open Platform account) |
| `nickname`, `headimgurl` | Nome e avatar |
| `sex`, `city`, `province`, `country`, `privilege` | Restantes campos do perfil |

**Consequência para o nosso schema:** hoje `users.id` é o `sub` do Google.
Se houver um segundo provedor, `id` deixa de poder ser "o sub" — é preciso ou uma
chave composta `(provider, subject)` ou uma coluna `provider` + índice único.
Ver §5.

## 4. O que muda no código

O Auth.js v5 tem provider WeChat de raiz — **não é preciso custom provider**:

```ts
// web/src/server/auth/config.ts
import WeChat from "next-auth/providers/wechat";

WeChat({
  clientId: process.env.AUTH_WECHAT_APP_ID,
  clientSecret: process.env.AUTH_WECHAT_APP_SECRET,
  platformType: "WebsiteApp", // não "OfficialAccount"
})
```

Pontos de atenção no nosso setup:

- **`basePath`.** O callback do Auth.js é `/api/auth/callback/wechat`, mas a app é
  servida sob `/aulaChines`. O URL público é
  `https://webplace.cc/aulaChines/api/auth/callback/wechat` — o mesmo padrão já
  resolvido para o Google em `web/src/server/auth/base-path.ts`.
- **Domínio autorizado.** O `redirect_uri` tem de estar no domínio registado na
  revisão da app (Security Configuration → web security domain). Não há
  equivalente ao `127.0.0.1` que o Google aceita, por isso **não há como testar em
  localhost**: é preciso um subdomínio real, ou um túnel com um domínio aceite.
- **Callback `signIn`.** `upsertUser` recebe hoje `{ id, email, name, image }`.
  O WeChat **não devolve email**. `users.email` teria de passar a ser nulo de
  facto — e `isAdminEmail`, que é a base de todo o gate de curador, deixa de
  funcionar para contas WeChat. Não é problema (o curador usa Google), mas tem
  de ser explícito.
- **Rede.** `api.weixin.qq.com` tem de estar acessível a partir do servidor de
  produção.

## 5. Decisão de schema (a tomar antes de escrever código)

Opções, por ordem de esforço:

1. **Prefixo no `id`** — `wx:<unionid>`, `google:<sub>`. Uma linha de código, zero
   migração, mas as linhas Google existentes ficam sem prefixo (inconsistente) ou
   é preciso migrar.
2. **Coluna `provider` + `subject`**, único em `(provider, subject)`, com `id`
   sintético. Correcto, exige migração da tabela `users` e da view `players`.
3. **Tabela `accounts`** ao estilo dos adapters do Auth.js — permite a mesma pessoa
   ligar Google e WeChat. É o correcto a prazo e o mais caro agora.

Seja qual for, mexe em `users` e portanto em
[11_content_db_schema.md](11_content_db_schema.md).

## 6. Checklist de bloqueios práticos

Por ordem — parar no primeiro que falhar.

- [ ] **1. Conta na WeChat Open Platform** (`open.weixin.qq.com`).
      Entidades não-pessoais têm de completar a *developer qualification
      certification* (Account Center → Developer qualification). Envolve uma
      licença comercial e uma taxa de verificação (~300 RMB, cobrada de novo se o
      nome mudar). **Confirmar** se uma pessoa singular pode sequer criar um
      网站应用 — a documentação oficial não o diz explicitamente e os relatos
      apontam para "não". É este ponto que decide tudo o resto.
- [ ] **2. Domínio.** A app tem de declarar o domínio e passar revisão.
      Para serviços alojados na China há ainda **ICP 备案** do domínio.
      `webplace.cc` está fora da China — verificar se a Tencent aceita um domínio
      sem ICP para um website app apenas de login (é o ponto mais incerto).
- [ ] **3. Submeter a app e esperar aprovação** (dias, não horas), depois pedir
      explicitamente a permissão de **微信登录 / WeChat Login**.
- [ ] **4.** `AppID` + `AppSecret` → `local/credentials/` (gitignored, como o
      Google) e `scripts/sync-env-from-credentials.mjs`.
- [ ] **5.** Decidir o schema (§5) e actualizar `docs/11_content_db_schema.md`.
- [ ] **6.** Adicionar o provider (§4) e o botão no `AuthPanel`.
- [ ] **7.** Testar num domínio real — localhost não serve (§4).
- [ ] **8.** Rever a política de dados: o perfil WeChat traz cidade/província/sexo
      que não queremos nem precisamos. Guardar só `unionid`/`openid`, nome e avatar.

## 7. Vale a pena?

A favor: os alunos estão a aprender chinês e muitos já têm WeChat; para quem está
na China o Google é inacessível sem VPN — hoje essas pessoas simplesmente não
conseguem entrar.

Contra: o custo é quase todo administrativo e recorrente (verificação da entidade),
e o único benefício actual do login é **guardar um apelido**. Enquanto a Fase 2
(pontuação e histórico, ver [09](09_google_auth_jogo.md) §3) não existir, um
segundo provedor dá acesso a muito pouco.

**Sugestão:** reavaliar depois da Fase 2. Se entretanto houver alunos na China a
pedir, fazer só o passo 1 da checklist para saber se é sequer possível.

---

## Fontes

- [Weixin Login — Website App Development Guide](https://developers.weixin.qq.com/doc/oplatform/en/Website_App/WeChat_Login/Wechat_Login)
- [Website App — Preparations](https://developers.weixin.qq.com/doc/oplatform/en/Website_App/WeChat_Login/Wechat_Login.html)
- [WeChat Open Platform account management](https://developers.weixin.qq.com/doc/oplatform/en/Third-party_Platforms/2.0/product/Open_Platform_Account_Management.html)
- [Auth.js — WeChat provider](https://authjs.dev/reference/core/providers/wechat)
- [ICP License for WeChat Apps and Mini-Programs (MSA Asia)](https://msadvisory.com/icp-license-wechat-mini-programs/)
- [Registo e taxas de conta oficial (WeChat Wiki)](https://wechatwiki.com/wechat-resources/wechat-official-account-registration-fees/)

*Última revisão: set 2026 — pesquisa, não implementação.*
