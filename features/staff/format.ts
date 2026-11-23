/** "just now", "12 min", "3 h", "2 d" — short enough for a table cell. */
export function timeAgo(ms: number, now = Date.now()) {
  const minutes = Math.floor((now - ms) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

export function clockTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function dateTime(ms: number) {
  return new Date(ms).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/** Clock time for today, otherwise the date: "9:19 PM" or "Nov 21". */
export function when(ms: number, now = new Date()) {
  const d = new Date(ms);
  return d.toDateString() === now.toDateString() ? clockTime(ms) : d.toLocaleDateString([], { month: "short", day: "numeric" });
}
