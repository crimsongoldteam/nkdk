import { spawnSync } from "node:child_process"
import { delimiter } from "node:path"
import { projectRoot, toolBinDir } from "./paths.mjs"

export function runDepcruise(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? projectRoot,
    encoding: "utf8",
    stdio: options.capture === false ? "inherit" : "pipe",
    env: {
      ...process.env,
      PATH: `${toolBinDir}${delimiter}${process.env.PATH ?? ""}`,
    },
  })

  if (result.error) throw result.error
  if (!options.allowFailure && result.status !== 0) {
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim()
    throw new Error(output || `${command} завершился с кодом ${result.status}`)
  }

  return result
}

export function assertUsableTypeScript(info) {
  const hasCompiler = /✔ typescript\s+[^\n]*typescript@6\.0\.3/u.test(info)
  const hasExtensions = [
    /^\s*✔ \.ts\s*$/mu,
    /^\s*✔ \.tsx\s*$/mu,
    /^\s*✔ \.d\.ts\s*$/mu,
  ].every((pattern) => pattern.test(info))

  if (!hasCompiler || !hasExtensions) {
    throw new Error("TypeScript-парсер dependency-cruiser недоступен или неполон")
  }
}

export function readDepcruiseInfo() {
  const result = runDepcruise("dependency-cruise", ["--info"])
  const info = `${result.stdout}${result.stderr}`
  assertUsableTypeScript(info)
  return info
}
