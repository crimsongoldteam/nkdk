import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

export function parsePositiveIntegerOption(option: string, value: string | undefined): number {
  if (value === undefined || !/^[1-9][0-9]*$/.test(value)) {
    throw new Error(`${option} должен быть положительным целым числом`)
  }
  return Number(value)
}

export function parseProjectDirectoryArgument(
  current: string | undefined,
  argument: string,
): string {
  if (argument.startsWith("-")) throw new Error(`Неизвестный параметр ${argument}`)
  if (current !== undefined) throw new Error("Можно указать только один каталог проекта")
  return resolve(argument)
}

export function requireProjectDirectory(projectDir: string | undefined): string {
  if (projectDir === undefined) throw new Error("Не указан каталог проекта")
  return projectDir
}

export async function runJsonMeasureCli(
  moduleUrl: string,
  execute: () => Promise<unknown>,
  options: { readonly pretty?: boolean; readonly errorAsJson?: boolean } = {},
): Promise<void> {
  const entry = process.argv[1]
  if (entry === undefined || resolve(entry) !== fileURLToPath(moduleUrl)) return
  try {
    console.log(JSON.stringify(await execute(), null, options.pretty ? 2 : undefined))
  } catch (caught) {
    const error = caught as Error & { code?: string }
    console.error(options.errorAsJson
      ? JSON.stringify({ error: error.message, code: error.code })
      : error.message)
    process.exitCode = 1
  }
}
