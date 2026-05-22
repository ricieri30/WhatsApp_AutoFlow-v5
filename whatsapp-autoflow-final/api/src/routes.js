import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cronParser from "cron-parser";

import { auth } from "./auth.js";
import { User, Contact, Template, Recurring, ScheduledMessage, AutoReply,
         OnboardingConfig, PipelineConfig, PipelineContact, Audit } from "./models.js";
import { makeQueue, upsertRecurringScheduler, removeRecurringScheduler } from "./scheduler.js";

const router = express.Router();
const queue = makeQueue();

// ── Job diário de notificações de assinatura ──────────────────────
// Agenda uma verificação todo dia às 08:00 BRT
async function scheduleSubscriptionCheck() {
  try {
    await queue.upsertJobScheduler(
      "daily-subscription-check",
      { pattern: "0 8 * * *", tz: "America/Sao_Paulo" },
      { name: "check-subscriptions", data: {}, opts: { attempts: 3, removeOnComplete: 7, removeOnFail: 7 } }
    );
    // Job diário da esteira semanal (mesma hora)
    await queue.upsertJobScheduler(
      "daily-pipeline-weekly",
      { pattern: "5 8 * * *", tz: "America/Sao_Paulo" },
      { name: "pipeline-weekly-check", data: {}, opts: { attempts: 3, removeOnComplete: 7, removeOnFail: 7 } }
    );
    console.log("✅ Jobs diários agendados (08:00 e 08:05 BRT)");
  } catch (e) {
    console.warn("⚠️  Não foi possível agendar jobs diários:", e.message);
  }
}
scheduleSubscriptionCheck();

// ── Auth ──────────────────────────────────────────────────────────
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const u = await User.findOne({ email });
  if (!u) return res.status(401).json({ error: "invalid_credentials" });
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });
  const token = jwt.sign({ email: u.email, role: u.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { email: u.email, role: u.role } });
});

// ── Dashboard (enriquecido) ───────────────────────────────────────
router.get("/dashboard", auth, async (_req, res) => {
  const [recurringActive, recurringTotal, contacts, templates, recentAudit] = await Promise.all([
    Recurring.countDocuments({ enabled: true }),
    Recurring.countDocuments({}),
    Contact.countDocuments({}),
    Template.countDocuments({}),
    Audit.find({}).sort({ at: -1 }).limit(5),
  ]);

  // Próximas 3 automações que vão disparar
  const activeRecs = await Recurring.find({ enabled: true }).populate("templateId").limit(20);
  const upcoming = [];
  for (const r of activeRecs) {
    try {
      const it = cronParser.parseExpression(r.pattern, { tz: r.tz });
      const next = it.next().toDate();
      upcoming.push({ name: r.name, next, tz: r.tz, templateName: r.templateId?.name || "—" });
    } catch {}
  }
  upcoming.sort((a, b) => a.next - b.next);

  const pipelineActive = await PipelineContact.countDocuments({ status: { $nin: ["ended"] } });

  res.json({
    recurringActive,
    recurringTotal,
    contacts,
    templates,
    recentAudit,
    upcoming: upcoming.slice(0, 5),
    pipelineActive,
  });
});

// ── WhatsApp ──────────────────────────────────────────────────────
router.get("/whatsapp/status", auth, async (_req, res) => {
  const r = await fetch(`${process.env.WA_GATEWAY_URL}/status`);
  res.status(r.status).json(await r.json());
});

router.get("/whatsapp/qr", auth, async (_req, res) => {
  const r = await fetch(`${process.env.WA_GATEWAY_URL}/qr`);
  res.status(r.status).json(await r.json());
});

// GET /whatsapp/contacts?q=busca&limit=50
router.get("/whatsapp/contacts", auth, async (req, res) => {
  try {
    const params = new URLSearchParams();
    if (req.query.q)     params.set('q', req.query.q);
    if (req.query.limit) params.set('limit', req.query.limit);
    const r = await fetch(`${process.env.WA_GATEWAY_URL}/contacts?${params}`);
    res.status(r.status).json(await r.json());
  } catch {
    res.json([]);
  }
});

// ── Templates ─────────────────────────────────────────────────────
router.get("/templates", auth, async (_req, res) =>
  res.json(await Template.find({}).sort({ createdAt: -1 }))
);

router.post("/templates", auth, async (req, res) => {
  const { name, body, vars } = req.body;
  if (!name || !body) return res.status(400).json({ error: "name_and_body_required" });
  const doc = await Template.create({ name, body, vars: vars || [] });
  await Audit.create({ who: req.user.email, action: "CREATE_TEMPLATE", entity: String(doc._id), detail: `Criou template: ${name}`, ok: true });
  res.json(doc);
});

router.put("/templates/:id", auth, async (req, res) => {
  const { name, body, vars } = req.body;
  const doc = await Template.findByIdAndUpdate(req.params.id, { name, body, vars: vars || [] }, { new: true });
  if (!doc) return res.status(404).json({ error: "not_found" });
  await Audit.create({ who: req.user.email, action: "UPDATE_TEMPLATE", entity: String(doc._id), detail: `Editou template: ${name}`, ok: true });
  res.json(doc);
});

router.delete("/templates/:id", auth, async (req, res) => {
  const doc = await Template.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ error: "not_found" });
  await Audit.create({ who: req.user.email, action: "DELETE_TEMPLATE", entity: req.params.id, detail: `Deletou template: ${doc.name}`, ok: true });
  res.json({ ok: true });
});

// POST /templates/:id/clone — clona um template
router.post("/templates/:id/clone", auth, async (req, res) => {
  const original = await Template.findById(req.params.id);
  if (!original) return res.status(404).json({ error: "not_found" });
  const clone = await Template.create({
    name: `${original.name} (cópia)`,
    body: original.body,
    vars: original.vars,
  });
  await Audit.create({ who: req.user.email, action: "CLONE_TEMPLATE", entity: String(clone._id), detail: `Clonou template: ${original.name}`, ok: true });
  res.json(clone);
});

// ── Contacts ──────────────────────────────────────────────────────
router.get("/contacts", auth, async (_req, res) =>
  res.json(await Contact.find({}).sort({ createdAt: -1 }))
);

router.post("/contacts", auth, async (req, res) => {
  const { phoneE164, name, tags, subscriptionStart, subscriptionEnd, subscriptionNotes } = req.body;
  if (!phoneE164) return res.status(400).json({ error: "phoneE164_required" });
  const existing = await Contact.findOne({ phoneE164 });
  if (existing) return res.status(409).json({ error: "already_exists", contact: existing });
  const doc = await Contact.create({
    phoneE164,
    name: name || "",
    tags: tags || [],
    optIn: true,
    subscriptionStart: subscriptionStart || null,
    subscriptionEnd:   subscriptionEnd   || null,
    subscriptionNotes: subscriptionNotes || "",
  });
  res.json(doc);
});

router.put("/contacts/:id", auth, async (req, res) => {
  const { name, tags, optIn, subscriptionStart, subscriptionEnd, subscriptionNotes } = req.body;
  const doc = await Contact.findByIdAndUpdate(req.params.id, {
    name, tags, optIn,
    subscriptionStart: subscriptionStart || null,
    subscriptionEnd:   subscriptionEnd   || null,
    subscriptionNotes: subscriptionNotes || "",
  }, { new: true });
  if (!doc) return res.status(404).json({ error: "not_found" });
  res.json(doc);
});

router.delete("/contacts/:id", auth, async (req, res) => {
  await Contact.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ── Métricas de Assinaturas ───────────────────────────────────────
router.get("/subscriptions/metrics", auth, async (_req, res) => {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const in7d  = new Date(today); in7d.setDate(today.getDate() + 7);
  const in1d  = new Date(today); in1d.setDate(today.getDate() + 1);

  const [active, expiring7d, expiringToday, expired, noSub] = await Promise.all([
    // Ativos: endDate existe e é futuro
    Contact.countDocuments({ subscriptionEnd: { $gt: today } }),
    // Vencendo em até 7 dias (a partir de amanhã)
    Contact.find({
      subscriptionEnd: { $gte: in1d, $lte: in7d }
    }).sort({ subscriptionEnd: 1 }).limit(50),
    // Vencendo hoje
    Contact.find({
      subscriptionEnd: { $gte: today, $lt: in1d }
    }).sort({ subscriptionEnd: 1 }).limit(50),
    // Vencidos
    Contact.countDocuments({ subscriptionEnd: { $lte: today } }),
    // Sem assinatura configurada
    Contact.countDocuments({ subscriptionEnd: null }),
  ]);

  // Total de contatos
  const total = await Contact.countDocuments({});

  res.json({
    total,
    active,
    expired,
    noSub,
    expiring7d,
    expiringToday,
    expiring7dCount: expiring7d.length,
    expiringTodayCount: expiringToday.length,
  });
});

// Contatos vencendo em N dias (para listar na view)
router.get("/subscriptions/expiring", auth, async (req, res) => {
  const days = parseInt(req.query.days || '30', 10);
  const today = new Date(); today.setHours(0,0,0,0);
  const future = new Date(today); future.setDate(today.getDate() + days);

  const contacts = await Contact.find({
    subscriptionEnd: { $gte: today, $lte: future }
  }).sort({ subscriptionEnd: 1 }).limit(200);

  res.json(contacts);
});

// Contatos vencidos
router.get("/subscriptions/expired", auth, async (_req, res) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const contacts = await Contact.find({
    subscriptionEnd: { $lt: today }
  }).sort({ subscriptionEnd: -1 }).limit(200);
  res.json(contacts);
});

// ── Recurring ─────────────────────────────────────────────────────
router.get("/recurring", auth, async (_req, res) => {
  const list = await Recurring.find({}).sort({ createdAt: -1 }).populate("templateId");
  res.json(list);
});

router.post("/recurring", auth, async (req, res) => {
  const doc = await Recurring.create(req.body);
  if (doc.enabled) await upsertRecurringScheduler(queue, doc);
  await Audit.create({ who: req.user.email, action: "CREATE_RECURRING", entity: String(doc._id), detail: `Criou: ${doc.name}`, ok: true });
  res.json(doc);
});

router.post("/recurring/:id/pause", auth, async (req, res) => {
  await Recurring.findByIdAndUpdate(req.params.id, { enabled: false });
  await removeRecurringScheduler(queue, req.params.id);
  res.json({ ok: true });
});

router.post("/recurring/:id/resume", auth, async (req, res) => {
  const doc = await Recurring.findByIdAndUpdate(req.params.id, { enabled: true }, { new: true });
  await upsertRecurringScheduler(queue, doc);
  res.json({ ok: true });
});

router.delete("/recurring/:id", auth, async (req, res) => {
  const doc = await Recurring.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: "not_found" });
  await removeRecurringScheduler(queue, req.params.id);
  await Recurring.findByIdAndDelete(req.params.id);
  await Audit.create({ who: req.user.email, action: "DELETE_RECURRING", entity: req.params.id, detail: `Deletou: ${doc.name}`, ok: true });
  res.json({ ok: true });
});

// POST /recurring/:id/clone — clona uma regra de automação
router.post("/recurring/:id/clone", auth, async (req, res) => {
  const original = await Recurring.findById(req.params.id);
  if (!original) return res.status(404).json({ error: "not_found" });
  const { _id, createdAt, ...data } = original.toObject();
  const clone = await Recurring.create({
    ...data,
    name: `${original.name} (cópia)`,
    enabled: false, // começa pausada para revisão
  });
  await Audit.create({ who: req.user.email, action: "CLONE_RECURRING", entity: String(clone._id), detail: `Clonou automação: ${original.name}`, ok: true });
  res.json(clone);
});

router.post("/recurring/preview", auth, async (req, res) => {
  const { pattern, tz, count = 5 } = req.body;
  try {
    const it = cronParser.parseExpression(pattern, { tz });
    const runs = [];
    for (let i = 0; i < count; i++) runs.push(it.next().toDate().toISOString());
    res.json({ runs });
  } catch (e) {
    res.status(400).json({ error: "invalid_cron", message: e.message });
  }
});

// ── Scheduled Messages ────────────────────────────────────────────
// Listar agendamentos
router.get("/scheduled", auth, async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const list = await ScheduledMessage.find(filter)
    .sort({ scheduledAt: 1 })
    .populate("templateId")
    .limit(200);
  res.json(list);
});

// Criar agendamento
router.post("/scheduled", auth, async (req, res) => {
  const { phoneE164, contactName, message, templateId, scheduledAt, name } = req.body;
  if (!phoneE164 || !message || !scheduledAt) {
    return res.status(400).json({ error: "phoneE164, message e scheduledAt são obrigatórios" });
  }

  const scheduledDate = new Date(scheduledAt);
  if (scheduledDate <= new Date()) {
    return res.status(400).json({ error: "scheduledAt deve ser uma data futura" });
  }

  // Criar registro no banco
  const doc = await ScheduledMessage.create({
    name: name || "",
    phoneE164,
    contactName: contactName || "",
    message,
    templateId: templateId || null,
    scheduledAt: scheduledDate,
    status: "pending",
    createdBy: req.user.email,
  });

  // Agendar job no BullMQ com delay exato
  const delay = scheduledDate.getTime() - Date.now();
  const job = await queue.add(
    "send-scheduled",
    { scheduledId: String(doc._id) },
    {
      delay,
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 500,
      removeOnFail: 500,
    }
  );

  // Salvar ID do job para cancelamento futuro
  await ScheduledMessage.findByIdAndUpdate(doc._id, {
    bullJobId: job.id,
    status: "queued",
  });

  await Audit.create({
    who: req.user.email,
    action: "CREATE_SCHEDULED",
    entity: String(doc._id),
    detail: `Agendou mensagem para ${phoneE164} em ${scheduledDate.toLocaleString("pt-BR")}`,
    ok: true,
  });

  res.json({ ...doc.toObject(), bullJobId: job.id, status: "queued" });
});

// Cancelar agendamento
router.post("/scheduled/:id/cancel", auth, async (req, res) => {
  const doc = await ScheduledMessage.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: "not_found" });
  if (doc.status === "sent") return res.status(400).json({ error: "Mensagem já foi enviada" });

  // Tentar remover job da fila
  if (doc.bullJobId) {
    try {
      const job = await queue.getJob(doc.bullJobId);
      if (job) await job.remove();
    } catch {}
  }

  await ScheduledMessage.findByIdAndUpdate(req.params.id, { status: "cancelled" });

  await Audit.create({
    who: req.user.email,
    action: "CANCEL_SCHEDULED",
    entity: String(doc._id),
    detail: `Cancelou agendamento para ${doc.phoneE164}`,
    ok: true,
  });

  res.json({ ok: true });
});

// Deletar agendamento (apenas cancelados, enviados ou falhos)
router.delete("/scheduled/:id", auth, async (req, res) => {
  const doc = await ScheduledMessage.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: "not_found" });

  if (doc.status === "pending" || doc.status === "queued") {
    // Cancelar primeiro
    if (doc.bullJobId) {
      try {
        const job = await queue.getJob(doc.bullJobId);
        if (job) await job.remove();
      } catch {}
    }
  }

  await ScheduledMessage.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// POST /auto-reply/test — simula uma mensagem recebida para testar regras
router.post("/auto-reply/test", auth, async (req, res) => {
  const { phone, text } = req.body;
  if (!phone || !text) return res.status(400).json({ error: "phone_e_text_obrigatorios" });

  const now = new Date();
  const curMin = now.getHours() * 60 + now.getMinutes();

  function timeInRange(start = "00:00", end = "23:59") {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const s = sh * 60 + sm, e = eh * 60 + em;
    return s > e ? (curMin >= s || curMin < e) : (curMin >= s && curMin <= e);
  }

  const rules = await AutoReply.find({ active: true }).sort({ targetPhone: -1, createdAt: 1 });

  let matched = null;
  const checked = [];

  for (const rule of rules) {
    const skip_phone   = rule.targetPhone && rule.targetPhone !== phone;
    const skip_time    = !timeInRange(rule.startTime, rule.endTime);
    const skip_keyword = !text.toLowerCase().includes(rule.keyword.toLowerCase());

    checked.push({
      keyword:     rule.keyword,
      targetPhone: rule.targetPhone || '(todos)',
      active:      rule.active,
      skip_reason: skip_phone ? 'numero_diferente' : skip_time ? 'fora_horario' : skip_keyword ? 'keyword_nao_encontrada' : null,
    });

    if (!skip_phone && !skip_time && !skip_keyword) {
      matched = rule; break;
    }
  }

  res.json({
    input:   { phone, text },
    matched: matched ? { keyword: matched.keyword, reply: matched.reply } : null,
    checked,
    total_rules: rules.length,
  });
});

// ── Auto-Reply CRUD ───────────────────────────────────────────────
router.get("/auto-reply", auth, async (_req, res) =>
  res.json(await AutoReply.find({}).sort({ createdAt: -1 }))
);

router.post("/auto-reply", auth, async (req, res) => {
  const { keyword, reply, targetPhone, startTime, endTime, active } = req.body;
  if (!keyword || !reply) return res.status(400).json({ error: "keyword_e_reply_obrigatorios" });
  const doc = await AutoReply.create({
    keyword, reply,
    targetPhone: targetPhone || "",
    startTime:   startTime   || "00:00",
    endTime:     endTime     || "23:59",
    active:      active !== false,
    createdBy:   req.user.email,
  });
  await Audit.create({ who: req.user.email, action: "CREATE_AUTO_REPLY", entity: String(doc._id), detail: `Regra: "${keyword}"`, ok: true });
  res.json(doc);
});

router.put("/auto-reply/:id", auth, async (req, res) => {
  const { keyword, reply, targetPhone, startTime, endTime, active } = req.body;
  const doc = await AutoReply.findByIdAndUpdate(req.params.id,
    { keyword, reply, targetPhone: targetPhone||"", startTime: startTime||"00:00", endTime: endTime||"23:59", active },
    { new: true }
  );
  if (!doc) return res.status(404).json({ error: "not_found" });
  res.json(doc);
});

router.post("/auto-reply/:id/clone", auth, async (req, res) => {
  const orig = await AutoReply.findById(req.params.id);
  if (!orig) return res.status(404).json({ error: "not_found" });
  const clone = await AutoReply.create({
    keyword: orig.keyword + " (cópia)", reply: orig.reply,
    targetPhone: orig.targetPhone, startTime: orig.startTime,
    endTime: orig.endTime, active: false, createdBy: req.user.email,
  });
  await Audit.create({ who: req.user.email, action: "CLONE_AUTO_REPLY", entity: String(clone._id), detail: `Clonou: "${orig.keyword}"`, ok: true });
  res.json(clone);
});

router.delete("/auto-reply/:id", auth, async (req, res) => {
  await AutoReply.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ── Webhook interno — recebe mensagens do wa-gateway ─────────────
// Chamado pelo gateway quando chega mensagem no WhatsApp
router.post("/internal/message", async (req, res) => {
  const { from, text, pushName } = req.body;
  if (!from || !text) return res.status(400).json({ error: "from_e_text_obrigatorios" });

  const phone = from.replace(/@s\.whatsapp\.net$/, "").replace(/@.*$/, "");
  console.log(`📨 /internal/message recebido: from=${phone} text="${text}"`);

  const now = new Date();
  const curMin = now.getHours() * 60 + now.getMinutes();

  function timeInRange(start = "00:00", end = "23:59") {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const s = sh * 60 + sm, e = eh * 60 + em;
    return s > e ? (curMin >= s || curMin < e) : (curMin >= s && curMin <= e);
  }

  // Buscar regras ativas ordenadas por especificidade (com targetPhone primeiro)
  const rules = await AutoReply.find({ active: true }).sort({ targetPhone: -1, createdAt: 1 });

  let matched = null;
  for (const rule of rules) {
    // Verificar se é para este contato específico ou para todos
    if (rule.targetPhone && rule.targetPhone !== phone) continue;
    // Verificar horário
    if (!timeInRange(rule.startTime, rule.endTime)) continue;
    // Verificar palavra-chave (case insensitive)
    if (text.toLowerCase().includes(rule.keyword.toLowerCase())) {
      matched = rule;
      break;
    }
  }

  if (matched) {
    console.log(`✅ Regra "${matched.keyword}" ativada para ${phone}`);
    try {
      const name = pushName || phone;
      const replyText = (matched.reply || "").replace(/\{\{nome\}\}/gi, name);
      const sendResp = await fetch(`${process.env.WA_GATEWAY_URL}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: phone, text: replyText }),
      });
      const sendResult = await sendResp.json().catch(() => ({}));
      console.log(`📤 Resposta enviada: ${JSON.stringify(sendResult)}`);
      await Audit.create({
        who: "system", action: "AUTO_REPLY_SENT",
        entity: String(matched._id),
        detail: `Regra "${matched.keyword}" → ${phone}`,
        ok: true,
      });
    } catch (e) {
      console.error(`❌ Erro ao enviar auto-reply: ${e.message}`);
      await Audit.create({ who: "system", action: "AUTO_REPLY_FAIL", entity: String(matched._id), detail: e.message, ok: false });
    }
  } else {
    console.log(`⚠️ Nenhuma regra ativa para: from=${phone} text="${text}"`);
  }

  res.json({ ok: true, matched: matched ? matched.keyword : null });
});

// ══════════════════════════════════════════════════════════════════
// ONBOARDING CONFIG
// ══════════════════════════════════════════════════════════════════

// Retorna a config (cria default se não existir)
router.get("/onboarding/config", auth, async (_req, res) => {
  let cfg = await OnboardingConfig.findOne();
  if (!cfg) cfg = await OnboardingConfig.create({ steps: [] });
  res.json(cfg);
});

router.put("/onboarding/config", auth, async (req, res) => {
  let cfg = await OnboardingConfig.findOne();
  if (!cfg) cfg = new OnboardingConfig();
  Object.assign(cfg, req.body);
  cfg.updatedAt = new Date();
  await cfg.save();
  res.json(cfg);
});

// ══════════════════════════════════════════════════════════════════
// PIPELINE CONFIG (textos das semanas)
// ══════════════════════════════════════════════════════════════════

router.get("/pipeline/config", auth, async (_req, res) => {
  let cfg = await PipelineConfig.findOne();
  if (!cfg) cfg = await PipelineConfig.create({
    weeks: [
      { week: 1, dayTrigger: 7,  sendTime: "08:00", message: "", mediaUrl: "" },
      { week: 2, dayTrigger: 14, sendTime: "08:00", message: "", mediaUrl: "" },
      { week: 3, dayTrigger: 21, sendTime: "08:00", message: "", mediaUrl: "" },
    ],
    renewalMessage: "",
  });
  res.json(cfg);
});

router.put("/pipeline/config", auth, async (req, res) => {
  let cfg = await PipelineConfig.findOne();
  if (!cfg) cfg = new PipelineConfig();
  Object.assign(cfg, req.body);
  cfg.updatedAt = new Date();
  await cfg.save();
  res.json(cfg);
});

// ══════════════════════════════════════════════════════════════════
// PIPELINE CONTACTS — gestão da esteira
// ══════════════════════════════════════════════════════════════════

// Listar clientes na esteira (com filtro de status)
router.get("/pipeline/contacts", auth, async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const list = await PipelineContact.find(filter)
    .sort({ enteredAt: -1 })
    .limit(200);
  res.json(list);
});

// Métricas da esteira para o dashboard
router.get("/pipeline/metrics", auth, async (_req, res) => {
  const [onboarding, week1, week2, week3, renewed, ended, total] = await Promise.all([
    PipelineContact.countDocuments({ status: "onboarding" }),
    PipelineContact.countDocuments({ status: "week1" }),
    PipelineContact.countDocuments({ status: "week2" }),
    PipelineContact.countDocuments({ status: "week3" }),
    PipelineContact.countDocuments({ status: "renewed" }),
    PipelineContact.countDocuments({ status: "ended" }),
    PipelineContact.countDocuments({}),
  ]);
  res.json({ onboarding, week1, week2, week3, renewed, ended, total });
});

// Adicionar cliente à esteira (dispara onboarding)
router.post("/pipeline/contacts", auth, async (req, res) => {
  const { contactId, phoneE164, name } = req.body;
  if (!phoneE164) return res.status(400).json({ error: "phoneE164_required" });

  // Verificar se já está na esteira
  const existing = await PipelineContact.findOne({ contactId, status: { $nin: ["ended"] } });
  if (existing) return res.status(409).json({ error: "already_in_pipeline", pipeline: existing });

  const enteredAt = new Date();
  const pc = await PipelineContact.create({
    contactId, phoneE164, name: name || "",
    enteredAt, status: "onboarding",
  });

  // Verificar se onboarding está ativo
  const cfg = await OnboardingConfig.findOne();
  if (cfg?.active && cfg.steps?.length > 0) {
    const delayMs = (cfg.delayMin || 30) * 60 * 1000;
    const job = await queue.add(
      "pipeline-onboarding",
      { pipelineContactId: String(pc._id) },
      { delay: delayMs, attempts: 3, backoff: { type: "exponential", delay: 5000 } }
    );
    await PipelineContact.findByIdAndUpdate(pc._id, { onboardingBullJobId: String(job.id) });
  }

  await Audit.create({
    who: req.user.email, action: "PIPELINE_ADD",
    entity: String(pc._id), detail: `${name || phoneE164} entrou na esteira`, ok: true,
  });

  res.json(pc);
});

// Marcar cliente como renovado (reinicia esteira)
router.post("/pipeline/contacts/:id/renew", auth, async (req, res) => {
  const pc = await PipelineContact.findById(req.params.id);
  if (!pc) return res.status(404).json({ error: "not_found" });

  const now = new Date();
  await PipelineContact.findByIdAndUpdate(req.params.id, {
    status: "onboarding",
    currentWeek: 0,
    enteredAt: now,
    renewedAt: now,
    weeksSent: [],
    onboardingBullJobId: "",
  });

  // Disparar onboarding novamente
  const cfg = await OnboardingConfig.findOne();
  if (cfg?.active && cfg.steps?.length > 0) {
    const delayMs = (cfg.delayMin || 30) * 60 * 1000;
    const job = await queue.add(
      "pipeline-onboarding",
      { pipelineContactId: pc._id.toString() },
      { delay: delayMs, attempts: 3 }
    );
    await PipelineContact.findByIdAndUpdate(req.params.id, { onboardingBullJobId: String(job.id) });
  }

  await Audit.create({
    who: req.user.email, action: "PIPELINE_RENEW",
    entity: String(pc._id), detail: `${pc.name || pc.phoneE164} renovou`, ok: true,
  });

  res.json({ ok: true });
});

// Encerrar cliente da esteira
router.post("/pipeline/contacts/:id/end", auth, async (req, res) => {
  await PipelineContact.findByIdAndUpdate(req.params.id, {
    status: "ended", endedAt: new Date(),
  });
  res.json({ ok: true });
});

// Remover da esteira
router.delete("/pipeline/contacts/:id", auth, async (req, res) => {
  await PipelineContact.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ── Audit ─────────────────────────────────────────────────────────
router.get("/audit", auth, async (_req, res) =>
  res.json(await Audit.find({}).sort({ at: -1 }).limit(200))
);

export default router;

