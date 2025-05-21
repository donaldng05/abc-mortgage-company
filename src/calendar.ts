// src/calendar.ts
import axios from "axios";

const BASE = "https://api.cal.com/v1";

export interface Slot { start: string; end: string }
export interface LeadMeta { name: string; email: string }

/**
 * Fetch the next `count` free 30-min slots from tomorrow onward.
 */
export async function getFirstFreeSlots(
  durationMin = 30,
  count = 3
): Promise<Slot[]> {
  const now = new Date();
  const from = new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString();
  const to = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const res = await axios.get<{ slots: Slot[] }>(`${BASE}/slots`, {
    params: {
      apiKey: process.env.CALCOM_API_KEY,            // <-- updated
      eventTypeId: process.env.CAL_EVENT_TYPE_ID,
      startTime: from,
      endTime: to,
      timeZone: "UTC",
    },
  });

  return res.data.slots.slice(0, count);
}

/**
 * Book a single slot for your lead.
 */
export async function bookSlot(
  slot: Slot,
  lead: LeadMeta
): Promise<void> {
  await axios.post(
    `${BASE}/bookings`,
    {
      eventTypeId: Number(process.env.CAL_EVENT_TYPE_ID),
      start: slot.start,
      end: slot.end,
      timeZone: "UTC",
      responses: {
        name: lead.name,
        email: lead.email,
        location: { value: "userPhone", optionValue: "" },
      },
      status: "PENDING",
      title: `Callback between ABC Mortgage and ${lead.name}`,
    },
    {
      params: { apiKey: process.env.CALCOM_API_KEY }, // <-- updated
    }
  );
}
