import nock from "nock";
import {
  getFirstFreeSlots,
  bookSlot,
  Slot,
} from "../src/calendar";

const API_V1 = "https://api.cal.com/v1";
const API_V2 = "https://api.cal.com/v2";

beforeAll(() => {
  process.env.CALCOM_API_KEY    = "testkey";
  process.env.CAL_EVENT_TYPE_ID = "12345";
  process.env.CAL_EVENT_TYPE_SLUG = "loan";
  process.env.CALCOM_USERNAME   = "abc-mortgage";
});

describe("calendar – happy-path slots", () => {
  it("fetches first 3 slots and returns spoken times", async () => {
    // Mock v1 /slots response (date → times mapping)
    nock(API_V1)
      .get("/slots")
      .query(true)
      .reply(200, {
        slots: {
          "2025-05-22": [
            { time: "2025-05-22T09:00:00Z" },
            { time: "2025-05-22T10:00:00Z" },
            { time: "2025-05-22T11:00:00Z" },
            { time: "2025-05-22T12:00:00Z" },
          ],
        },
      });

    const { raw, spoken } = await getFirstFreeSlots(30, 3, "+14155550123");
    expect(raw).toHaveLength(3);
    expect(spoken[0]).toBe("5:00 AM");   // 09:00 UTC == 05:00 AM EDT (NY)
  });
});

describe("calendar – Cal.com 500 failure bubble", () => {
  it("throws on upstream 500", async () => {
    nock(API_V1).get("/slots").query(true).reply(500);

    await expect(
      getFirstFreeSlots(30, 1, "+14155550123")
    ).rejects.toThrow();
  });
});

describe("calendar – booking", () => {
  it("posts to v2 /bookings", async () => {
    const slot: Slot = {
      start: "2025-05-22T09:00:00Z",
      end:   "2025-05-22T09:30:00Z",
    };

    nock(API_V2)
      .post("/bookings")
      .reply(200, {});

    await expect(
      bookSlot(slot, { name: "Jane", email: "jane@x.com" })
    ).resolves.toBeUndefined();
  });
});
