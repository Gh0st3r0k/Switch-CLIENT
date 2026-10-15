/** Poll after each request completes, so slow responses cannot overlap. */
export function poll(task, interval) {
    let stopped = false;
    let timer;
    async function tick() {
        if (stopped) return;
        try {
            await task();
        } catch (error) {
            console.error("Refresh failed:", error);
        } finally {
            if (!stopped) timer = setTimeout(tick, interval);
        }
    }
    const stop = () => {
        stopped = true;
        clearTimeout(timer);
    };
    window.addEventListener("beforeunload", stop, { once: true });
    tick();
    return stop;
}

export function updateStatusIndicator(element, status) {
    if (!element) return;
    const online = status === 1;
    const rgb = online ? "0, 255, 0" : "255, 0, 0";
    element.style.backgroundColor = `rgb(${rgb})`;
    element.style.boxShadow = `0 0 15px rgba(${rgb}, 0.9)`;
    element.title = online ? "Online" : "Offline or unavailable";
}
