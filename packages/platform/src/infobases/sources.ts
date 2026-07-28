import { posix, win32 } from "node:path"
import type { PlatformRuntime } from "../runtime"
import { readStartupConfiguration } from "../startupConfig"
import type { InfobaseSourceCandidate, InfobaseSourcesResult } from "./types"

function expandEnvironment(value: string, runtime: PlatformRuntime): string {
  const { os, env } = runtime.environment
  if (os === "win32") {
    const windowsEnvironment = new Map(Object.entries(env).map(([name, entry]) => [name.toLowerCase(), entry]))
    return value.replace(/%([^%]+)%/g, (match, name: string) => windowsEnvironment.get(name.toLowerCase()) ?? match)
  }
  return value.replace(/\$(?:\{([^}]+)\}|([A-Za-z_][A-Za-z0-9_]*))/g, (match, braced: string, plain: string) => {
    return env[braced ?? plain] ?? match
  })
}

export async function discoverInfobaseSources(runtime: PlatformRuntime): Promise<InfobaseSourcesResult> {
  const { os, env } = runtime.environment
  const pathApi = os === "win32" ? win32 : posix
  const candidates: InfobaseSourceCandidate[] = []
  const seen = new Set<string>()
  const add = (candidate: InfobaseSourceCandidate) => {
    const normalized = pathApi.normalize(candidate.path)
    const key = os === "win32" ? normalized.toLowerCase() : normalized
    if (seen.has(key)) return
    seen.add(key)
    candidates.push({ ...candidate, path: normalized })
  }

  const personalRoot = os === "win32" ? env.APPDATA : env.HOME
  if (personalRoot !== undefined) {
    add({
      path: pathApi.join(personalRoot, ...(os === "win32" ? ["1C", "1CEStart"] : [".1C", "1cestart"]), "ibases.v8i"),
      kind: "personal",
    })
  }

  const configuration = await readStartupConfiguration(runtime)
  for (const file of configuration.files) {
    for (const entry of file.entries) {
      if (entry.key !== "commoninfobases" || entry.value === "") continue
      const expanded = expandEnvironment(entry.value, runtime)
      add({
        path: pathApi.isAbsolute(expanded) ? expanded : pathApi.resolve(pathApi.dirname(file.path), expanded),
        kind: "common",
      })
    }
  }

  return {
    candidates,
    warnings: configuration.warnings.map(({ source, message }) => ({
      code: "invalid-config",
      source,
      message,
    })),
  }
}
