import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)

export const mcpSourceLaunch = {
  command: process.execPath,
  args: ["--import", require.resolve("tsx"), fileURLToPath(new URL("./server.ts", import.meta.url))],
  cwd: fileURLToPath(new URL("..", import.meta.url)),
}
