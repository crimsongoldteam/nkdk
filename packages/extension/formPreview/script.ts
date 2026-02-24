const SSE_URL = "http://127.0.0.1:3456/sse"

export const sendEvent = (eventName: string, data: unknown): void => {
  const mouseEvent = new MouseEvent("click")

  console.log(eventName, data)
  ;(
    mouseEvent as MouseEvent & {
      eventData1C?: { event: string; data: unknown }
    }
  ).eventData1C = { event: eventName, data: data }

  window.dispatchEvent(mouseEvent)
}

function connectSse(): void {
  const eventSource = new EventSource(SSE_URL)

  eventSource.onmessage = (e: MessageEvent) => {
    sendEvent("formUpdate", JSON.stringify(e.data))
  }

  eventSource.onerror = () => {
    eventSource.close()
    setTimeout(connectSse, 3000)
  }
}

connectSse()
