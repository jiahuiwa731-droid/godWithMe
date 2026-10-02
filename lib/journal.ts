export type ActionItem = { id: string; text: string; done: boolean };
export type DayRecord = { items: ActionItem[]; accomplishments: string; gratitude: string };
export const emptyDay = (): DayRecord => ({ items: [], accomplishments: "", gratitude: "" });
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function validDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && localDate(date) === value;
}
export function parseDay(raw: string | null): DayRecord {
  if (!raw) return emptyDay();
  const data = JSON.parse(raw);
  if (!data || !Array.isArray(data.items) || typeof data.accomplishments !== "string" || typeof data.gratitude !== "string" || !data.items.every((item: ActionItem) => item && typeof item.id === "string" && typeof item.text === "string" && typeof item.done === "boolean")) throw new Error("Invalid journal record");
  return { items: data.items, accomplishments: data.accomplishments, gratitude: data.gratitude };
}
