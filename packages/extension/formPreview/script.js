const SSE_URL = "http://127.0.0.1:3456/sse";
export const sendEvent = (eventName, eventParams) => {
    const mouseEvent = new MouseEvent("click");
    console.log(eventName, eventParams);
    mouseEvent.eventData1C = { event: eventName, params: eventParams };
    window.dispatchEvent(mouseEvent);
};
function connectSse() {
    const eventSource = new EventSource(SSE_URL);
    eventSource.onmessage = (e) => {
        try {
            const data = JSON.parse(e.data);
            if (data !== null && typeof data === "object" && "event" in data && "params" in data) {
                const { event: eventName, params } = data;
                sendEvent(eventName, params);
            }
            else {
                sendEvent("formUpdate", { form: data });
            }
        }
        catch (err) {
            console.warn("[formPreview] SSE parse error:", err);
        }
    };
    eventSource.onerror = () => {
        eventSource.close();
        setTimeout(connectSse, 3000);
    };
}
connectSse();
