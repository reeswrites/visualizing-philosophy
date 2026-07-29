/**
 * Tests for the localStorage shim that stands in for the artifact runtime's
 * window.storage. Run with: npm test
 */
import assert from "node:assert/strict";
import { installStorageShim } from "../src/storage-shim.js";

let pass = 0;
/* async-aware: a rejected promise from an async assertion must fail the test,
   not vanish into an unhandled rejection */
const ok = async (label, fn) => {
  try {
    await fn();
    pass++;
    console.log(`  \x1b[32m✓\x1b[0m ${label}`);
  } catch (e) {
    console.log(`  \x1b[31m✗\x1b[0m ${label}\n      ${e.message}`);
    process.exitCode = 1;
  }
};

function fakeWindow(broken = false) {
  const map = new Map();
  const ls = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      if (broken) throw new Error("QuotaExceededError");
      map.set(k, v);
    },
    removeItem: (k) => map.delete(k),
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
  return { localStorage: ls, _map: map };
}

console.log("\nStorage shim");

{
  const w = fakeWindow();
  global.window = w;
  installStorageShim();
  const s = w.storage;

  await ok("installs window.storage when absent", () => assert.ok(s));
  await ok("a missing key returns null", async () => assert.equal(await s.get("nope"), null));

  const set = await s.set("bag", '["ahimsa"]');
  await ok("set echoes the value back", () => assert.equal(set.value, '["ahimsa"]'));
  const got = await s.get("bag");
  await ok("what goes in comes out", () => assert.equal(got.value, '["ahimsa"]'));
  await ok("the returned shape matches the runtime API", () =>
    assert.deepEqual(Object.keys(got).sort(), ["key", "shared", "value"]));

  await s.set("builds", "[]");
  const listed = await s.list("b");
  await ok("list finds keys by prefix", () => assert.equal(listed.keys.length, 2));
  await ok("list strips the internal namespace", () => assert.ok(listed.keys.every((k) => !k.includes("belief-mart:"))));
  const none = await s.list("zzz");
  await ok("a prefix matching nothing lists nothing", () => assert.equal(none.keys.length, 0));

  await s.delete("bag");
  await ok("delete removes the key", async () => assert.equal(await s.get("bag"), null));

  await ok("keys are namespaced so the app can't collide with other pages", () =>
    assert.ok([...w._map.keys()].every((k) => k.startsWith("belief-mart:"))));
  await ok("numbers are coerced to strings like the real API", async () => {
    await s.set("n", 42);
    assert.strictEqual((await s.get("n")).value, "42");
  });
}

{
  /* private browsing, quota exceeded, storage disabled by policy */
  const w = fakeWindow(true);
  global.window = w;
  installStorageShim();
  const s = w.storage;
  await ok("falls back to memory when localStorage throws", async () => {
    await s.set("x", "1");
    assert.equal((await s.get("x")).value, "1");
  });
  await ok("the fallback never touches the broken backend", () => assert.equal(w._map.size, 0));
}

{
  /* the artifact runtime provides its own — don't clobber it */
  const real = { get: async () => ({ key: "k", value: "runtime", shared: false }) };
  global.window = { storage: real, localStorage: fakeWindow().localStorage };
  installStorageShim();
  await ok("an existing window.storage is left alone", () => assert.equal(global.window.storage, real));
}

console.log(`\n${process.exitCode ? "\x1b[31m" : "\x1b[32m"}${pass} passed\x1b[0m\n`);
