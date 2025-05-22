// src/index.ts
import express from "express";
import path from "path";
import { getFirstFreeSlots, bookSlot } from "./calendar";
import { config } from "dotenv";
config();

const app = express();

// 1) JSON body parsing for webhook & function calls
app.use(express.json());

// 2) Serve everything in /public as static (fall-back)
app.use(express.static(path.join(__dirname, "../public")));

// 2b) Guarantee /web-call.html even if static-mount fails
app.get("/web-call.html", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/web-call.html"));
});

// 3) Healthcheck on /
app.get("/", (_req, res) => {
  res.send("Hello, ABC Mortgage voice agent backend!");
});

// 4) Webhook endpoint for Retell
app.post("/retell/webhook", (req, res) => {
  console.log("🔔 Webhook received:", req.body);
  res.sendStatus(200);
});

// 5) Fetch availability (Function node)
app.post("/availability", async (req, res) => {
  console.log("📅 GET /availability", req.body);
  try {
    const slots = await getFirstFreeSlots(30, 3);
    res.json({ slots });
  } catch (e: any) {
    console.error("❌ /availability error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// 6) Book a slot (Function node)
app.post("/book", async (req, res) => {
  console.log("📅 POST /book", req.body);
  const { slot, lead } = req.body;
  try {
    await bookSlot(slot, lead);
    res.json({ success: true });
  } catch (e: any) {
    console.error("❌ /book error:", e.response?.data || e.message);
    res
      .status(500)
      .json({ error: e.response?.data || e.message });
  }
});

// 7) Start server
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
