import assert from "node:assert/strict";
import { afterAll, beforeEach, expect, mock, test } from "bun:test";

const refreshToken = mock(async () => ({ success: true }));
const clearUserData = mock(() => {});
mock.module("../lib/api/auth", () => ({ refreshToken, clearUserData }));
mock.module("../lib/device", () => ({ getDeviceID: async () => "test-device" }));
const { fetchWithAuth, clearCSRFToken } = await import("../lib/api/fetch-wrapper");
const originalFetch = globalThis.fetch;
afterAll(() => {
  globalThis.fetch = originalFetch;
});
beforeEach(() => {
  clearCSRFToken();
  refreshToken.mockClear();
  refreshToken.mockImplementation(async () => ({ success: true }));
  clearUserData.mockClear();
});

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function installFetch(handler) {
  globalThis.fetch = async (input, init) => handler(String(input), init);
}
function csrfResponse(token) {
  return Response.json({ data: { csrfToken: token } });
}

test("concurrent 401s share one auth and CSRF refresh", async () => {
  const started = deferred();
  const release = deferred();
  refreshToken.mockImplementation(async () => {
    started.resolve();
    await release.promise;
    return { success: true };
  });
  const calls = new Map();
  let csrfCalls = 0;
  installFetch((url) => {
    if (url.endsWith("/csrf-token")) {
      csrfCalls++;
      return csrfResponse("new-token");
    }
    const count = (calls.get(url) ?? 0) + 1;
    calls.set(url, count);
    return Response.json({}, { status: count === 1 ? 401 : 200 });
  });
  const requests = ["one", "two", "three"].map((id) => fetchWithAuth(`https://test/${id}`));
  await started.promise;
  release.resolve();
  const results = await Promise.all(requests);
  expect(results.map((result) => result.status)).toEqual([200, 200, 200]);
  expect(refreshToken).toHaveBeenCalledTimes(1);
  expect(csrfCalls).toBe(1);
  expect([...calls.values()]).toEqual([2, 2, 2]);
});

test("a late 401 reuses the completed refresh", async () => {
  const late = deferred();
  const counts = new Map();
  installFetch((url) => {
    if (url.endsWith("/csrf-token")) return csrfResponse("new-token");
    const count = (counts.get(url) ?? 0) + 1;
    counts.set(url, count);
    if (count === 1 && url.endsWith("/slow")) return late.promise;
    return Response.json({}, { status: count === 1 ? 401 : 200 });
  });
  const slow = fetchWithAuth("https://test/slow");
  expect((await fetchWithAuth("https://test/fast")).status).toBe(200);
  late.resolve(Response.json({}, { status: 401 }));
  expect((await slow).status).toBe(200);
  expect(refreshToken).toHaveBeenCalledTimes(1);
});

test("parallel and late CSRF rejections reuse a single refreshed token", async () => {
  const late = deferred();
  const calls = new Map();
  let csrfCalls = 0;
  installFetch((url) => {
    if (url.endsWith("/csrf-token")) return csrfResponse(`token-${++csrfCalls}`);
    const count = (calls.get(url) ?? 0) + 1;
    calls.set(url, count);
    if (count === 1 && url.endsWith("/slow")) return late.promise;
    return Response.json({ message: "CSRF token expired" }, { status: count === 1 ? 403 : 200 });
  });
  const slow = fetchWithAuth("https://test/slow", { method: "POST", body: "payload" });
  const results = await Promise.all(
    ["one", "two"].map((id) => fetchWithAuth(`https://test/${id}`, { method: "POST" })),
  );
  late.resolve(Response.json({ message: "CSRF token expired" }, { status: 403 }));
  expect((await slow).status).toBe(200);
  expect(results.map((result) => result.status)).toEqual([200, 200]);
  expect(csrfCalls).toBe(2); // Initial token plus one recovery.
  expect(refreshToken).not.toHaveBeenCalled();
});

test("validation failures and network failures do not replay writes", async () => {
  let writes = 0;
  installFetch((url) => {
    if (url.endsWith("/csrf-token")) return csrfResponse("token");
    writes++;
    return Response.json({ message: "meaningful_text" }, { status: 400 });
  });
  expect((await fetchWithAuth("https://test/messages", { method: "POST" })).status).toBe(400);
  expect(writes).toBe(1);
  installFetch(() => {
    writes++;
    throw new TypeError("response lost");
  });
  await expect(fetchWithAuth("https://test/messages", { method: "POST" })).rejects.toThrow(
    "response lost",
  );
  expect(writes).toBe(2);
  expect(refreshToken).not.toHaveBeenCalled();
});

test("aborting a caller during shared recovery prevents its replay", async () => {
  const started = deferred();
  const release = deferred();
  const controller = new AbortController();
  let reads = 0;
  refreshToken.mockImplementation(async () => {
    started.resolve();
    await release.promise;
    return { success: true };
  });
  installFetch((url) => {
    if (url.endsWith("/csrf-token")) return csrfResponse("token");
    reads++;
    return Response.json({}, { status: 401 });
  });
  const request = fetchWithAuth("https://test/data", { signal: controller.signal });
  const rejected = assert.rejects(request);
  await started.promise;
  controller.abort();
  release.resolve();
  await rejected;
  expect(reads).toBe(1);
  expect(clearUserData).not.toHaveBeenCalled();
});

test("a revoked session stops after one auth replay", async () => {
  let reads = 0;
  installFetch((url) => {
    if (url.endsWith("/csrf-token")) return csrfResponse("token");
    reads++;
    return Response.json({}, { status: 401 });
  });
  expect((await fetchWithAuth("https://test/revoked")).status).toBe(401);
  expect(reads).toBe(2);
  expect(refreshToken).toHaveBeenCalledTimes(1);
  expect(clearUserData).toHaveBeenCalledTimes(1);
});

test("disabled auth recovery returns the original rejection", async () => {
  installFetch(() => Response.json({}, { status: 401 }));
  expect((await fetchWithAuth("https://test/no-recovery", undefined, false)).status).toBe(401);
  expect(refreshToken).not.toHaveBeenCalled();
});

test("failed shared recovery expires the session once without replaying writes", async () => {
  const started = deferred();
  const release = deferred();
  refreshToken.mockImplementation(async () => {
    started.resolve();
    await release.promise;
    throw new Error("refresh rejected");
  });
  let calls = 0;
  installFetch((url) => {
    if (url.endsWith("/csrf-token")) return csrfResponse("token");
    calls++;
    return Response.json({}, { status: 401 });
  });
  const requests = ["one", "two"].map((id) =>
    fetchWithAuth(`https://test/${id}`, { method: "POST" }),
  );
  await started.promise;
  release.resolve();
  expect((await Promise.all(requests)).map((result) => result.status)).toEqual([401, 401]);
  // A late rejection also must not start a new refresh while leaving this session.
  expect((await fetchWithAuth("https://test/late")).status).toBe(401);
  expect(refreshToken).toHaveBeenCalledTimes(1);
  expect(clearUserData).toHaveBeenCalledTimes(1);
  expect(calls).toBe(3);
});

test("ordinary forbidden responses do not trigger CSRF recovery", async () => {
  let csrfCalls = 0;
  let writes = 0;
  installFetch((url) => {
    if (url.endsWith("/csrf-token")) {
      csrfCalls++;
      return csrfResponse("token");
    }
    writes++;
    return Response.json({ message: "Access denied" }, { status: 403 });
  });
  expect((await fetchWithAuth("https://test/forbidden", { method: "POST" })).status).toBe(403);
  expect(csrfCalls).toBe(1);
  expect(writes).toBe(1);
  expect(refreshToken).not.toHaveBeenCalled();
});

test("an authenticated Request body remains available for the permitted replay", async () => {
  const bodies = [];
  globalThis.fetch = async (input, init) => {
    if (String(input).endsWith("/csrf-token")) return csrfResponse("token");
    const request = new Request(input, init);
    bodies.push(await request.text());
    return Response.json({}, { status: bodies.length === 1 ? 401 : 200 });
  };
  const request = new Request("https://test/messages", {
    method: "POST",
    body: "original payload",
  });
  expect((await fetchWithAuth(request)).status).toBe(200);
  expect(bodies).toEqual(["original payload", "original payload"]);
  expect(refreshToken).toHaveBeenCalledTimes(1);
});
