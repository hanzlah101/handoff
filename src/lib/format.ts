const UNITS = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3600],
  ["minute", 60],
] as const satisfies readonly [Intl.RelativeTimeFormatUnit, number][];

const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

// "3 minutes ago", "yesterday", "just now".
export function formatRelativeTime(date: Date, now = new Date()) {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const match = UNITS.find(([, size]) => Math.abs(seconds) >= size);

  if (match === undefined) {
    return "just now";
  }

  const [unit, size] = match;
  return relativeTime.format(Math.round(seconds / size), unit);
}
