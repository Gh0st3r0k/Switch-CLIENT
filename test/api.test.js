const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createApiClient } = require("../src/api");

function jsonResponse(value) {
    return { ok: true, json: async () => value };
}

test("login submits credentials as JSON and reads the server status", async () => {
    const api = createApiClient(async (url, options) => {
        assert.equal(url, "http://localhost:5215/api/auth/login");
        assert.equal(options.method, "POST");
        assert.equal(options.headers["Content-Type"], "application/json");
        assert.deepEqual(JSON.parse(options.body), {
            username: "demo",
            password: "test-only"
        });
        assert.ok(options.signal instanceof AbortSignal);
        return jsonResponse({ status: "ok" });
    });
    assert.equal(await api.login("demo", "test-only"), "ok");
});

test("an HTTP success without an accepted login status is rejected", async () => {
    const api = createApiClient(async () => jsonResponse({ status: "no" }));
    assert.equal(await api.login("demo", "test-only"), "no");
});

test("status and name responses are unwrapped without losing numeric status", async () => {
    const api = createApiClient(async (url) =>
        jsonResponse(
            url.endsWith("/status") ? { isEnabled: 0 } : { name: "Ethernet" }
        )
    );
    assert.equal(await api.getPortStatus(2), 0);
    assert.equal(await api.getPortName(2), "Ethernet");
});

test("settings keep the API's millisecond units and accept text responses", async () => {
    const api = createApiClient(async (url, options) => {
        assert.ok(url.endsWith("/settings/mac-table/newTime"));
        assert.deepEqual(JSON.parse(options.body), { newTime: 5000 });
        return { ok: true, text: async () => "Settings updated." };
    });
    assert.equal(await api.updateSettings(5000), "Settings updated.");
});

test("network errors return null without logging submitted credentials", async (context) => {
    const messages = [];
    context.mock.method(console, "error", (message) => messages.push(message));
    const api = createApiClient(async () => {
        throw new Error("Connection refused");
    });
    assert.equal(await api.setHostName("test-only-name"), null);
    assert.equal(messages.length, 1);
    assert.ok(!messages[0].includes("test-only-name"));
});

test("HTTP failures do not masquerade as empty port or MAC tables", async (context) => {
    context.mock.method(console, "error", () => {});
    const api = createApiClient(async () => ({ ok: false, status: 503 }));
    assert.equal(await api.fetchPorts(), null);
    assert.equal(await api.fetchMacTable(), null);
    assert.equal(await api.login("demo", "test-only"), "no");
});

test("malformed JSON is handled as a failed request", async (context) => {
    context.mock.method(console, "error", () => {});
    const api = createApiClient(async () => ({
        ok: true,
        json: async () => {
            throw new SyntaxError("Invalid JSON");
        }
    }));
    assert.equal(await api.fetchSettings(), null);
});
