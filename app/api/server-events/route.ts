import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const sendData = (data: any) => {
        const sseData = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(new TextEncoder().encode(sseData))
      }

      const interval = setInterval(() => {
        const data = {
          showNewButton: Math.random() > 0.5,
        }
        sendData(data)
      }, 1000)

      // Очистка при закрытии соединения
      request.signal.addEventListener("abort", () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
