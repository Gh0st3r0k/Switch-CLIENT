const API_BASE_URL = "http://localhost:5215/api";

/** Keep HTTP details in the main process; renderers use only the preload bridge. */
function createApiClient(fetchRequest = globalThis.fetch) {
    async function request(path, { method = "GET", body, text = false } = {}) {
        try {
            const response = await fetchRequest(`${API_BASE_URL}${path}`, {
                method,
                signal: AbortSignal.timeout(5000),
                ...(body === undefined
                    ? {}
                    : {
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(body)
                      })
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return text ? await response.text() : await response.json();
        } catch (error) {
            // Do not include request bodies: login requests contain credentials.
            console.error(`[API] ${method} ${path} failed: ${error.message}`);
            return null;
        }
    }

    return {
        login: async (username, password) => {
            const result = await request("/auth/login", {
                method: "POST",
                body: { username, password }
            });
            return result?.status === "ok" ? "ok" : "no";
        },
        fetchPorts: () => request("/ports"),
        fetchPortStatistics: (port) => request(`/ports/statistics/${port}`),
        getPortStatus: async (port) =>
            (await request(`/ports/${port}/status`))?.isEnabled ?? null,
        getPortName: async (port) =>
            (await request(`/ports/${port}/name`))?.name ?? null,
        fetchSettings: () => request("/settings/mac-table/time"),
        updateSettings: (newTime) =>
            request("/settings/mac-table/newTime", {
                method: "POST",
                body: { newTime },
                text: true
            }),
        resetMacTable: () =>
            request("/settings/mac-table/reset", {
                method: "POST",
                text: true
            }),
        resetStatistics: () =>
            request("/settings/statistics/reset", {
                method: "POST",
                text: true
            }),
        fetchMacTable: () => request("/mac-table"),
        getHostName: async () =>
            (await request("/settings/host-name"))?.hostName ?? null,
        setHostName: (hostName) =>
            request("/settings/host-name", {
                method: "POST",
                body: { hostName },
                text: true
            })
    };
}

module.exports = { createApiClient };
