const SSE_URL = "http://127.0.0.1:3456/sse"
export const sendEvent = (eventName, data) => {
  const mouseEvent = new MouseEvent("click")
  console.log(eventName, data)
  mouseEvent.eventData1C = { event: eventName, data: data }
  window.dispatchEvent(mouseEvent)
}
function connectSse() {
  const eventSource = new EventSource(SSE_URL)
  eventSource.onmessage = (e) => {
    sendEvent("formUpdate", JSON.stringify(e.data))
  }
  eventSource.onerror = () => {
    eventSource.close()
    setTimeout(connectSse, 3000)
  }
}
connectSse()
