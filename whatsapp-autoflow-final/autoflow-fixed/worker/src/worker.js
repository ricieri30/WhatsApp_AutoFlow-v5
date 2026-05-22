import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import mongoose from "mongoose";
import fetch from "node-fetch";

const connection = new IORedis({ host: process.env.REDIS_HOST, maxRetriesPerRequest: null });
await mongoose.connect(process.env.MONGO_URL);

const Recurring        = mongoose.model("Recurring",        new mongoose.Schema({}, { strict: false }), "recurrings");
const Contact          = mongoose.model("Contact",          new mongoose.Schema({}, { strict: false }), "contacts");
const Template         = mongoose.model("Template",         new mongoose.Schema({}, { strict: false }), "templates");
const Audit            = mongoose.model("Audit",            new mongoose.Schema({}, { strict: false }), "audits");
const ScheduledMessage = mongoose.model("ScheduledMessage", new mongoose.Schema({}, { strict: false }), "scheduledmessages");

const MIN_DELAY = Math.max(0, parseInt(process.env.MIN_MESSAGE_DELAY_MS || "0", 10));
const JITTER    = Math.max(0, parseInt(process.env.JITTER_MS            || "0", 10));

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function computeDelayMs() {
  if (MIN_DELAY === 0 && JITTER === 0) return 0;
  return MIN_DELAY + (JITTER ? Math.floor(Math.random() * (JITTER + 1)) : 0);
}
function withinQuietHours(quiet, now = new Date()) {
  if (!quiet?.start || !quiet?.end) return false;
  const [sh, sm] = quiet.start.split(":").map(Number);
  const [eh, em] = quiet.end.split(":").map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = sh * 60 + sm, end = eh * 60 + em;
  return start > end ? (cur >= start || cur < end) : (cur >= start && cur < end);
}
function renderTemplate(body, vars = {}) {
  return (body || "").replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}
async function sendText(phoneE164, text) {
  const resp = await fetch(`${process.env.WA_GATEWAY_URL}/send`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: phoneE164, text }),
  });
  if (!resp.ok) { const p = await resp.text(); throw new Error(`gateway_${resp.status}:${p}`); }
  return resp.json();
}

new Worker("wa-scheduler", async (job) => {

  // ── Mensagem agendada pontual ─────────────────────────────────
  if (job.name === "send-scheduled") {
    const { scheduledId } = job.data;
    const msg = await ScheduledMessage.findById(scheduledId);
    if (!msg)                        { console.log(`skip: not found ${scheduledId}`); return; }
    if (msg.status === "cancelled")  { console.log(`skip: cancelled ${scheduledId}`); return; }
    try {
      await sendText(msg.phoneE164, msg.message);
      await ScheduledMessage.findByIdAndUpdate(scheduledId, { status: "sent", sentAt: new Date() });
      await Audit.create({ who: "system", action: "EXEC_SCHEDULED", entity: String(msg._id), detail: `Enviou para ${msg.phoneE164}`, ok: true });
      console.log(`✅ scheduled → ${msg.phoneE164}`);
    } catch (err) {
      await ScheduledMessage.findByIdAndUpdate(scheduledId, { status: "failed", errorMessage: err.message });
      await Audit.create({ who: "system", action: "FAIL_SCHEDULED", entity: String(msg._id), detail: err.message, ok: false });
      throw err;
    }
    return;
  }

  // ── Notificações de assinatura (job diário) ───────────────────
  if (job.name === "check-subscriptions") {
    const n7   = process.env.NOTICE_7D    || "Olá {{nome}}! Sua assinatura vence em 7 dias.";
    const n1   = process.env.NOTICE_1D    || "Atenção {{nome}}! Sua assinatura vence amanhã.";
    const n0   = process.env.NOTICE_TODAY || "Olá {{nome}}! Sua assinatura expira hoje.";
    const today = new Date(); today.setHours(0,0,0,0);
    const d = (n) => { const d = new Date(today); d.setDate(d.getDate()+n); return d; };

    const groups = [
      { contacts: await Contact.find({ subscriptionEnd: { $gte: today, $lt: d(1) }, optIn:true }), tpl: n0 },
      { contacts: await Contact.find({ subscriptionEnd: { $gte: d(1), $lt: d(2) }, optIn:true }), tpl: n1 },
      { contacts: await Contact.find({ subscriptionEnd: { $gte: d(7), $lt: d(8) }, optIn:true }), tpl: n7 },
    ];

    let total = 0;
    for (const { contacts, tpl } of groups) {
      for (const c of contacts) {
        try { await sendText(c.phoneE164, renderTemplate(tpl, { nome: c.name||"" })); total++; const dly=computeDelayMs(); if(dly>0) await sleep(dly); } catch {}
      }
    }
    await Audit.create({ who:"system", action:"CHECK_SUBSCRIPTIONS", entity:"daily", detail:`${total} notificações`, ok:true });
    console.log(`🔔 subscriptions check: ${total} msgs`);
    return;
  }

  // ── Recorrência ───────────────────────────────────────────────
  const { recurringId } = job.data;
  const rec = await Recurring.findById(recurringId);
  if (!rec || !rec.enabled) return;
  if (withinQuietHours(rec.quietHours)) {
    await Audit.create({ who:"system", action:"SKIP_QUIET_HOURS", entity:String(rec._id), detail:`${rec.quietHours.start}-${rec.quietHours.end}`, ok:true });
    return;
  }
  const tpl = await Template.findById(rec.templateId);
  if (!tpl) throw new Error("template_not_found");

  let targets = [];
  if      (rec.targetType === "phone")   targets = [{ phoneE164: rec.targetValue, name: "" }];
  else if (rec.targetType === "contact") { const c = await Contact.findById(rec.targetValue); if(c) targets=[c]; }
  else                                   targets = await Contact.find({ tags: rec.targetValue, optIn:true }).limit(500);

  targets = targets.slice(0, Math.max(1, rec.throttlePerMinute||10));
  let sent = 0;
  for (const c of targets) {
    if (!c?.phoneE164) continue;
    await sendText(c.phoneE164, renderTemplate(tpl.body, { nome: c.name||"" }));
    sent++;
    const dly = computeDelayMs(); if(dly>0) await sleep(dly);
  }
  await Audit.create({ who:"system", action:"EXEC_RECURRING", entity:String(rec._id), detail:`${rec.name} — ${sent} msgs`, ok:true });
  console.log(`✅ recurring "${rec.name}" → ${sent}`);

}, { connection, concurrency: 2 });

console.log("✅ Worker online");
