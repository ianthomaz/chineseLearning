# Ajustes na Resposta da API LLM para o site Chinese Learning

Para que o site consiga exibir as respostas da Prática com IA integradas com os seletores de **Pinyin** e **Tradução**, a API deve retornar um JSON estruturado.

## 1. Formato de Resposta Esperado (`/edu/chat` ou `/ask`)

A resposta da LLM deve ser um objeto JSON (ou conter um campo de texto formatado como JSON) com a seguinte estrutura:

```json
{
  "reply_structured": [
    {
      "hanzi": "你好！",
      "pinyin": "Nǐ hǎo!",
      "translation": {
        "pt": "Olá!",
        "en": "Hello!",
        "es": "¡Hola!"
      }
    },
    {
      "hanzi": "你想学习什么？",
      "pinyin": "Nǐ xiǎng xuéxí shénme?",
      "translation": {
        "pt": "O que você quer estudar?",
        "en": "What do you want to study?",
        "es": "¿Qué quieres estudiar?"
      }
    }
  ],
  "full_reply_text": "你好！你想学习什么？"
}
```

### Regras de Ouro:
1. **Hanzi**: Sempre caracteres simplificados.
2. **Pinyin**: Com marcas de tom (acentos), não números.
3. **Tradução**: Objeto com chaves `pt`, `en`, `es` para suportar o multi-idioma do site.
4. **Segmentação**: A resposta deve ser quebrada em pequenas sentenças ou blocos lógicos dentro da lista `reply_structured`.

## 2. Prompt de Sistema Sugerido

"Você é um tutor de chinês paciente e encorajador. Sua base de conhecimento é focada em alunos iniciantes (HSK1-HSK3). Quando o usuário falar com você, responda SEMPRE em chinês, mas forneça o Pinyin e a tradução para Português, Inglês e Espanhol no formato JSON especificado. Use vocabulário simples presente no material de estudo quando possível."

## 3. Tratamento de Erros

Se a LLM não conseguir gerar o JSON, o site tentará exibir o campo `reply` ou `answer` original como texto simples, mas a experiência visual será degradada (sem o toggle de Pinyin/Tradução funcionando por palavra).
