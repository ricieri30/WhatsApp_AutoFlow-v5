import "dotenv/config";
import express from "express";
import qrcode from "qrcode";
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";

const app = express();
app.use(express.json());

let sock;
let lastQr = null;
let status = "starting";

// ── Armazenamento de contatos ───────────────────────────────────
const contactsMap = new Map(); // jid → { id, name, phone }

// Mapa auxiliar: LID → número real (quando o WhatsApp fornece)
const lidToPhone = new Map();

// Cache de IDs de mensagens já processadas (anti-duplicata)
const processedMsgs = new Set();

function normalizePhone(jid = '') {
  return jid.replace(/@s\.whatsapp\.net$/, '').replace(/@.*$/, '');
}

// Verifica se o JID é um número real (@s.whatsapp.net) ou um LID (@lid)
function isRealPhoneJid(jid = '') {
  return jid.includes('@s.whatsapp.net') || /^\d+$/.test(jid);
}

function isLid(jid = '') {
  return jid.includes('@lid');
}

// Extrai o número real do contato, tratando LIDs
function extractPhone(contact) {
  const id = contact.id || '';
  
  // 1. Se o ID já é um número real (@s.whatsapp.net), usar direto
  if (isRealPhoneJid(id)) {
    return normalizePhone(id);
  }
  
  // 2. Se é um LID, tentar resolver o número real
  if (isLid(id)) {
    const lidKey = normalizePhone(id);
    
    // 2a. Verificar mapeamento já capturado
    if (lidToPhone.has(lidKey)) {
      return lidToPhone.get(lidKey);
    }
    
    // 2b. Tentar resolver via signalRepository do Baileys 7.x
    try {
      const pn = sock?.signalRepository?.lidMapping?.getPNForLID?.(id);
      if (pn && isRealPhoneJid(pn)) {
        const realPhone = normalizePhone(pn);
        lidToPhone.set(lidKey, realPhone);
        return realPhone;
      }
    } catch (e) {
      // Ignorar erros de resolução
    }
    
    // 2c. Tentar campos alternativos do contato
    if (contact.jid && isRealPhoneJid(contact.jid)) {
      const realPhone = normalizePhone(contact.jid);
      lidToPhone.set(lidKey, realPhone);
      return realPhone;
    }
    if (contact.phoneNumber) {
      const realPhone = normalizePhone(contact.phoneNumber);
      lidToPhone.set(lidKey, realPhone);
      return realPhone;
    }
    
    // Não conseguiu resolver o número real
    return null;
  }
  
  // 3. Fallback: extrair o que der do JID
  return normalizePhone(id);
}

function addContact(contact) {
  if (!contact.id || contact.id.includes('@g.us')) return; // ignorar grupos
  
  const phone = extractPhone(contact);
  
  // Se não conseguimos um número válido (ex: LID não resolvido), pular
  // a menos que seja para atualizar o nome de um contato existente
  const existing = contactsMap.get(contact.id) || {};
  
  // Priorização inteligente de nomes:
  // name (nome oficial) > verifiedName > notify (pushName) > existente
  let name = existing.name || null;
  if (!name || contact.name || contact.verifiedName) {
    name = contact.name || contact.verifiedName || contact.notify || existing.name || null;
  }
  
  // Usar phone válido, ou manter o existente, ou o JID limpo como fallback
  const finalPhone = phone || existing.phone || normalizePhone(contact.id);
  
  contactsMap.set(contact.id, {
    id: contact.id,
    name,
    phone: finalPhone,
    isLid: isLid(contact.id) && !phone, // marcar se o número é incerto
  });
}

async function start() {
  console.log("🚀 Iniciando WhatsApp Gateway...");
  
  try {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");

    sock = makeWASocket({ 
      auth: state, 
      printQRInTerminal: false,
    });

    sock.ev.on("creds.update", saveCreds);

    // ── Capturar contatos de TODOS os eventos possíveis ───────────
    
    // Helper: captura mapeamento LID→número quando o contato tem ambos
    const captureLidMapping = (contact) => {
      if (!contact) return;
      // Se o contato tem um campo 'lid' e um 'id' com número real
      if (contact.lid && contact.id && isRealPhoneJid(contact.id)) {
        const lidKey = normalizePhone(contact.lid);
        const realPhone = normalizePhone(contact.id);
        lidToPhone.set(lidKey, realPhone);
      }
      // Inverso: id é LID e tem campo com número
      if (isLid(contact.id || '') && contact.jid && isRealPhoneJid(contact.jid)) {
        const lidKey = normalizePhone(contact.id);
        const realPhone = normalizePhone(contact.jid);
        lidToPhone.set(lidKey, realPhone);
      }
    };
    
    // 1. Histórico de mensagens (principal fonte)
    sock.ev.on("messaging-history.set", ({ contacts, chats }) => {
      if (contacts) {
        console.log(`📥 Histórico: ${contacts.length} contatos`);
        contacts.forEach(captureLidMapping);
        contacts.forEach(addContact);
      }
      if (chats) {
        console.log(`💬 Histórico: ${chats.length} conversas`);
        chats.forEach(chat => {
          if (chat.id && !chat.id.includes('@g.us')) {
            captureLidMapping(chat);
            addContact({ id: chat.id, name: chat.name });
          }
        });
      }
    });

    // 2. Lista de contatos completa
    sock.ev.on("contacts.set", ({ contacts }) => {
      if (contacts) {
        console.log(`📇 Contatos: ${contacts.length} novos`);
        contacts.forEach(captureLidMapping);
        contacts.forEach(addContact);
      }
    });

    // 3. Novos contatos
    sock.ev.on("contacts.upsert", (contacts) => {
      if (contacts && contacts.length > 0) {
        console.log(`➕ Novos contatos: ${contacts.length}`);
        contacts.forEach(captureLidMapping);
        contacts.forEach(addContact);
      }
    });

    // 4. Contatos atualizados
    sock.ev.on("contacts.update", (contacts) => {
      if (contacts && contacts.length > 0) {
        console.log(`🔄 Atualizados: ${contacts.length} contatos`);
        contacts.forEach(captureLidMapping);
        contacts.forEach(addContact);
      }
    });

    // 5. Novas conversas
    sock.ev.on("chats.upsert", (chats) => {
      const validChats = chats.filter(c => c.id && !c.id.includes('@g.us'));
      if (validChats.length > 0) {
        console.log(`💬 Novas conversas: ${validChats.length}`);
        validChats.forEach(chat => addContact({ id: chat.id, name: chat.name }));
      }
    });

    // 6. Conversas atualizadas
    sock.ev.on("chats.update", (chats) => {
      const validChats = chats.filter(c => c.id && !c.id.includes('@g.us'));
      if (validChats.length > 0) {
        validChats.forEach(chat => addContact({ id: chat.id, name: chat.name }));
      }
    });

    // 7. Mensagens recebidas (captura pushName + mapeia LID→número)
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      for (const msg of messages) {
        if (msg.key.fromMe) continue;

        const remoteJid = msg.key.remoteJid;
        if (!remoteJid || remoteJid.includes('@g.us')) continue;

        // Capturar mapeamento LID → número real quando disponível
        const altJid = msg.key.remoteJidAlt || msg.key.senderPn || msg.verifiedBizName;

        if (isLid(remoteJid) && altJid && isRealPhoneJid(altJid)) {
          const lidKey = normalizePhone(remoteJid);
          const realPhone = normalizePhone(altJid);
          lidToPhone.set(lidKey, realPhone);
        }

        // Adicionar/atualizar contato com pushName
        if (msg.pushName) {
          const contactJid = (altJid && isRealPhoneJid(altJid)) ? altJid : remoteJid;
          addContact({ id: contactJid, notify: msg.pushName });
        }

        // ── EXTRAIR TEXTO DA MENSAGEM ──────────────────────────────
        const m = msg.message || {};
        const text =
          m.conversation ||
          m.extendedTextMessage?.text ||
          m.imageMessage?.caption ||
          m.videoMessage?.caption ||
          m.buttonsResponseMessage?.selectedDisplayText ||
          m.listResponseMessage?.title ||
          "";

        if (!text) continue; // sem texto (ex: figurinha, áudio) → ignora

        // ── ENVIAR PARA A API (webhook) p/ disparar auto-resposta ──
        // Só dispara em mensagens novas (não no carregamento de histórico)
        if (type && type !== "notify") continue;

        // Ignorar mensagens antigas (mais de 60s) — evita responder histórico
        // que chega marcado como "notify" logo após reconexão
        const msgTs = Number(msg.messageTimestamp || 0);
        if (msgTs && (Date.now() / 1000 - msgTs) > 60) {
          continue;
        }

        // Proteção anti-duplicata: não processar a mesma mensagem 2x
        const msgId = msg.key.id;
        if (msgId) {
          if (processedMsgs.has(msgId)) continue;
          processedMsgs.add(msgId);
          // Limitar tamanho do cache (manter últimas ~500)
          if (processedMsgs.size > 500) {
            const first = processedMsgs.values().next().value;
            processedMsgs.delete(first);
          }
        }

        // Resolver o melhor número para identificar o contato
        const lidNum  = normalizePhone(remoteJid);
        const realNum = (altJid && isRealPhoneJid(altJid))
          ? normalizePhone(altJid)
          : (lidToPhone.get(lidNum) || null);

        const webhookUrl = process.env.WEBHOOK_URL;
        if (!webhookUrl) continue;

        try {
          // Timeout de 10s para não travar se a API não responder
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              from:     realNum || lidNum,  // número p/ resposta e match
              fromLid:  lidNum,              // LID (fallback p/ match)
              fromReal: realNum,             // número real, se houver
              replyTo:  remoteJid,           // JID original p/ responder
              text,
              pushName: msg.pushName || "",
            }),
          });
          clearTimeout(timeout);
          console.log(`📨 Webhook → API: from=${realNum || lidNum} text="${text.slice(0,40)}"`);
        } catch (e) {
          console.error(`❌ Erro ao chamar webhook: ${e.message}`);
        }
      }
    });

    // 8. Status da conexão
    sock.ev.on("connection.update", async (u) => {
      if (u.qr) {
        lastQr = await qrcode.toDataURL(u.qr);
        status = "qr";
        console.log("📱 QR Code gerado! Escaneie com o WhatsApp.");
      }
      
      if (u.connection === "open") {
        status = "connected";
        lastQr = null;
        console.log("✅ WhatsApp conectado com sucesso!");
        console.log(`📊 Total de contatos carregados: ${contactsMap.size}`);
      }
      
      if (u.connection === "close") {
        const code = u?.lastDisconnect?.error?.output?.statusCode;
        status = "disconnected";
        console.log("❌ WhatsApp desconectado");
        
        if (code !== DisconnectReason.loggedOut) {
          console.log("🔄 Tentando reconectar em 2 segundos...");
          setTimeout(() => start(), 2000);
        } else {
          console.log("⚠️  Sessão encerrada. Escaneie o QR Code novamente.");
        }
      }
    });
    
  } catch (error) {
    console.error("❌ Erro ao iniciar gateway:", error.message);
    console.log("🔄 Tentando novamente em 5 segundos...");
    setTimeout(() => start(), 5000);
  }
}

await start();

// ── Rotas ────────────────────────────────────────────────────────
app.get("/status", (_req, res) => {
  res.json({ status, totalContacts: contactsMap.size });
});

app.get("/qr", (_req, res) => {
  res.json({ qr: lastQr });
});

// GET /contacts?q=busca&limit=20
app.get("/contacts", (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 500);
  // Por padrão, ocultar contatos com número incerto (LID não resolvido)
  const includeUncertain = req.query.includeUncertain === 'true';

  let list = Array.from(contactsMap.values());

  // Tentar resolver LIDs pendentes com o mapa atualizado
  list = list.map(c => {
    if (c.isLid && lidToPhone.has(c.phone)) {
      return { ...c, phone: lidToPhone.get(c.phone), isLid: false };
    }
    return c;
  });

  // Filtrar contatos com número incerto (LID), a menos que solicitado
  if (!includeUncertain) {
    list = list.filter(c => !c.isLid);
  }

  if (q) {
    list = list.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    );
  }

  // Ordenar: com nome primeiro, depois por nome/phone
  list.sort((a, b) => {
    if (a.name && !b.name) return -1;
    if (!a.name && b.name) return 1;
    return (a.name || a.phone).localeCompare(b.name || b.phone);
  });

  // Limpar campo interno isLid antes de enviar
  const result = list.slice(0, limit).map(({ isLid, ...c }) => c);
  res.json(result);
});

app.post("/send", async (req, res) => {
  const { to, text, replyTo } = req.body;
  if (!to || !text) return res.status(400).json({ error: "to_and_text_required" });
  if (status !== "connected") return res.status(409).json({ error: "not_connected" });

  try {
    // Preferir o JID original (replyTo) quando fornecido — funciona mesmo
    // quando o contato usa LID. Senão, montar a partir do número.
    let jid;
    if (replyTo && (replyTo.includes("@s.whatsapp.net") || replyTo.includes("@lid"))) {
      jid = replyTo;
    } else if (to.includes("@")) {
      jid = to;
    } else {
      jid = `${to}@s.whatsapp.net`;
    }
    await sock.sendMessage(jid, { text });
    console.log(`📤 Mensagem enviada para ${jid}`);
    res.json({ ok: true });
  } catch (error) {
    console.error(`❌ Erro ao enviar mensagem:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/send-media", async (req, res) => {
  const { to, type, url, caption } = req.body;
  if (!to || !url) return res.status(400).json({ error: "to_and_url_required" });
  if (status !== "connected") return res.status(409).json({ error: "not_connected" });
  
  try {
    const jid = to.includes("@s.whatsapp.net") ? to : `${to}@s.whatsapp.net`;
    const msgMap = {
      image:    { image:    { url }, caption: caption || "" },
      video:    { video:    { url }, caption: caption || "" },
      document: { document: { url }, fileName: caption || "arquivo" },
    };
    await sock.sendMessage(jid, msgMap[type] || msgMap.image);
    console.log(`📤 Mídia enviada para ${to}`);
    res.json({ ok: true });
  } catch (error) {
    console.error(`❌ Erro ao enviar mídia:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3333;
app.listen(port, () => {
  console.log(`✅ Gateway HTTP online na porta ${port}`);
  console.log(`📡 Rotas disponíveis:`);
  console.log(`   GET  /status   - Status da conexão`);
  console.log(`   GET  /qr       - QR Code para conexão`);
  console.log(`   GET  /contacts - Lista de contatos`);
  console.log(`   POST /send     - Enviar mensagem`);
  console.log(`   POST /send-media - Enviar mídia`);
});
