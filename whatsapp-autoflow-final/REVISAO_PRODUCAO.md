# 🔍 Revisão Pré-Produção — Respostas Automáticas

Análise completa feita antes de colocar em produção. Cada item foi verificado e corrigido.

---

## 🐛 Bugs encontrados nos seus testes (e corrigidos)

### 1. Regra com espaço no fim não casava
No print, você tinha duas regras: `"estou bem"` e `"estou bem "` (a segunda com **espaço no final**). O matching antigo comparava texto cru, então o espaço extra fazia a regra falhar com "Keyword não encontrada".

**Correção:** keyword e mensagem agora passam por `normText()` — minúsculas + remove espaços das pontas + colapsa espaços duplos. Também removo o espaço ao **salvar** a regra (`.trim()`).

### 2. "Número diferente" no teste
A regra mirava um contato (SOLANGE), mas você testou digitando outro número. No simulador isso sempre vai dar "número diferente" — é o comportamento correto.

**Atenção importante:** se a regra de contato específico foi criada selecionando um contato cujo `targetPhone` salvo é o **LID** (número interno do WhatsApp), o teste manual só vai casar se você digitar **exatamente esse mesmo número**. Na prática real (mensagem de verdade chegando), o sistema agora tenta casar tanto pelo LID quanto pelo número real.

### 3. Teste e produção usavam lógicas diferentes
O simulador e o disparo real tinham códigos separados de matching, com normalização diferente. Isso significa que "passar no teste" não garantia "funcionar de verdade".

**Correção:** criei funções compartilhadas (`normPhone`, `normText`, `timeInRange`, `evaluateRule`). Agora **teste e produção usam exatamente o mesmo código** — o que passa no teste funciona em produção.

---

## ✅ Cenários validados (simulação local)

| Cenário | Resultado |
|---------|-----------|
| Regra "estou bem", msg "estou bem" | ✅ casa |
| Regra "estou bem " (espaço), msg "estou bem" | ✅ casa (corrigido) |
| Regra alvo = LID, msg vem com nº real | ✅ casa |
| Regra alvo = "55 15 98800-8487" (formatado), msg nº puro | ✅ casa (normaliza) |
| Regra "ESTOU BEM", msg "  Estou   Bem  " | ✅ casa (maiúsc + espaços) |
| Regra alvo = 999, remetente = 111 | ✅ rejeita corretamente |

---

## 🛡️ Proteções adicionadas para produção

### Anti-loop
- Mensagens do próprio bot (`fromMe`) são ignoradas → o bot nunca responde a si mesmo.

### Anti-duplicata
- Cache dos últimos 500 IDs de mensagem. Se o WhatsApp reenviar a mesma mensagem (acontece em reconexões), não responde 2x.

### Anti-histórico
- Mensagens com mais de 60 segundos são ignoradas. Evita que, ao reconectar, o bot dispare respostas para mensagens antigas que chegam em lote.

### Timeout
- A chamada do gateway para a API tem timeout de 10s. Se a API travar, o gateway não congela.

### Só texto
- Figurinhas, áudios e imagens sem legenda são ignorados (não têm texto pra casar palavra-chave).

---

## ⚠️ Pontos de atenção que VOCÊ deve saber

### 1. O bot não responde para você mesmo
Para testar de verdade, mande a mensagem de **outro celular/número** para o número conectado. Mandar de si para si não dispara (é `fromMe`).

### 2. Regras de "contato específico" e o LID
Se criar uma regra para um contato específico, o número salvo pode ser o LID. O sistema lida com isso na prática, mas no **simulador** você precisa digitar o mesmo número que aparece embaixo da regra. Para a maioria dos casos, **use "Todos os clientes"** que é mais simples e sempre funciona.

### 3. Ordem das regras
Se houver várias regras que casam, vence a **mais específica** (com contato definido) e, entre iguais, a **mais antiga**. Regras "para todos" só disparam se nenhuma específica casar.

### 4. Palavra-chave é "contém", não "igual"
A regra "bem" vai casar com "estou bem", "tudo bem?", "bem-vindo". Se quiser match exato, use a frase completa.

---

## 🧪 Como testar em produção (passo a passo)

1. Rebuild: `docker compose build api wa-gateway && docker compose up -d api wa-gateway`
2. Abra os logs: `docker compose logs -f wa-gateway api`
3. De **outro número**, mande "estou bem" para o WhatsApp conectado
4. Observe a sequência nos logs:
   ```
   📨 Webhook → API: from=... text="estou bem"
   📨 /internal/message: from=... text="estou bem"
   ✅ Regra "estou bem" ativada para ...
   📤 Resposta enviada: {"ok":true}
   ```
5. O outro número deve receber "Que ótimo ❤️..."

### Se aparecer "⚠️ Nenhuma regra ativa"
O log mostra o número e texto exatos que chegaram. Compare com a regra:
- O texto bate com a palavra-chave?
- Se for regra de contato específico, o número (ou LID) bate?

---

## 📋 Checklist final de produção

- [x] Teste e produção usam a mesma lógica de matching
- [x] Espaços/maiúsculas não quebram o matching
- [x] Número normalizado (formatado ou puro funciona)
- [x] LID e número real ambos testados no match
- [x] Anti-loop (não responde a si mesmo)
- [x] Anti-duplicata (não responde 2x)
- [x] Anti-histórico (não responde mensagens antigas)
- [x] Timeout na chamada do webhook
- [x] Variáveis WEBHOOK_URL e WA_GATEWAY_URL no docker-compose
- [x] Node 20 (fetch nativo) nos dois serviços
- [x] Sintaxe validada em todos os arquivos

---

## 🚀 Deploy

```bash
cd whatsapp-autoflow-final
docker compose build api wa-gateway
docker compose up -d api wa-gateway
docker compose logs -f wa-gateway api
```

Ou simplesmente: `bash deploy.sh`
