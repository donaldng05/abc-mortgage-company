import { parsePhoneNumber } from "libphonenumber-js";

/**
 * Infer plausible Olson/IANA time-zones from a phone number.
 * For an MVP we only need a very coarse mapping.
 */
export function getTimeZonesForNumber(phone?: string): string[] {
  if (!phone) return ["UTC"];

  try {
    const pn = parsePhoneNumber(phone);
    switch (pn.country) {
      case "US":
      case "CA":
        // pick the Eastern zone first – can refine with an area-code map later
        return [
          "America/New_York",
          "America/Chicago",
          "America/Denver",
          "America/Los_Angeles",
        ];
      case "GB":
        return ["Europe/London"];
      case "AU":
        return ["Australia/Sydney"];
      default:
        return ["UTC"];
    }
  } catch {
    return ["UTC"];
  }
}
