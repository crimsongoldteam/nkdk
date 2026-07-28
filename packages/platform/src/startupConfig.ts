import { posix, win32 } from "node:path"
import type { PlatformRuntime } from "./runtime"

export type ConfigEntry = { key: string; value: string; order: number }
export type StartupConfigKind = "common-config" | "all-users-config" | "user-config"
export type StartupConfigFile = { path: string; kind: StartupConfigKind; entries: ConfigEntry[] }
export type ConfigWarning = { source: string; message: string }
export type StartupConfiguration = { files: StartupConfigFile[]; warnings: ConfigWarning[] }

function parseConfig(text: string): ConfigEntry[] {
  const entries: ConfigEntry[] = []
  for (const [order, rawLine] of text.replace(/^\uFEFF/, "").split(/\r?\n/).entries()) {
    const line = rawLine.trim()
    if (line === "" || line.startsWith("#") || line.startsWith(";")) continue
    const separator = line.indexOf("=")
    if (separator < 1) continue
    entries.push({
      key: line.slice(0, separator).trim().toLowerCase(),
      value: line.slice(separator + 1).trim().replace(/^"(.*)"$/, "$1"),
      order,
    })
  }
  return entries
}

export function localStartupConfigPaths(runtime: PlatformRuntime): Array<{ path: string; kind: StartupConfigKind }> {
  const { os, env } = runtime.environment
  const pathApi = os === "win32" ? win32 : posix
  if (os === "win32") {
    return [
      ...(env.APPDATA ? [{ path: pathApi.join(env.APPDATA, "1C", "1CEStart", "1CEStart.cfg"), kind: "user-config" as const }] : []),
      ...(env.ALLUSERSPROFILE
        ? [{ path: pathApi.join(env.ALLUSERSPROFILE, "1C", "1CEStart", "1CEStart.cfg"), kind: "all-users-config" as const }]
        : []),
    ]
  }
  return env.HOME
    ? [{ path: pathApi.join(env.HOME, ".1C", "1cestart", "1cestart.cfg"), kind: "user-config" }]
    : []
}

export async function readStartupConfiguration(runtime: PlatformRuntime): Promise<StartupConfiguration> {
  const pathApi = runtime.environment.os === "win32" ? win32 : posix
  const files: StartupConfigFile[] = []
  const warnings: ConfigWarning[] = []
  const queue = [...localStartupConfigPaths(runtime)]
  const seen = new Set<string>()
  const keyOf = (path: string) => {
    const normalized = pathApi.normalize(path)
    return runtime.environment.os === "win32" ? normalized.toLowerCase() : normalized
  }

  while (queue.length > 0) {
    const current = queue.shift()
    if (current === undefined || seen.has(keyOf(current.path))) continue
    seen.add(keyOf(current.path))
    let text: string
    try {
      text = await runtime.fs.readFile(current.path)
    } catch (caught) {
      const code = (caught as { code?: string }).code
      if (code !== "ENOENT" || current.kind === "common-config") {
        warnings.push({ source: current.path, message: caught instanceof Error ? caught.message : String(caught) })
      }
      continue
    }
    const entries = parseConfig(text)
    files.push({ path: current.path, kind: current.kind, entries })
    for (const entry of entries) {
      if (entry.key !== "commoncfglocation" || entry.value === "") continue
      queue.push({
        path: pathApi.isAbsolute(entry.value) ? entry.value : pathApi.resolve(pathApi.dirname(current.path), entry.value),
        kind: "common-config",
      })
    }
  }
  return { files, warnings }
}
