import * as fs from "node:fs/promises"
import * as http from "node:http"
import * as path from "node:path"

const SSE_PORT = 3456

const sseClients: http.ServerResponse[] = []

const SCRIPT_PLACEHOLDER = '<script type="module" src="./script.js"></script>'

export interface SseServerHandle {
  stop(): Promise<void>
  broadcast(data: unknown): void
}

export function startSseServer(formPreviewDir: string | undefined): SseServerHandle {
  let server: http.Server | undefined = http.createServer(async (req, res) => {
    const url = req.url?.split("?")[0] ?? "/"

    if (url === "/sse") {
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
      return
    }

    if (formPreviewDir && (url === "/" || url === "/index.html")) {
      try {
        const [htmlRaw, scriptRaw] = await Promise.all([
          fs.readFile(path.join(formPreviewDir, "index.html"), "utf-8"),
          fs.readFile(path.join(formPreviewDir, "script.js"), "utf-8"),
        ])
        const scriptTag = `<script type="module">\n${scriptRaw}\n</script>`
        const page = htmlRaw.replace(SCRIPT_PLACEHOLDER, scriptTag)
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
        res.end(page)
      } catch (err) {
        console.warn("[nkdk] Form preview files not found:", err)
        res.writeHead(404)
        res.end()
      }
      return
    }

    res.writeHead(404)
    res.end()
  })

  const baseUrl = "http://127.0.0.1:" + SSE_PORT
  server.listen(SSE_PORT, "127.0.0.1", () => {
    console.log("[nkdk] SSE server: " + baseUrl + "/sse")
    if (formPreviewDir) {
      console.log("[nkdk] Form preview: " + baseUrl + "/")
    }
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
