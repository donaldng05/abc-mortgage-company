import axios from "axios";
import { config } from "dotenv";
config();

const BASE = "https://api.cal.com/v1";

export interface Slot { start: string; end: string }
export interface LeadMeta { name: string; email: string }

function apiParams() {
  const key = process.env.CALCOM_API_KEY;
  if (!key) throw new Error("Missing CALCOM_API_KEY");
  return { apiKey: key };
}

/**
 * Fetch the next `count` free 30-min slots.
 */
export async function getFirstFreeSlots(
  durationMin = 30,
  count = 3
): Promise<Slot[]> {
  const now = new Date();
  const from = new Date(now.getTime() + 60*60*1000).toISOString();
  const to   = new Date(now.getTime() + 14*24*60*60*1000).toISOString();

  const params = {
    ...apiParams(),
    eventTypeId: process.env.CAL_EVENT_TYPE_ID,
    startTime: from,
    endTime: to,
    timeZone: "UTC",
  };

  console.log("[Calendar] getFirstFreeSlots() calling /slots with params:", params);
  try {
    const res = await axios.get<{ slots: Record<string, { time: string }[]> }>(
      `${BASE}/slots`,
      { params }
    );

    // Flatten the date→array mapping into a single list of times
    const allTimes = Object.values(res.data.slots)
      .flat()
      .map(entry => entry.time);

    // Build start/end pairs
    const slots: Slot[] = allTimes.map(t => {
      const startDate = new Date(t);
      return {
        start: startDate.toISOString(),
        end:   new Date(startDate.getTime() + durationMin * 60000).toISOString()
      };
    });

    console.log(
      `[Calendar] getFirstFreeSlots() flattened to ${slots.length} slots`,
      slots.slice(0, count)
    );
    return slots.slice(0, count);

  } catch (err: any) {
    console.error(
      "[Calendar] getFirstFreeSlots() error:",
      err.response?.data || err.message
    );
    throw err;
  }
}

/**
 * Book a single slot for your lead.
 */
export async function bookSlot(slot: Slot, lead: LeadMeta): Promise<void> {
  const body = {
    start:            slot.start,
    attendee: {
      name:        lead.name,
      email:       lead.email,
      timeZone:    "UTC",
      phoneNumber: "userPhone",  // or lead’s real phone if you capture it
      language:    "en"
    },
    metadata:         {},
    eventTypeSlug:    process.env.CAL_EVENT_TYPE_SLUG,  
    username:         process.env.CALCOM_USERNAME       
  };

  console.log("[Calendar] POST v2 /bookings body:", body);
  await axios.post(
    "https://api.cal.com/v2/bookings",
    body,
    {
      headers: {
        Authorization:   `Bearer ${process.env.CALCOM_API_KEY}`,
        "Content-Type":  "application/json",
        "cal-api-version":"2024-08-13"
      }
    }
  );
  console.log("[Calendar] v2 booking succeeded");
}




