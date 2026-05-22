import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";

import { connectDb } from "./db.js";
import routes from "./routes.js";
import { User, Template } from "./models.js";

const app = express();
app.use(cors());
app.use(express.json());

await connectDb(process.env.MONGO_URL);

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (adminEmail && adminPassword) {
  const exists = await User.findOne({ email: adminEmail });
  if (!exists) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await User.create({ email: adminEmail, passwordHash, role: "admin" });
    console.log("✅ Admin criado:", adminEmail);
  }
}

const templatesCount = await Template.countDocuments({});
if (templatesCount === 0) {
  await Template.create([
    { name: "Confirmação", body: "Olá {{nome}}! ✅ Confirmando seu horário.", vars: ["nome"] },
    { name: "Follow-up", body: "Oi {{nome}}! Posso te ajudar em algo? 😊", vars: ["nome"] },
  ]);
}

app.use("/api", routes);
app.get("/health", (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ API online :${port}`));
