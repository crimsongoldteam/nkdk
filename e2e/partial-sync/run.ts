import { spawn } from "node:child_process"
import { createRequire } from "node:module"
import { dirname, isAbsolute, resolve } from "node:path"
import { pathToFileURL } from "node:url"

export type PartialSyncArgs = {
  readonly root: string
}

export type PartialSyncCliDependencies = {
  readonly vitestPath: string
  runProcess(
    command: string,
    args: readonly string[],
    options: { readonly env: NodeJS.ProcessEnv }
  ): Promise<{ readonly exitCode: number }>
}

export function parsePartialSyncArgs(argv: readonly string[]): PartialSyncArgs {
  let root: string | undefined
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument !== "--root") throw new Error(`Неизвестный аргумент: ${argument}`)
    if (root !== undefined) throw new Error("Аргумент --root можно передать только один раз")
    const value = argv[index + 1]
    if (value === undefined || value.startsWith("--")) {
      throw new Error("Аргумент --root требует путь")
    }
    if (!isAbsolute(value)) throw new Error("Аргумент --root должен содержать абсолютный путь")
    root = resolve(value)
    index += 1
  }
  if (root === undefined) throw new Error("Не задан обязательный аргумент --root")
  return { root }
}

export async function runPartialSyncCli(
  argv: readonly string[],
  dependencies: PartialSyncCliDependencies = nodeDependencies
): Promise<void> {
  const { root } = parsePartialSyncArgs(argv)
  const outcome = await dependencies.runProcess(
    process.execPath,
    [dependencies.vitestPath, "run", "--config", "e2e/partial-sync/vitest.config.ts"],
    { env: { ...process.env, NKDK_PARTIAL_SYNC_ROOT: root } }
  )
  if (outcome.exitCode !== 0) {
    throw new Error(`Сценарий partial sync завершился с кодом ${outcome.exitCode}`)
  }
}

const require = createRequire(import.meta.url)
const vitestPackagePath = require.resolve("vitest/package.json")
const nodeDependencies: PartialSyncCliDependencies = {
  vitestPath: resolve(dirname(vitestPackagePath), "vitest.mjs"),
  runProcess(command, args, options) {
    return new Promise((resolvePromise, reject) => {
      const child = spawn(command, args, {
        cwd: resolve(import.meta.dirname, "../.."),
        env: options.env,
        shell: false,
        stdio: "inherit",
      })
      child.once("error", reject)
      child.once("exit", (code, signal) => {
        if (signal !== null) {
          reject(new Error(`Vitest остановлен сигналом ${signal}`))
          return
        }
        resolvePromise({ exitCode: code ?? 1 })
      })
    })
  },
}

const isCliEntrypoint = process.argv[1] !== undefined &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url

if (isCliEntrypoint) {
  runPartialSyncCli(process.argv.slice(2)).catch((caught: unknown) => {
    process.stderr.write(`${caught instanceof Error ? caught.message : String(caught)}\n`)
    process.exitCode = 1
  })
}
