import * as http from "node:http"

const SSE_PORT = 3456

const sseClients: http.ServerResponse[] = []

export interface SseServerHandle {
  stop(): Promise<void>
  broadcast(data: unknown): void
}

export function startSseServer(): SseServerHandle {
  let server: http.Server | undefined = http.createServer((req, res) => {
    if (req.url === "/sse" || req.url === "/") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      })
      sseClients.push(res)
      req.on("close", () => {
        const i = sseClients.indexOf(res)
        if (i !== -1) sseClients.splice(i, 1)
      })
    } else {
      res.writeHead(404)
      res.end()
    }
  })

  server.listen(SSE_PORT, "127.0.0.1", () => {
    console.log("[nkdk] SSE server listening on http://127.0.0.1:" + SSE_PORT + "/sse")
  })

  return {
    stop(): Promise<void> {
      return new Promise((resolve) => {
        if (!server) {
          resolve()
          return
        }
        sseClients.forEach((res) => res.end())
        sseClients.length = 0
        server!.close(() => {
          server = undefined
          resolve()
        })
      })
    },
    broadcast(data: unknown): void {
      const payload = "data: " + JSON.stringify(data) + "\n\n"
      sseClients.forEach((res) => {
        try {
          res.write(payload)
        } catch {
          // client disconnected
        }
      })
    },
  }
}
