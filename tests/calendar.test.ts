import nock from "nock";
import { getFirstFreeSlots, bookSlot } from "../src/calendar";

const API = "https://api.cal.com/v1";

describe("calendar.ts", () => {
  beforeAll(() => {
    process.env.CALCOM_API_KEY    = "testkey";  // <-- use CALCOM_API_KEY
    process.env.CAL_EVENT_TYPE_ID = "12345";
  });

  it("fetches first 3 slots", async () => {
    nock(API)
      .get("/slots")
      .query(true)
      .reply(200, {
        slots: [
          { start: "2025-05-22T09:00:00Z", end: "2025-05-22T09:30:00Z" },
          { start: "2025-05-22T10:00:00Z", end: "2025-05-22T10:30:00Z" },
          { start: "2025-05-22T11:00:00Z", end: "2025-05-22T11:30:00Z" },
          { start: "x", end: "y" }
        ]
      });

    const slots = await getFirstFreeSlots(30, 3);
    expect(slots).toHaveLength(3);
    expect(slots[0].start).toBe("2025-05-22T09:00:00Z");
  });

  it("books a slot", async () => {
    const slot = { start: "s", end: "e" };
    nock(API)
      .post("/bookings", body => body.eventTypeId === 12345)
      .query(true)
      .reply(200, {});

    await expect(bookSlot(slot, { name: "Jane", email: "jane@x.com" }))
      .resolves.toBeUndefined();
  });
});
