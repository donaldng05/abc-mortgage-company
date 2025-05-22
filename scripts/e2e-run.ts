// scripts/e2e-run.ts
import fs from "fs/promises";
import path from "path";
import Retell from "retell-sdk";
import axios from "axios";
import { config } from "dotenv";
config();

const retell  = new Retell({ apiKey: process.env.RETELL_API_KEY! });
const CAL_KEY = process.env.CALCOM_API_KEY!;
const OUT_DIR = path.resolve("e2e-artifacts");

// Poll until the call ends
async function waitForCallEnded(
  callId: string,
  timeoutMs = 5 * 60_000,
  pollMs   = 5_000
) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const call: any = await retell.call.retrieve(callId);
    const status = call.call_status ?? call.status;
    if (status === "completed" || status === "ended" || call.end_timestamp) {
      return call;
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
  throw new Error(`Call ${callId} did not finish within ${timeoutMs} ms`);
}

// Return recording URL (or null).
async function getRecordingUrl(callId: string): Promise<string | null> {
  const call: any = await retell.call.retrieve(callId);
  return call.recording_url ?? null;
}

async function run() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const leads: { name: string; email: string; phone: string }[] = JSON.parse(
    await fs.readFile(path.resolve("scripts", "leads.json"), "utf8")
  );

  for (const lead of leads) {
    console.log(`\nCalling ${lead.name}`);

    // create the web call
    const resp: any = await (retell.call as any).createWebCall({
      agent_id:    process.env.RETELL_AGENT_ID!,
      webhook_url: process.env.RETELL_WEBHOOK!,
      metadata:    { lead },
    });

    // extract call_id + join token (now including access_token)
    const call_id      = resp.call_id ?? resp.callId;
    const client_token =
      resp.client_token ??
      resp.clientToken ??
      resp.token ??
      resp.access_token;   // <-- we now pick up the "access_token" field

    if (!call_id || !client_token) {
      console.error("❌ Missing call_id or client_token in response:", resp);
      process.exit(1);
    }

    // write join info for manual join via web-call.html
    const joinInfo = { call_id, client_token };
    const filename = `${lead.name.replace(/ /g, "_")}-join.json`;
    await fs.writeFile(
      path.join(OUT_DIR, filename),
      JSON.stringify(joinInfo, null, 2)
    );
    console.log(`   👉  join info written to ${filename}`);

    // wait for the call to complete
    await waitForCallEnded(call_id);

    // save recording URL
    const recordingUrl = await getRecordingUrl(call_id);
    if (recordingUrl) {
      await fs.writeFile(
        path.join(OUT_DIR, `${call_id}.mp3.url.txt`),
        recordingUrl
      );
      console.log("   🎙️ recording saved");
    }

    // verify the Cal.com booking
    const bookings = await axios.get(
      "https://api.cal.com/v2/bookings",
      {
        headers: { Authorization: `Bearer ${CAL_KEY}` },
        params:  { email: lead.email },
      }
    );
    console.log(
      bookings.data.data.length
        ? "   ✅ booking confirmed"
        : "   ❌ NO booking created"
    );
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
