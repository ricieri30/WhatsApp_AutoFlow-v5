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
const contactsMap = new Map(); // jid → { id, name, notify, phone }

function normalizePhone(jid = '') {
  return jid.replace(/@s\.whatsapp\.net$/, '').replace(/@.*$/, '');
}

function addContact(contact) {
  if (!contact.id || contact.id.includes('@g.us') || contact.id.includes('@broadcast')) return; // ignorar grupos e transmissões
  const phone = normalizePhone(contact.id);
  const existing = contactsMap.get(contact.id) || {};
  // Priorizar nomes vindos do evento, senão manter o que já temos
  const name = contact.name || contact.notify || contact.verifiedName || existing.name || null;

  contactsMap.set(contact.id, {
    id: contact.id,
    name,
    phone,
  });

  if (contactsMap.size % 100 === 0) {
    console.log(`[Gateway] contactsMap size: ${contactsMap.size}`);
  }
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");

  sock = makeWASocket({ auth: state, printQRInTerminal: false });

  sock.ev.on("creds.update", saveCreds);

  // ── Capturar contatos ─────────────────────────────────────────
  sock.ev.on("messaging-history.set", ({ contacts, chats }) => {
    if (contacts) contacts.forEach(addContact);
    if (chats) chats.forEach(c => addContact({ id: c.id, name: c.name }));
  });

  sock.ev.on("chats.set", ({ chats }) => {
    if (chats) chats.forEach(c => addContact({ id: c.id, name: c.name }));
  });

  sock.ev.on("contacts.set", ({ contacts }) => {
    if (contacts) contacts.forEach(addContact);
  });

  sock.ev.on("contacts.upsert", (contacts) => {
    contacts.forEach(addContact);
  });

  sock.ev.on("contacts.update", (contacts) => {
    contacts.forEach(c => {
      const existing = contactsMap.get(c.id) || {};
      const name = c.name || c.notify || c.verifiedName || existing.name || null;
      contactsMap.set(c.id, { ...existing, ...c, name, phone: normalizePhone(c.id) });
    });
  });

  // Capturar de chats também (contatos que mandaram mensagem)
  sock.ev.on("chats.upsert", (chats) => {
    chats.forEach(chat => {
      if (chat.id && !chat.id.includes('@g.us')) {
        addContact({ id: chat.id, name: chat.name });
      }
    });
  });

  sock.ev.on("chats.update", (chats) => {
    chats.forEach(chat => {
      if (chat.id && !chat.id.includes('@g.us')) {
        addContact({ id: chat.id, name: chat.name });
      }
    });
  });

  // Capturar nomes de mensagens recebidas (pushName)
  sock.ev.on("messages.upsert", ({ messages }) => {
    for (const msg of messages) {
      if (!msg.key.fromMe && msg.pushName && msg.key.remoteJid && !msg.key.remoteJid.includes('@g.us')) {
        addContact({ id: msg.key.remoteJid, notify: msg.pushName });
      }
    }
  });

  sock.ev.on("connection.update", async (u) => {
    if (u.qr) {
      lastQr = await qrcode.toDataURL(u.qr);
      status = "qr";
    }
    if (u.connection === "open") {
      status = "connected";
      lastQr = null;
    }
    if (u.connection === "close") {
      const code = u?.lastDisconnect?.error?.output?.statusCode;
      status = "disconnected";
      if (code !== DisconnectReason.loggedOut) setTimeout(() => start(), 2000);
    }
  });
}

await start();

// ── Rotas ────────────────────────────────────────────────────────
app.get("/status", (_req, res) => res.json({ status }));
app.get("/qr", (_req, res) => res.json({ qr: lastQr }));

// GET /contacts?q=busca&limit=20
app.get("/contacts", (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 10000);

  let list = Array.from(contactsMap.values());

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

  res.json(list.slice(0, limit));
});

app.post("/send", async (req, res) => {
  const { to, text } = req.body;
  if (!to || !text) return res.status(400).json({ error: "to_and_text_required" });
  if (status !== "connected") return res.status(409).json({ error: "not_connected" });
  const jid = to.includes("@s.whatsapp.net") ? to : `${to}@s.whatsapp.net`;
  await sock.sendMessage(jid, { text });
  res.json({ ok: true });
});

app.post("/send-media", async (req, res) => {
  const { to, type, url, caption } = req.body;
  if (!to || !url) return res.status(400).json({ error: "to_and_url_required" });
  if (status !== "connected") return res.status(409).json({ error: "not_connected" });
  const jid = to.includes("@s.whatsapp.net") ? to : `${to}@s.whatsapp.net`;
  const msgMap = {
    image:    { image:    { url }, caption: caption || "" },
    video:    { video:    { url }, caption: caption || "" },
    audio:    { audio:    { url }, ptt: true },
    document: { document: { url }, fileName: caption || "arquivo" },
  };
  await sock.sendMessage(jid, msgMap[type] || msgMap.image);
  res.json({ ok: true });
});

const port = process.env.PORT || 3333;
app.listen(port, () => console.log(`✅ wa-gateway online :${port}`));

