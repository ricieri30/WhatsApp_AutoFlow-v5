import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, index: true },
  passwordHash: String,
  role: { type: String, enum: ["admin", "operator", "viewer"], default: "admin" },
  createdAt: { type: Date, default: Date.now },
});

const ContactSchema = new mongoose.Schema({
  name: String,
  phoneE164: { type: String, index: true },
  tags: { type: [String], default: [] },
  optIn: { type: Boolean, default: true },
  // ── Assinatura ──────────────────────────────────────────────────
  subscriptionStart: { type: Date, default: null },
  subscriptionEnd:   { type: Date, default: null, index: true },
  subscriptionNotes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const TemplateSchema = new mongoose.Schema({
  name: String,
  body: String,
  vars: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

const RecurringSchema = new mongoose.Schema({
  name: String,
  enabled: { type: Boolean, default: true },
  targetType: { type: String, enum: ["tag", "phone", "contact"], default: "tag" },
  targetValue: String,
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: "Template" },
  pattern: String,
  tz: { type: String, default: "America/Sao_Paulo" },
  startDate: Date,
  endDate: Date,
  limit: Number,
  throttlePerMinute: { type: Number, default: 10 },
  quietHours: {
    start: { type: String, default: "21:00" },
    end: { type: String, default: "08:00" },
  },
  createdAt: { type: Date, default: Date.now },
});

// ── Mensagem Agendada (envio único em data/hora específica) ────────
const ScheduledMessageSchema = new mongoose.Schema({
  name: { type: String, default: "" },                        // Descrição/apelido
  phoneE164: { type: String, required: true },                // Destinatário
  contactName: { type: String, default: "" },                 // Nome do contato (cache)
  message: { type: String, required: true },                  // Texto da mensagem
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: "Template", default: null },
  scheduledAt: { type: Date, required: true, index: true },   // Quando enviar
  status: {
    type: String,
    enum: ["pending", "queued", "sent", "failed", "cancelled"],
    default: "pending",
    index: true,
  },
  sentAt: Date,
  errorMessage: String,
  bullJobId: String,    // ID do job no BullMQ para cancelamento
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
});

// ── Auto-Reply Rules ──────────────────────────────────────────────
const AutoReplySchema = new mongoose.Schema({
  keyword:     { type: String, required: true },
  reply:       { type: String, required: true },
  targetPhone: { type: String, default: "" },      // vazio = todos
  startTime:   { type: String, default: "00:00" },
  endTime:     { type: String, default: "23:59" },
  active:      { type: Boolean, default: true },
  createdBy:   { type: String, default: "admin" },
  createdAt:   { type: Date, default: Date.now },
});

const AuditSchema = new mongoose.Schema({
  at: { type: Date, default: Date.now },
  who: String,
  action: String,
  entity: String,
  detail: String,
  ok: Boolean,
});

export const User = mongoose.model("User", UserSchema);
export const Contact = mongoose.model("Contact", ContactSchema);
export const Template = mongoose.model("Template", TemplateSchema);
export const Recurring = mongoose.model("Recurring", RecurringSchema);
export const ScheduledMessage = mongoose.model("ScheduledMessage", ScheduledMessageSchema);
export const AutoReply = mongoose.model("AutoReply", AutoReplySchema);
export const Audit = mongoose.model("Audit", AuditSchema);

