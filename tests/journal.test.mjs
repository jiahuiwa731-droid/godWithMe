import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyDay, localDate, validDay, parseDay } from "../lib/journal.ts";

test("local journal dates do not shift to UTC and invalid dates are rejected", () => {
  assert.equal(localDate(new Date(2026, 9, 2, 23, 59)), "2026-10-02");
  assert.equal(validDay("2024-02-29"), true);
  assert.equal(validDay("2026-02-29"), false);
  assert.equal(validDay("2026-13-01"), false);
  assert.equal(validDay(""), false);
});
test("morning actions and evening notes survive storage with both languages", () => {
  const morning = emptyDay();
  morning.items.push({id:"a",text:"专心完成报告 / Finish report",done:false});
  const evening = parseDay(JSON.stringify(morning));
  evening.items[0].done = true;
  evening.accomplishments = "Finished the report. 和家人散步。";
  evening.gratitude = "Thankful for encouragement. 感恩。";
  assert.deepEqual(parseDay(JSON.stringify(evening)), evening);
  assert.equal(morning.items[0].done,false);
});
test("different days stay separate and missing data starts empty", () => {
  const storage = new Map();
  const day = emptyDay(); day.items.push({id:"one",text:"A real step",done:true});
  storage.set("2026-10-02",JSON.stringify(day));
  assert.equal(parseDay(storage.get("2026-10-02") || null).items.length,1);
  assert.deepEqual(parseDay(storage.get("2026-10-03") || null),emptyDay());
});
test("corrupt saved records fail explicitly instead of silently losing entries", () => {
  for (const raw of ["broken", "null", '{"items":[{}],"accomplishments":"","gratitude":""}', '{"items":[],"accomplishments":4,"gratitude":""}']) assert.throws(()=>parseDay(raw));
});
