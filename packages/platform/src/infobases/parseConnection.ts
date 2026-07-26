import type { InfobaseConnection } from "./types"

function unquote(value: string): string {
  const trimmed = value.trim()
  return trimmed.startsWith('"') && trimmed.endsWith('"') ? trimmed.slice(1, -1) : trimmed
}

export function parseConnection(raw: string): InfobaseConnection {
  const values = new Map<string, string>()
  let start = 0
  let quoted = false
  const parts: string[] = []
  for (let index = 0; index <= raw.length; index += 1) {
    const character = raw[index]
    if (character === '"') quoted = !quoted
    if ((character === ";" && !quoted) || index === raw.length) {
      const part = raw.slice(start, index).trim()
      if (part !== "") parts.push(part)
      start = index + 1
    }
  }
  for (const part of parts) {
    let separator = -1
    quoted = false
    for (let index = 0; index < part.length; index += 1) {
      if (part[index] === '"') quoted = !quoted
      if (part[index] === "=" && !quoted) {
        separator = index
        break
      }
    }
    if (separator < 1) return { type: "unknown", raw }
    values.set(part.slice(0, separator).trim().toLowerCase(), unquote(part.slice(separator + 1)))
  }
  const file = values.get("file")
  if (file !== undefined) return { type: "file", path: file }
  const server = values.get("srvr")
  const reference = values.get("ref")
  if (server !== undefined && reference !== undefined) return { type: "server", server, reference }
  const web = values.get("ws")
  if (web !== undefined) return { type: "web", url: web }
  return { type: "unknown", raw }
}
