# Sugestões simples para alinhar site + LLM (chineseLearning)

Objetivo: garantir respostas **sempre úteis para aprendizado básico/intermediário**, com **hanzi + pinyin + tradução por frase**, e facilitar integração com o site principal.

---

## 1) Contrato de resposta (sempre estruturado)

Hoje o fallback em texto livre quebra o toggle de pinyin/tradução. A recomendação é tratar isso como regra forte:

- A LLM deve responder **somente JSON válido**.
- Cada frase deve virar 1 item em `reply_structured`.
- Cada item deve conter:
  - `hanzi`
  - `pinyin` (com tons: nǐ hǎo, não `ni3 hao3`)
  - `translation.pt`
- `translation.en` e `translation.es` podem ser opcionais no início.

### Exemplo mínimo recomendado

```json
{
  "reply": "你好！我们开始吧。",
  "full_reply_text": "你好！我们开始吧。",
  "reply_structured": [
    {
      "hanzi": "你好！",
      "pinyin": "Nǐ hǎo!",
      "translation": { "pt": "Olá!" }
    },
    {
      "hanzi": "我们开始吧。",
      "pinyin": "Wǒmen kāishǐ ba.",
      "translation": { "pt": "Vamos começar." }
    }
  ]
}
```

---

## 2) Regras pedagógicas para evitar respostas avançadas

Adicionar no prompt de sistema (ou contrato de instruções):

- Ensinar no nível do aluno (`HSK1`, `HSK2`, etc.).
- Não introduzir palavras fora do nível sem marcar como “extra”.
- Frases curtas (máx. 12–15 hanzi no nível iniciante).
- Priorizar vocabulário já estudado na conversa.
- Sempre explicar em português simples quando for dúvida gramatical.
- Quando o aluno pedir tradução, responder **direto + exemplo curto**.

Sugestão de regra objetiva:

- `max_new_words_per_reply: 3`
- `target_sentence_count: 2..4`
- `difficulty_guard: strict`

---

## 3) Fluxo de validação antes de mostrar no front

No backend `/edu/chat`, antes de retornar ao site:

1. Tentar parsear JSON.
2. Validar schema (`reply_structured[]` com `hanzi`, `pinyin`, `translation.pt`).
3. Se inválido:
   - Fazer 1 retry automático com prompt curto: “corrija para JSON válido no schema”.
4. Se ainda inválido:
   - Retornar resposta segura padronizada para não quebrar UI.

Assim o front não depende de “sorte” da LLM.

---

## 4) Integração com site principal (sem quebrar o atual)

Para integrar no site principal mantendo o projeto estável:

- Expor o tutor via rota dedicada (ex.: `/aulaChines/tutor`).
- Manter o proxy `/api/chat` no app Next para esconder token.
- Padronizar o mesmo componente de mensagem para:
  - chat do projeto atual
  - possível embed no site principal
- Evitar alterar placeholders existentes até finalizar contrato final da LLM.

Checklist de integração:

- [ ] Mesmo `basePath` no ambiente final
- [ ] `LLM_API_URL` e `LLM_API_TOKEN` no ambiente correto
- [ ] Teste de 3 cenários: saudação, tradução simples, dúvida gramatical
- [ ] Verificar toggles de pinyin e tradução por frase

---

## 5) Observabilidade (para melhorar rápido)

Adicionar logs simples por requisição:

- `level` recebido
- quantidade de frases em `reply_structured`
- se houve retry de JSON
- tempo total da chamada

Com isso fica fácil identificar quando a LLM “sai do trilho”.

---

## 6) Prompt-base sugerido (curto e forte)

Use algo nessa linha no sistema:

> Você é tutor de chinês para falantes de português.
> Responda APENAS em JSON válido no schema solicitado.
> Cada frase deve ter hanzi, pinyin com tons e tradução pt.
> Respeite o nível {level}. Não use linguagem avançada sem marcar como extra.
> Seja curto, didático e amigável.

---

## 7) Próximo passo prático (ordem recomendada)

1. Fechar schema mínimo obrigatório (`hanzi`, `pinyin`, `translation.pt`).
2. Implementar validação + retry no backend do `/edu/chat`.
3. Ajustar prompt com regras de dificuldade.
4. Testar no front com 10 prompts reais de aluno.
5. Só depois expandir para `en/es` e recursos avançados.

---

Se quiser, no próximo passo eu já posso transformar este documento em:

- **versão técnica** (com JSON Schema completo), e
- **versão pronta para colar no system prompt da LLM**.
