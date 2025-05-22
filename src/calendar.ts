import axios from "axios";
import { config } from "dotenv";
import { DateTime } from "luxon";
import { getTimeZonesForNumber } from "./tz-util";
config();

const BASE_V1 = "https://api.cal.com/v1";
const BASE_V2 = "https://api.cal.com/v2";

export interface Slot {
  start: string; // ISO 8601 UTC
  end:   string;
}
export interface LeadMeta {
  name:  string;
  email: string;
  phone?: string;
}

function apiKey() {
  const key = process.env.CALCOM_API_KEY;
  if (!key) throw new Error("Missing CALCOM_API_KEY");
  return key;
}

/**
 * Fetch the next `count` free slots and convert them into the lead’s local zone
 * (best-guess from their phone number). Returns both the raw UTC slots and
 * “spoken” HH:MM strings you can read out.
 */
export async function getFirstFreeSlots(
  durationMin = 30,
  count       = 3,
  leadPhone?: string
): Promise<{ spoken: string[]; raw: Slot[] }> {

  const now  = new Date();
  const from = new Date(now.getTime() + 60 * 60 * 1000).toISOString();            // +1 h
  const to   = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();  // +14 d

  const params = {
    apiKey:       apiKey(),
    eventTypeId:  process.env.CAL_EVENT_TYPE_ID,
    startTime:    from,
    endTime:      to,
    timeZone:     "UTC",
  };

  console.log("[Calendar] GET /slots params:", params);

  const res = await axios.get<{ slots: Record<string, { time: string }[]> }>(
    `${BASE_V1}/slots`,
    { params }
  );

  // Flatten the date → times mapping
  const allTimes = Object.values(res.data.slots)
    .flat()
    .map((entry) => entry.time)
    .slice(0, count);

  const raw: Slot[] = allTimes.map((t) => {
    const start = new Date(t);
    return {
      start: start.toISOString(),
      end:   new Date(start.getTime() + durationMin * 60_000).toISOString(),
    };
  });

  // —— time-zone conversion ——————————————————————————————
  const tz = getTimeZonesForNumber(leadPhone)[0] ?? "UTC";
  const spoken = raw.map(({ start }) =>
    DateTime.fromISO(start, { zone: "utc" })
      .setZone(tz)
      .toLocaleString(DateTime.TIME_SIMPLE)        // e.g. “11:00 AM”
  );

  return { spoken, raw };
}

/**
 * Book a single slot for the lead.
 */
export async function bookSlot(slot: Slot, lead: LeadMeta): Promise<void> {
  const body = {
    start: slot.start,
    attendee: {
      name:        lead.name,
      email:       lead.email,
      timeZone:    "UTC",
      phoneNumber: lead.phone ?? "unknown",
      language:    "en",
    },
    metadata:      {},
    eventTypeSlug: process.env.CAL_EVENT_TYPE_SLUG,
    username:      process.env.CALCOM_USERNAME,
  };

  console.log("[Calendar] POST v2 /bookings body:", body);

  await axios.post(`${BASE_V2}/bookings`, body, {
    headers: {
      Authorization:     `Bearer ${apiKey()}`,
      "Content-Type":    "application/json",
      "cal-api-version": "2024-08-13",
    },
  });

  console.log("[Calendar] v2 booking succeeded");
}
