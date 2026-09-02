export type Milliseconds = number & { readonly __brand: "Milliseconds" };

export const Time = {
  ms: (n: number) => n as Milliseconds,
  second: (n: number) => (n * 1_000) as Milliseconds,
  minute: (n: number) => (n * 60_000) as Milliseconds,
  hour: (n: number) => (n * 3_600_000) as Milliseconds,
  day: (n: number) => (n * 86_400_000) as Milliseconds,
} as const;

export function formatDate(date: Date) {
  const d = new Date(date);
  const result = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);

  return result;
}
